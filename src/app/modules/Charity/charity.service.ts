import prisma from "../../config/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { MAX_IMAGE_SIZE } from "../User/user.constants";
import { S3Uploader } from "../../lib/S3Uploader";
import { removeAllFilesInUploadsFolder } from "../../helpers/removeAllFilesInUploadsFolder";
import { CharityQueryOptions, CreateCharityPayload } from "./charity.interface";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../helpers/paginationHelper";
import {
  CharityCategoriesEnum,
  CharityDonationTypeEnum,
  Prisma,
} from "@prisma/client";
import { calculateDistance } from "../Instrument/instrument.utils";

const createCharity = async (
  userId: string,
  payload: CreateCharityPayload,
  req: any
) => {
  let imageUrl = req.body.image || "";
  let verificationDocUrl = req.body.verificationDocument || "";
  let exemptionCertUrl = req.body.exemptionCertificate || "";
  let registrationCertUrl = req.body.registrationCertificate || "";
  let licenseUrl = req.body.license || "";

  const uploadFile = async (file: any, folder: string) => {
    if (file.size > MAX_IMAGE_SIZE) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        `${folder} size exceeds 10MB limit.`
      );
    }
    const uploadResult = await S3Uploader.uploadToS3(file, `charity/${folder}`);
    return uploadResult.Location;
  };

  const files = req.files || {};

  // Required file check: verificationDocument
  if (!files.verificationDocument || files.verificationDocument.length === 0) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      "Verification document is required."
    );
  }
  // Required file check: image
  if (!files.image || files.image.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, "image is required.");
  }

  if (files.image && files.image[0])
    imageUrl = await uploadFile(files.image[0], "images");
  if (files.verificationDocument && files.verificationDocument[0])
    verificationDocUrl = await uploadFile(
      files.verificationDocument[0],
      "verification"
    );
  if (files.exemptionCertificate && files.exemptionCertificate[0])
    exemptionCertUrl = await uploadFile(
      files.exemptionCertificate[0],
      "exemption"
    );
  if (files.registrationCertificate && files.registrationCertificate[0])
    registrationCertUrl = await uploadFile(
      files.registrationCertificate[0],
      "registration"
    );
  if (files.license && files.license[0])
    licenseUrl = await uploadFile(files.license[0], "license");

  const createCharityFormattedData = {
    ...payload,
    creatorId: userId,
    image: imageUrl,
    verificationDocument: verificationDocUrl,
    exemptionCertificate: exemptionCertUrl || null,
    registrationCertificate: registrationCertUrl || null,
    license: licenseUrl || null,
  };

  const created = await prisma.charity.create({
    data: createCharityFormattedData,
  });

  removeAllFilesInUploadsFolder();
  return created;
};

const AllCharity = async (
  userId: string,
  options: IPaginationOptions,
  params: CharityQueryOptions
) => {
  const { searchTerm, categories, minimumRating, distance, donationType } =
    params;

  console.log("🤢🤢", minimumRating, searchTerm);

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  let where: Prisma.CharityWhereInput = {};

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      latitude: true,
      longitude: true,
      favorites: {
        select: {
          itemId: true,
        },
      },
    },
  });

  // Search
  if (searchTerm) {
    where.OR = [{ name: { contains: searchTerm, mode: "insensitive" } }];
  }

  // Categories
  if (categories) {
    if (
      Object.values(CharityCategoriesEnum).includes(
        categories as CharityCategoriesEnum
      )
    ) {
      where.categories = categories as CharityCategoriesEnum;
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid Charity categories");
    }
  }

  // donationType
  if (donationType) {
    if (
      Object.values(CharityDonationTypeEnum).includes(
        donationType as CharityDonationTypeEnum
      )
    ) {
      where.donationType = donationType as CharityDonationTypeEnum;
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid Charity Donation Type"
      );
    }
  }

  let charitys = await prisma.charity.findMany({
    where,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      id: true,
      name: true,
      address: true,
      about: true,
      image: true,
      categories: true,
      donationType: true,
      latitude: true,
      longitude: true,
      isPublish: true,
    },
  });

  if (distance) {
    charitys = charitys.filter((charity) => {
      const dist = calculateDistance(
        user.latitude!,
        user.longitude!,
        charity.latitude,
        charity.longitude
      );
      return dist <= parseFloat(distance);
    });
  }

  // Apply minimumRating filter
  if (minimumRating) {
    charitys = (
      await Promise.all(
        charitys.map(async (charity) => {
          const reviews = await prisma.review.findMany({
            where: {
              charityId: charity.id, // <- updated
            },
            select: {
              rating: true,
            },
          });

          const averageRating =
            reviews.length > 0
              ? reviews.reduce((sum, review) => sum + review.rating, 0) /
                reviews.length
              : 0;

          return averageRating >= parseFloat(minimumRating) ? charity : null;
        })
      )
    ).filter((charity): charity is (typeof charitys)[0] => charity !== null);
  }

  // Apply pagination AFTER distance and rating filtering
  const total = charitys.length;
  const paginatedInstruments = charitys.slice(skip, skip + limit);

  // Format data with isFavorite flag and ratings
  const formatData = await Promise.all(
    paginatedInstruments.map(async (charity) => {
      const isFavorite = user.favorites.some(
        (fav) => fav.itemId === charity.id
      );

      const reviews = await prisma.review.findMany({
        where: {
          charityId: charity.id, // <- updated
        },
        select: {
          rating: true,
          comment: true,
          createdAt: true,
        },
      });

      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          : 0;

      return {
        ...charity,
        isFavorite,
        averageRating: averageRating.toFixed(2),
      };
    })
  );

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: Math.ceil(total / limit),
    },
    data: formatData,
  };
};

export const CharityServices = {
  createCharity,
  AllCharity,
};
