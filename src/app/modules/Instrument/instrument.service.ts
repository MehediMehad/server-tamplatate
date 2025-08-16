import prisma from "../../config/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { MAX_IMAGE_SIZE } from "../User/user.constants";
import { S3Uploader } from "../../lib/S3Uploader";
import { removeAllFilesInUploadsFolder } from "../../helpers/removeAllFilesInUploadsFolder";
import {
  CreateInstrumentPayload,
  InstrumentQueryOptions,
} from "./instrument.interface";
import {
  InstrumentsCategoriesEnum,
  InstrumentsConditionEnum,
  InstrumentsGenresEnum,
  Prisma,
  ReviewItemTypeEnum,
  WorkDaysEnum,
} from "@prisma/client";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../helpers/paginationHelper";
import { calculateDistance } from "./instrument.utils";

const createInstruments = async (
  userId: string,
  payload: CreateInstrumentPayload,
  req: any
) => {
  let imageUrl = req.body.instrumentsImage || "";
  let licenseUrl = req.body.license || "";

  // Image Handling
  if (
    req.files &&
    req.files.instrumentsImage &&
    req.files.instrumentsImage.length > 0
  ) {
    const imageFile = req.files.instrumentsImage[0];

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
      "instruments/images"
    );
    imageUrl = imageUploadResult.Location;
  }

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
      "instruments/images"
    );
    licenseUrl = imageUploadResult.Location;
  }

  const createInstrumentFormateData = {
    ...payload,
    creatorId: userId,
    image: imageUrl,
    license: licenseUrl || null,
  };

  const create = await prisma.instrument.create({
    data: createInstrumentFormateData,
  });

  removeAllFilesInUploadsFolder();
  return create;
};

