import sentEmailUtility from "../../utils/sentEmailUtility";
import { emailText } from "../../utils/emailTemplate";
import prisma from "../../config/prisma";
import { generateOTP as generateOTPFromHelpers } from "../../helpers/auth";

// Utility to generate a 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a random 6-digit number
};

// Utility to calculate OTP expiry (e.g., 5 minutes from now)
export const getOTPExpiry = () => {
  return new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry
};

export const sendOTPEmail = async (email: string, otpCode: string) => {
  await sentEmailUtility(
    email,
    "Verify Your Email",
    emailText("Verify Your Email", otpCode)
  );
};

export const sendEmailVerificationOTP = async (email: string) => {
  const { expiry, hexCode, otpCode } = generateOTPFromHelpers(5);

  // Delete existing OTPs
  await prisma.otp.deleteMany({
    where: {
      email,
    },
  });

  // Create new OTP entry
  await prisma.otp.create({
    data: {
      email,
      hexCode,
      otp: otpCode,
      expiry,
    },
  });

  // Send OTP via email
  await sentEmailUtility(
    email,
    "Verify Your Email",
    emailText("Verify Your Email", otpCode)
  );

  return {
    email,
    hexCode,
  };
};
