import prisma from "../../config/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import {
  allowedVideoTypes,
  MAX_IMAGE_SIZE,
  MAX_VIDEO_SIZE,
} from "./user.constants";
import {
  MusicianUpdateInput,
  UserUpdateInput,
  VocalistUpdateInput,
} from "./user.interface";
import { S3Uploader } from "../../lib/S3Uploader";
import { removeAllFilesInUploadsFolder } from "../../helpers/removeAllFilesInUploadsFolder";
import { createStripeConnectAccount } from "../../helpers/createStripeConnectAccount";

export const updateUsersInfo = async (
  userId: string,
  data: UserUpdateInput,
  imageUrl: string
) => {
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      image: imageUrl,
      isProfileUpdate: true,
      updatedAt: new Date(),
    },
    select: {
      name: true,
      email: true,
      address: true,
      latitude: true,
      longitude: true,
      image: true,
      isProfileUpdate: true,
      updatedAt: true,
    },
  });

  removeAllFilesInUploadsFolder();
  return updatedUser;
};

export const updateMusicianInfo = async (
  userId: string,
  data: MusicianUpdateInput,
  imageUrl: string,
  req: any
) => {
  let licenseUrl = req.body.license;
  let musicalCertificationUrl = req.body.musicalCertification;
  // license Handling
  if (req.files && req.files.license && req.files.license.length > 0) {
    const imageFile = req.files.license[0];

    // Validate file size
    if (imageFile.size > MAX_IMAGE_SIZE) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "license size exceeds 10MB limit."
      );
    }

    // Upload to S3
    const imageUploadResult = await S3Uploader.uploadToS3(
      imageFile,
      "license/images"
    );
    licenseUrl = imageUploadResult.Location;
  }

  // musicalCertification Handling
  if (
    req.files &&
    req.files.musicalCertification &&
    req.files.musicalCertification.length > 0
  ) {
    const imageFile = req.files.musicalCertification[0];

    // Validate file size
    if (imageFile.size > MAX_IMAGE_SIZE) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "musicalCertification size exceeds 10MB limit."
      );
    }

    // Upload to S3
    const imageUploadResult = await S3Uploader.uploadToS3(
      imageFile,
      "musicalCertification/images"
    );
    musicalCertificationUrl = imageUploadResult.Location;
  }

  const existUser = await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
    },
    include: {
      musician: true,
    },
  });

  if (existUser && !existUser.connectAccountId) {
    await createStripeConnectAccount(existUser.id);
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        name: data.name || existUser.name,
        image: imageUrl || existUser.image,
        latitude: data.latitude || existUser.latitude,
        longitude: data.longitude || existUser.longitude,
        updatedAt: new Date(),
        isProfileUpdate: true,
      },
    });

    const updateMusician = await tx.musician.update({
      where: { userId },
      data: {
        name: data.name || existUser.name,
        aboutUs: data.aboutUs || existUser.musician?.aboutUs,
        address: data.address || existUser.musician?.address,
        primaryName: data.primaryName || existUser.musician?.primaryName,
        primaryEmail: data.primaryEmail || existUser.musician?.primaryEmail,
        primaryNumber: data.primaryNumber || existUser.musician?.primaryNumber,
        ratePerHour: data.ratePerHour || existUser.musician?.ratePerHour,
        experience: data.experience || existUser.musician?.experience,
        license: licenseUrl || existUser.musician?.license,
        musicalCertification:
          musicalCertificationUrl || existUser.musician?.musicalCertification,
        musicianType: data.musicianType || existUser.musician?.musicianType,
        praise: data.praise || existUser.musician?.praise,
        worship: data.worship || existUser.musician?.worship,
        skills: data.musicianSkills || existUser.musician?.skills,
        workDays: data.workDays || existUser.musician?.workDays,
        image: imageUrl || existUser.musician?.image,
        latitude: user.latitude || existUser.musician?.latitude,
        longitude: user.longitude || existUser.musician?.longitude,
        updatedAt: new Date(),
        isProfileUpdate: true,
      },
    });

    return updateMusician;
  });
  removeAllFilesInUploadsFolder();
  return result;
};

