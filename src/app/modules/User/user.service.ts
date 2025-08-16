import { UserRoleEnum, UserStatusEnum } from "@prisma/client";
import prisma from "../../config/prisma";
import { S3Uploader } from "../../lib/S3Uploader";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { MAX_IMAGE_SIZE } from "./user.constants";
import { generateOTP, hashPasswordGenerator } from "../../helpers/auth";
import { emailText } from "../../utils/emailTemplate";
import sentEmailUtility from "../../utils/sentEmailUtility";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import config from "../../config";
import { Secret } from "jsonwebtoken";
import { CreateUsersPayload, SocialLoginRequestBody } from "./user.interface";
import { Request } from "express";
import {
  getMusicianProfileInfo,
  getUsersProfileInfo,
  getVocalistProfileInfo,
  updateMusicianInfo,
  updateUsersInfo,
  updateVocalistInfo,
} from "./user.utils";

// Register User With Sending Email
const createUsers = async (payload: CreateUsersPayload) => {
  const { name, email, password, address, latitude, longitude, role } = payload;

  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Email already exists");
  }

  const hashedPassword = await hashPasswordGenerator(password);
  // Generate and store OTP
  const { otpCode, hexCode, expiry } = generateOTP(5);

  const result = await prisma.$transaction(async (tx) => {
    // First create the user
    const createdUser = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        address,
        latitude,
        longitude,
      },
    });

    await tx.otp.create({
      data: {
        email,
        otp: otpCode,
        hexCode,
        expiry,
      },
    });

    // Depending on role, create musician or vocalist
    if (role === UserRoleEnum.MUSICIAN) {
      await tx.musician.create({
        data: {
          name,
          email,
          userId: createdUser.id,
          address,
          latitude,
          longitude,
          // add other required fields here
        },
      });
    } else if (role === UserRoleEnum.VOCALIST) {
      await tx.vocalists.create({
        data: {
          name,
          email,
          userId: createdUser.id,
          address,
          latitude,
          longitude,
          // add other required fields here
        },
      });
    }

    return {
      userId: createdUser.id,
      email: createdUser.email,
      hexCode,
      otpCode,
    };
  });

  // ✅ Send email outside the DB transaction
  await sentEmailUtility(
    email,
    "Verify Your Email",
    emailText("Verify Your Email", result.otpCode)
  ).catch((err) => {
    console.error("📧 Email sending error for:", email, err?.message || err);
    console.error("❌ Error details:", err);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to send verification email"
    );
  });

  return {
    id: result.userId,
    name,
    email: result.email,
    address,
    latitude,
    longitude,
    hexCode: result.hexCode,
  };
};

const socialLogin = async (payload: SocialLoginRequestBody) => {
  const user = await prisma.user.findFirst({
    where: { email: payload.email },
  });

  if (user) {
    await prisma.user.update({
      where: { id: user.id },
      data: { fcmToken: payload.fcmToken || null },
    });

    const accessToken = jwtHelpers.generateToken(
      {
        id: user.id,
        email: user.email as string,
        role: user.role,
      },
      config.jwt.access_secret as Secret,
      config.jwt.access_expires_in
    );

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      accessToken,
    };
  }
};

const getMyProfile = async (
  role: "USER" | "MUSICIAN" | "VOCALIST",
  userId: string
) => {
  const user = await prisma.user.findFirst({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User NOT FOUND");
  }

  // Handle registration based on role
  switch (role) {
    case "USER":
      return await getUsersProfileInfo(user.id);
    case "VOCALIST":
      return await getVocalistProfileInfo(user.id);
    case "MUSICIAN":
      return await getMusicianProfileInfo(user.id);
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid role provided");
  }
};

const updateUserInfo = async (
  role: "USER" | "MUSICIAN" | "VOCALIST",
  userId: string,
  req: Request & { body: any; files?: any }
) => {
  // Validate user
  // console.log("😍 req.files:", JSON.stringify(req.files, null, 2));

  const user = await prisma.user.findFirst({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User NOT FOUND");
  }

  // Step 1: Image Handling
  let imageUrl = req.body.profileImage || "";

  // Image Handling
  if (
    req.files &&
    req.files.profileImage &&
    req.files.profileImage.length > 0
  ) {
    const imageFile = req.files.profileImage[0];

    // Validate file size
    if (imageFile.size > MAX_IMAGE_SIZE) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Image size exceeds 10MB limit."
      );
    }

    // Upload to S3
    const imageUploadResult = await S3Uploader.uploadToS3(
      imageFile,
      "profile/images"
    );
    imageUrl = imageUploadResult.Location;
  }

  // Handle registration based on role
  switch (role) {
    case "USER":
      return await updateUsersInfo(user.id, req.body, imageUrl);
    case "VOCALIST":
      return await updateVocalistInfo(user.id, req.body, imageUrl, req);
    case "MUSICIAN":
      return await updateMusicianInfo(user.id, req.body, imageUrl, req);
    default:
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid role provided");
  }
};

const updateUserRoleStatus = async (
  userId: string, // status changed id
  payload: { status: "BLOCKED" | "ACTIVE" }
) => {
  if (!userId) {
    throw new ApiError(httpStatus.BAD_REQUEST, "UserId is required");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User Not Found!");
  }

  // Update user status
  const result = await prisma.user.update({
    where: { id: userId },
    data: { status: payload.status as UserStatusEnum },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { message: `User status updated to ${payload.status}`, user: result };
};

export const UserServices = {
  createUsers,
  socialLogin,
  getMyProfile,
  updateUserInfo,
  updateUserRoleStatus,
};
