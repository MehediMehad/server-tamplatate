import * as bcrypt from "bcrypt";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../config";
import prisma from "../../config/prisma";
import crypto from "crypto";
import sentEmailUtility from "../../utils/sentEmailUtility";
import { UserStatusEnum } from "@prisma/client";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import ApiError from "../../errors/ApiError";
import { emailText } from "../../utils/emailTemplate";
import {
  generateOTP,
  getOTPExpiry,
  sendEmailVerificationOTP,
} from "./auth.utils";

const loginUserFromDB = async (payload: {
  email: string;
  password: string;
  fcmToken?: string;
}) => {
  // Find the user by email
  const userData = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!userData) {
    throw new ApiError(httpStatus.FORBIDDEN, "User Not Found");
  }

  if (userData.status === UserStatusEnum.BLOCKED) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Your account is currently BLOCKED." // Please contact support for assistance.
    );
  }

  if (userData.status === UserStatusEnum.DEACTIVATE || !userData.isVerified) {
    return await sendEmailVerificationOTP(userData.email);
  }

  // Check if the password is correct
  const isCorrectPassword = await bcrypt.compare(
    payload.password,
    userData.password as string
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect");
  }

  // Update the FCM token if provided
  let updatedFcmToken;
  if (payload?.fcmToken) {
    updatedFcmToken = await prisma.user.update({
      where: {
        email: payload.email, // Use email as the unique hexCode for updating
      },
      data: {
        fcmToken: payload.fcmToken,
      },
    });
  }

  let updatedUser;
  if (isCorrectPassword) {
    updatedUser = await prisma.user.update({
      where: {
        email: payload.email,
      },
      data: {
        isVerified: true,
        status: UserStatusEnum.ACTIVE,
        fcmToken: payload.fcmToken,
      },
    });
  }

  // Generate an access token
  const accessToken = jwtHelpers.generateToken(
    {
      id: userData.id,
      email: userData.email as string,
      role: userData.role,
    },
    config.jwt.access_secret as Secret,
    config.jwt.access_expires_in
  );

  // Return user details and access token
  return {
    id: userData.id,
    email: userData.email,
    role: userData.role,
    isProfileUpdate: userData.isProfileUpdate,
    status: updatedUser?.status ?? userData.status,
    isVerified: updatedUser?.isVerified ?? userData.isVerified,
    fcmToken: updatedFcmToken?.fcmToken ?? userData.fcmToken,
    accessToken: accessToken,
  };
};

const verifyEmail = async (
  hexCode: string,
  otpCode: string,
  fcmToken?: string
) => {
  return await prisma.$transaction(async (prisma) => {
    // Find OTP record
    const otpRecord = await prisma.otp.findFirst({
      where: { hexCode: hexCode, otp: otpCode },
    });
    //
    if (otpRecord?.otp !== otpCode) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP or expired OTP");
    }

    if (!otpRecord) {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid OTP or expired OTP");
    }

    // Delete OTP record
    await prisma.otp.deleteMany({ where: { email: otpRecord.email } });

    // Update user verification status
    const updatedUser = await prisma.user.update({
      where: { email: otpRecord.email },
      data: {
        isVerified: true,
        status: UserStatusEnum.ACTIVE,
        fcmToken: fcmToken || null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        isVerified: true,
        fcmToken: true,
        isProfileUpdate: true,
      },
    });

    // Generate access token
    const accessToken = jwtHelpers.generateToken(
      {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in as string
    );

    return {
      ...updatedUser,
      accessToken,
    };
  });
};

const forgotPassword = async (payload: { email: string }) => {
  const contact = payload.email;
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact);
  const isPhone = /^\+?[0-9]{10,15}$/.test(contact); //

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found! with this email " + payload.email
    );
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
  const identifier = crypto.randomBytes(16).toString("hex");

  // Save OTP to database
  const userData = await prisma.otp.upsert({
    where: { email: user.email },
    update: {
      email: user.email,
      otp: otpCode,
      expiry: expiry,
      hexCode: identifier,
    },
    create: {
      email: user.email,
      otp: otpCode,
      expiry: expiry,
      hexCode: identifier,
    },
  });

  if (isPhone && userData) {
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const hexCode = crypto.randomBytes(16).toString("hex");

    await prisma.otp.upsert({
      where: { email: payload.email },
      update: { otp: otpCode, expiry },
      create: {
        email: payload.email,
        otp: otpCode,
        expiry,
        hexCode: userData.hexCode,
      },
    });

    return {
      hexCode: userData.hexCode,
    };
  }
  // Send OTP via email
  if (isEmail && userData) {
    await sentEmailUtility(
      user.email,
      "Reset Your Password",
      emailText("Reset Password", otpCode)
    );
    return {
      hexCode: userData.hexCode,
    };
  }
};

