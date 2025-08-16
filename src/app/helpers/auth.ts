import crypto from "crypto";
import { sendOTPEmail } from "../modules/auth/auth.utils";
import bcrypt from "bcrypt";

export const hashPasswordGenerator = async (
  password: string
): Promise<string> => {
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  return hashedPassword;
};

// Function to generate OTP and expiry for a user
export const generateOTP = (minute: number) => {
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = new Date(Date.now() + minute * 60 * 1000); // 10 minutes expiry
  const hexCode = crypto.randomBytes(16).toString("hex");
  return { otpCode, expiry, hexCode };
};

// Create a new OTP or update the existing one in the database
const saveOrUpdateOTP = async (
  email: string,
  otpCode: string,
  expiry: Date,
  identifier: string,
  transactionClient: any
) => {
  return await transactionClient.otp.upsert({
    where: { email },
    update: { otp: otpCode, expiry, hexCode: identifier },
    create: { email, otp: otpCode, expiry, hexCode: identifier },
  });
};

export const OTPGenerationSavingAndSendingEmail = async (
  email: string,
  transactionClient: any,
  minutes?: number
): Promise<{ hexCode: string }> => {
  const { otpCode, expiry, hexCode } = generateOTP(minutes || 5); // 5 minutes expiry
  await saveOrUpdateOTP(email, otpCode, expiry, hexCode, transactionClient);
  await sendOTPEmail(email, otpCode);
  return { hexCode };
};