export const updateVocalistInfo = async (
  userId: string,
  data: VocalistUpdateInput,
  imageUrl: string,
  req: any
) => {
  let licenseUrl = req.body.license || "";
  let musicalCertificationUrl = req.body.musicalCertification || "";
  let videoUrl = req.body.video;
  // license Handling
  if (req.files && req.files.license && req.files.license.length > 0) {
    const imageFile = req.files.license[0];

    // Validate file size
    if (imageFile.size > MAX_IMAGE_SIZE) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "license size exceeds 10MB limit."
      );
    }

    // Upload to S3
    const imageUploadResult = await S3Uploader.uploadToS3(
      imageFile,
      "license/images"
    );
    licenseUrl = imageUploadResult.Location;
  }

  // musicalCertification Handling
  if (
    req.files &&
    req.files.musicalCertification &&
    req.files.musicalCertification.length > 0
  ) {
    const imageFile = req.files.musicalCertification[0];

    // Validate file size
    if (imageFile.size > MAX_IMAGE_SIZE) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "musicalCertification size exceeds 10MB limit."
      );
    }

    // Upload to S3
    const imageUploadResult = await S3Uploader.uploadToS3(
      imageFile,
      "musicalCertification/images"
    );
    musicalCertificationUrl = imageUploadResult.Location;
  }

  const files = req.files;
  // Validate and upload video
  if (files.video && files.video.length > 0) {
    const videoFile = files.video[0];

    // Check video type
    if (!allowedVideoTypes.includes(videoFile.mimetype)) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid video format. Only MP4/MOV/MKV allowed."
      );
    }

    // Check video size
    if (videoFile.size > MAX_VIDEO_SIZE) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Video size exceeds 1000MB limit."
      );
    }

    // Upload to S3
    const videoUploadResult = await S3Uploader.uploadToS3(
      videoFile,
      "cv/videos"
    );
    videoUrl = videoUploadResult.Location;
  }

  const existUser = await prisma.user.findFirstOrThrow({
    where: {
      id: userId,
    },
    include: {
      vocalists: true,
    },
  });

  if (existUser && !existUser.connectAccountId) {
    await createStripeConnectAccount(existUser.id);
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: {
        id: userId,
      },
      data: {
        name: data.name || existUser.name,
        image: imageUrl || existUser.image,
        isProfileUpdate: true,
        address: data.address || existUser.address,
        latitude: data.latitude || existUser.latitude,
        longitude: data.longitude || existUser.longitude,
      },
    });
    const updatedVocalists = await tx.vocalists.update({
      where: { userId },
      data: {
        name: data.name || existUser.name,
        number: data.number || existUser.vocalists?.number,
        videoCV: videoUrl || existUser.vocalists?.videoCV,
        aboutUs: data.aboutUs || existUser.vocalists?.aboutUs,
        primaryName: data.primaryName || existUser.vocalists?.primaryName,
        primaryEmail: data.primaryEmail || existUser.vocalists?.primaryEmail,
        primaryNumber: data.primaryNumber || existUser.vocalists?.primaryNumber,
        ratePerHour: data.ratePerHour || existUser.vocalists?.ratePerHour,
        experience: data.experience || existUser.vocalists?.experience,
        license: licenseUrl || existUser.vocalists?.license,
        musicalCertification:
          musicalCertificationUrl || existUser.vocalists?.musicalCertification,
        vocalistType: data.vocalistType || existUser.vocalists?.vocalistType,
        musicGenre: data.musicGenre || existUser.vocalists?.musicGenre,
        workDays: data.workDays || existUser.vocalists?.workDays,
        skills: data.vocalistSkills || existUser.vocalists?.skills,
        image: imageUrl || existUser.vocalists?.image,
        address: user.address || existUser.vocalists?.address,
        latitude: user.latitude || existUser.vocalists?.latitude,
        longitude: user.longitude || existUser.vocalists?.longitude,
        updatedAt: new Date(),
        isProfileUpdate: true,
      },
    });

    return updatedVocalists;
  });

  removeAllFilesInUploadsFolder();
  return result;
};

// ✅ Get Musician Profile Info
export const getMusicianProfileInfo = async (userId: string) => {
  const musician = await prisma.musician.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          status: true,
          isVerified: true,
        },
      },
    },
  });

  if (!musician) {
    throw new ApiError(httpStatus.NOT_FOUND, "Musician profile not found");
  }

  return musician;
};

// ✅ Get Vocalist Profile Info
export const getVocalistProfileInfo = async (userId: string) => {
  const vocalist = await prisma.vocalists.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          role: true,
          status: true,
          isVerified: true,
        },
      },
    },
  });

  if (!vocalist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Vocalist profile not found");
  }

  return vocalist;
};

// ✅ Get Normal User Profile Info
export const getUsersProfileInfo = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User profile not found");
  }

  return user;
};