const verifyOtpCode = async (payload: { hexCode: string; otpCode: string }) => {
  const otpRecord = await prisma.otp.findFirst({
    where: {
      hexCode: payload.hexCode,
      otp: payload.otpCode,
    },
  });

  if (!otpRecord) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid OTP");
  }

  // Check if OTP is expired
  if (new Date() > otpRecord.expiry) {
    // If valid, delete the OTP from the database
    await prisma.otp.delete({
      where: {
        id: otpRecord.id,
      },
    });

    throw new ApiError(
      httpStatus.GONE,
      "The OTP has expired. Please request a new one."
    );
  }
  // If OTP is valid, delete the OTP from the database
  const [user, record] = await prisma.$transaction([
    prisma.user.findUnique({
      where: { email: otpRecord.email },
      select: {
        id: true,
        email: true,
      },
    }),
    prisma.otp.delete({
      where: {
        id: otpRecord.id,
      },
    }),
  ]);

  if (!user) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found! user is possibly deleted by mistake please register"
    );
  }
  // Generate an access token
  const accessToken = jwtHelpers.generateToken(
    {
      id: user.id,
    },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_expires_in as string
  );
  // Hash the new password
  return { accessToken };
};

const resetPassword = async (
  userId: string,
  payload: {
    password: string;
  }
) => {
  const userToUpdate = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!userToUpdate) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found in the database.");
  }

  // If valid, delete the OTP from the database
  const updatedUser = await prisma.user.update({
    where: { id: userToUpdate.id },
    data: {
      password: await bcrypt.hash(
        payload.password,
        Number(config.bcrypt_salt_rounds)
      ),
    },
  });

  if (!updatedUser) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "User not found in the database."
    );
  }
  return {
    message: "password updated successfully",
  };
};

const changePassword = async (payload: {
  id: string;
  newPassword: string;
  oldPassword: string;
}) => {
  const userData = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      password: true,
      email: true,
      id: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!userData) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found!, If you have already have account please reset your password"
    );
  }

  // Check if the user status is BLOCKED
  if (userData.status === UserStatusEnum.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account has been blocked.");
  }

  // Check if the password is correct
  const isCorrectPassword = await bcrypt.compare(
    payload.oldPassword,
    userData.password as string
  );

  if (!isCorrectPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Password incorrect");
  }
  // Hash the user's password

  const hashedPassword = await bcrypt.hash(
    payload.newPassword,
    Number(config.bcrypt_salt_rounds)
  );
  // Update the user's password in the database template
  const updatedUser = await prisma.user.update({
    where: { id: payload.id },
    data: {
      password: hashedPassword,
    },
  });
  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found in the database.");
  }
  return {
    message: "password changed successfully",
  };
};

const resendOTP = async (payload: { email: string; hexCode?: string }) => {
  return await prisma.$transaction(async (tx) => {
    // Find the user by email
    const user = await tx.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        "User not found with this email"
      );
    }

    // Check if user is blocked
    if (user.status === UserStatusEnum.BLOCKED) {
      throw new ApiError(
        httpStatus.FORBIDDEN,
        "Your account is currently blocked"
      );
    }

    // Find existing OTP record if hexCode is provided
    let existingOtp;
    if (payload.hexCode) {
      existingOtp = await tx.otp.findFirst({
        where: {
          email: payload.email,
          hexCode: payload.hexCode,
        },
      });

      if (!existingOtp) {
        throw new ApiError(httpStatus.NOT_FOUND, "Invalid OTP request");
      }
    }

    // Generate new OTP and related data
    const otpCode = generateOTP();
    const newHexCode = crypto.randomUUID();
    const expiry = getOTPExpiry();

    // Update or create OTP record
    const otpData = await tx.otp.upsert({
      where: {
        email: payload.email,
      },
      update: {
        otp: otpCode,
        hexCode: newHexCode,
        expiry: expiry,
      },
      create: {
        email: payload.email,
        otp: otpCode,
        hexCode: newHexCode,
        expiry: expiry,
      },
    });

    // Send OTP email
    await sentEmailUtility(
      payload.email,
      "Verify Your Email",
      emailText("Verify Your Email", otpCode)
    );

    return {
      hexCode: otpData.hexCode,
      message: "OTP resent successfully",
    };
  });
};

const setNewPassword = async (payload: { id: string; password: string }) => {
  const userData = await prisma.user.findUnique({
    where: { id: payload.id },
    select: {
      password: true,
      email: true,
      id: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!userData) {
    throw new ApiError(
      httpStatus.NOT_FOUND,
      "User not found!, If you have already have account please reset your password"
    );
  }

  // Check if the user status is BLOCKED
  if (userData.status === UserStatusEnum.BLOCKED) {
    throw new ApiError(httpStatus.FORBIDDEN, "Your account has been blocked.");
  }

  const hashedPassword = await bcrypt.hash(
    payload.password,
    Number(config.bcrypt_salt_rounds)
  );
  // Update the user's password in the database template
  const updatedUser = await prisma.user.update({
    where: { id: payload.id },
    data: {
      password: hashedPassword,
    },
  });
  if (!updatedUser) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found in the database.");
  }
  return {
    message: "password updated successfully",
  };
};

export const AuthServices = {
  loginUserFromDB,
  forgotPassword,
  verifyEmail,
  verifyOtpCode,
  resetPassword,
  changePassword,
  resendOTP,
  setNewPassword,
};
