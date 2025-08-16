import dotenv from "dotenv";
import path from "path";

// 🧪 Load environment variables from .env file
dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  // 🌍 Application Environment
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5030,

  // 🔐 Authentication & Security
  super_admin_password: process.env.SUPER_ADMIN_PASSWORD,
  bcrypt_salt_rounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,

  // 🔑 JWT Configuration
  jwt: {
    access_secret: process.env.JWT_ACCESS_SECRET as string,
    access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN || "30d",

    refresh_secret: process.env.JWT_REFRESH_SECRET as string,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN || "7d",

    reset_pass_secret: process.env.JWT_RESET_PASS_SECRET as string,
    reset_pass_expires_in: process.env.JWT_RESET_PASS_EXPIRES_IN || "10m",
  },

  // 📧 Email Sender Configuration
  emailSender: {
    email: process.env.EMAIL,
    app_pass: process.env.APP_PASS,
    contact_mail_address: process.env.CONTACT_MAIL_ADDRESS, // optional
  },

  // 💳 Stripe Configuration
  stripe: {
    secret_key: process.env.STRIPE_SECRET_KEY,
    publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
  },

  // ☁️ S3 / DigitalOcean Spaces Configuration
  S3: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
    region: process.env.S3_REGION || "nyc3",
    bucketName: process.env.S3_BUCKET_NAME || "smtech-space",
    endpoint: process.env.S3_ENDPOINT || "https://nyc3.digitaloceanspaces.com",
  },

  // 🔗 External URLs
  serverUrl: process.env.SERVER_URL,
};

export default config;