const AllInstruments = async (
  userId: string,
  options: IPaginationOptions,
  params: InstrumentQueryOptions
) => {
  const {
    searchTerm,
    availability,
    categories,
    condition,
    genre,
    minimumRating,
    priceRange,
    distance,
  } = params;
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  let where: Prisma.InstrumentWhereInput = {};

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
    where.OR = [
      { title: { contains: searchTerm, mode: "insensitive" } },
      { address: { contains: searchTerm, mode: "insensitive" } },
      { description: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Availability
  if (availability) {
    const availabilities = availability
      .split(",")
      .map((day) => day.trim())
      .filter((day) =>
        Object.values(WorkDaysEnum).includes(day as WorkDaysEnum)
      );

    if (availabilities.length > 0) {
      where.availability = {
        hasSome: availabilities as WorkDaysEnum[],
      };
    }
  }

  // Categories
  if (categories) {
    const catList = categories
      .split(",")
      .map((cat) => cat.trim())
      .filter((cat) =>
        Object.values(InstrumentsCategoriesEnum).includes(
          cat as InstrumentsCategoriesEnum
        )
      );

    if (catList.length > 0) {
      where.categories = {
        hasSome: catList as InstrumentsCategoriesEnum[],
      };
    }
  }

  // Genre
  if (genre) {
    const genres = genre
      .split(",")
      .map((g) => g.trim())
      .filter((g) =>
        Object.values(InstrumentsGenresEnum).includes(
          g as InstrumentsGenresEnum
        )
      );

    if (genres.length > 0) {
      where.genre = {
        hasSome: genres as InstrumentsGenresEnum[],
      };
    }
  }

  // Condition
  if (condition) {
    if (
      Object.values(InstrumentsConditionEnum).includes(
        condition as InstrumentsConditionEnum
      )
    ) {
      where.condition = condition as InstrumentsConditionEnum;
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid instrument condition"
      );
    }
  }

  // Price Range
  if (priceRange) {
    const [min, max] = priceRange.split("-").map(Number);
    if (!isNaN(min) && !isNaN(max)) {
      where.ratePerHour = {
        gte: min,
        lte: max,
      };
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid price range format");
    }
  }

  let instruments = await prisma.instrument.findMany({
    where,
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      id: true,
      title: true,
      description: true,
      image: true,
      ratePerHour: true,
      condition: true,
      categories: true,
      genre: true,
      address: true,
      availability: true,
      latitude: true,
      longitude: true,
    },
  });

  if (distance) {
    instruments = instruments.filter((instrument) => {
      const dist = calculateDistance(
        user.latitude!,
        user.longitude!,
        instrument.latitude,
        instrument.longitude
      );
      return dist <= parseFloat(distance);
    });
  }

  // Apply minimumRating filter
  if (minimumRating) {
    instruments = (
      await Promise.all(
        instruments.map(async (instrument) => {
          const reviews = await prisma.review.findMany({
            where: {
              instrumentId: instrument.id, // <- updated
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

          return averageRating >= parseFloat(minimumRating) ? instrument : null;
        })
      )
    ).filter(
      (instrument): instrument is (typeof instruments)[0] => instrument !== null
    );
  }

  // Apply pagination AFTER distance and rating filtering
  const total = instruments.length;
  const paginatedInstruments = instruments.slice(skip, skip + limit);

  // Format data with isFavorite flag and ratings
  const formatData = await Promise.all(
    paginatedInstruments.map(async (instrument) => {
      const isFavorite = user.favorites.some(
        (fav) => fav.itemId === instrument.id
      );

      const reviews = await prisma.review.findMany({
        where: {
          instrumentId: instrument.id, // <- updated
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
        ...instrument,
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

const getInstrumentsForHome = async (
  userId: string,
  options: IPaginationOptions,
  params: InstrumentQueryOptions
) => {
  const { categories } = params;
  const { sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  let where: Prisma.InstrumentWhereInput = {};

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

  // Categories
  if (categories) {
    const catList = categories
      .split(",")
      .map((cat) => cat.trim())
      .filter((cat) =>
        Object.values(InstrumentsCategoriesEnum).includes(
          cat as InstrumentsCategoriesEnum
        )
      );

    if (catList.length > 0) {
      where.categories = {
        hasSome: catList as InstrumentsCategoriesEnum[],
      };
    }
  }

  let instruments = await prisma.instrument.findMany({
    where,
    orderBy: {
      [sortBy]: sortOrder,
    },
    take: 4,
    select: {
      id: true,
      title: true,
      description: true,
      image: true,
      ratePerHour: true,
      condition: true,
      categories: true,
      genre: true,
      address: true,
      availability: true,
      latitude: true,
      longitude: true,
    },
  });

  // Format data with isFavorite flag and ratings
  const formatData = await Promise.all(
    instruments.map(async (instrument) => {
      const isFavorite = user.favorites.some(
        (fav) => fav.itemId === instrument.id
      );

      const reviews = await prisma.review.findMany({
        where: {
          instrumentId: instrument.id, // <- updated
        },
        select: {
          rating: true,
        },
      });

      // Calculate average rating
      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          : 0;

      return {
        ...instrument,
        isFavorite,
        averageRating: averageRating.toFixed(2), // Round to 2 decimal places
      };
    })
  );

  return formatData;
};

const getSingleInstrumentById = async (
  userId: string,
  instrumentId: string
) => {
  const musician = await prisma.instrument.findUnique({
    where: { id: instrumentId },
    include: {
      creator: {
        select: {
          id: true,
          status: true,
          isVerified: true,
        },
      },
      review: {
        select: {
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
      favorite: {
        where: { userId },
        select: { id: true },
      },
      booking: {
        where: { instrumentId, status: { in: ["PENDING"] } },
        select: { id: true, startTime: true, endTime: true },
      },
    },
  });

  if (!musician) {
    throw new ApiError(httpStatus.NOT_FOUND, "Musician not found!");
  }

  // Total review count
  const totalReview = musician.review.length;

  // Average review rating
  const avgReview =
    totalReview > 0
      ? musician.review.reduce((sum, r) => sum + r.rating, 0) / totalReview
      : 0;

  // Favorite check
  const isFavorite = musician.favorite.length > 0;

  const { favorite, creator, ...restMusician } = musician;

  return {
    ...restMusician,
    isFavorite,
    totalReview,
    avgReview,
  };
};

export const InstrumentServices = {
  createInstruments,
  AllInstruments,
  getInstrumentsForHome,
  getSingleInstrumentById,
};
