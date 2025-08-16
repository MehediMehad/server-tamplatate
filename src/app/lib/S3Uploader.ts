import fs from "fs/promises";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import config from "../config";
import { s3Client } from "./s3Client";
import httpStatus from "http-status";
import ApiError from "../errors/ApiError";

// **Multipart Upload to DigitalOcean Spaces**
const uploadToS3 = async (
  file: Express.Multer.File,
  folder?: string
): Promise<{ Location: string; Bucket: string; Key: string }> => {
  if (!file) {
    throw new ApiError(httpStatus.BAD_REQUEST, "File not found.");
  }
  if (!file.path || !file.mimetype || !file.originalname) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "File path, mimetype, or originalname not found."
    );
  }
  const Bucket = config.S3.bucketName || "";
  const Key = folder
    ? `eshofer/${folder}/${file.originalname}`
    : `eshofer/${file.originalname}`;

  try {
    const fileBuffer = await fs.readFile(file.path);
    const command = new PutObjectCommand({
      Bucket: config.S3.bucketName,
      Key,
      Body: fileBuffer,
      ACL: "public-read",
      ContentType: file.mimetype,
    });

    const uploadResult = await s3Client.send(command);

    if (!uploadResult) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Failed to upload file."
      );
    }

    return {
      Location: `https://${Bucket}.${config.S3.region}.digitaloceanspaces.com/${Key}`,
      Bucket,
      Key,
    };
  } catch (error) {
    console.error("Error in multipart upload:", error);
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Failed to upload file."
    );
  }
};

// Upload multiple files to S3
const uploadMultipleFilesToS3 = async (
  files: Express.Multer.File[],
  folder?: string
): Promise<{ Location: string; Bucket: string; Key: string }[]> => {
  const uploadPromises = files.map((file) => uploadToS3(file, folder));
  return Promise.all(uploadPromises);
};

// Export file uploader methods
export const S3Uploader = {
  uploadToS3,
  uploadMultipleFilesToS3,
};
