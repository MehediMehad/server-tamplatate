import prisma from "../../config/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { VocalistQueryOptions } from "./vocalist.interface";
import {
  MusicGenreEnum,
  Prisma,
  VocalistSkillsEnum,
  VocalistTypeEnum,
  WorkDaysEnum,
} from "@prisma/client";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../helpers/paginationHelper";
import { calculateDistance } from "./vocalist.utils";

const AllVocalists = async (
  userId: string,
  options: IPaginationOptions,
  params: VocalistQueryOptions
) => {
  const {
    searchTerm,
    vocalistType,
    availability,
    musicGenreType,
    skills,
    experienceLevel,
    minimumRating,
    priceRange,
    distance,
  } = params;

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  let where: Prisma.VocalistsWhereInput = {};

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

  // 🔍 Search
  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { address: { contains: searchTerm, mode: "insensitive" } },
      // { aboutUs: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // 🎸 Musician Types
  if (
    vocalistType &&
    Object.values(VocalistTypeEnum).includes(vocalistType as VocalistTypeEnum)
  ) {
    where.vocalistType = vocalistType as VocalistTypeEnum;
  }

  // 🎼 Skills (mapped from 'vocalist' param)
  if (skills) {
    const skillsList = skills
      .split(",")
      .map((s) => s.trim())
      .filter((s) =>
        Object.values(VocalistSkillsEnum).includes(s as VocalistSkillsEnum)
      );

    if (skillsList.length > 0) {
      where.skills = { hasSome: skillsList as VocalistSkillsEnum[] };
    }
  }

  // 🎛️ musicGenreType (mapped from 'vocalist' param)
  if (musicGenreType) {
    const genreList = musicGenreType
      .split(",")
      .map((g) => g.trim())
      .filter((g) =>
        Object.values(MusicGenreEnum).includes(g as MusicGenreEnum)
      );

    if (genreList.length > 0) {
      where.musicGenre = { hasSome: genreList as MusicGenreEnum[] };
    }
  }

  // 📅 availability (mapped from 'vocalist' param)
  if (availability) {
    const dayList = availability
      .split(",")
      .map((d) => d.trim())
      .filter((d) => Object.values(WorkDaysEnum).includes(d as WorkDaysEnum));

    if (dayList.length > 0) {
      where.workDays = { hasSome: dayList as WorkDaysEnum[] };
    }
  }

  // 💼 Experience Level (e.g., "1-3")
  if (experienceLevel) {
    const [minExp, maxExp] = experienceLevel.split("-").map(Number);

    if (!isNaN(minExp) && !isNaN(maxExp)) {
      where.experience = {
        gte: minExp,
        lte: maxExp,
      };
    } else {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid experience level format"
      );
    }
  }

  // 💰 Price Range (e.g., "1-3")
  if (priceRange) {
    const [min, max] = priceRange.split("-").map(Number);
    if (!isNaN(min) && !isNaN(max)) {
      where.ratePerHour = { gte: min, lte: max };
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, "Invalid price range format");
    }
  }

  // 🔎 Fetch all matching vocalists
  let vocalists = await prisma.vocalists.findMany({
    where: {
      ...where,
      isProfileUpdate: true,
    },
    orderBy: {
      [sortBy]: sortOrder,
    },
    select: {
      id: true,
      name: true,
      image: true,
      vocalistType: true,
      musicGenre: true,
      workDays: true,
      aboutUs: true,
      ratePerHour: true,
      address: true,
      skills: true,
      experience: true,
      latitude: true,
      longitude: true,
    },
  });

  // 📍 Distance filtering
  if (distance) {
    vocalists = vocalists.filter((vocalist) => {
      const dist = calculateDistance(
        user.latitude!,
        user.longitude!,
        vocalist.latitude!,
        vocalist.longitude!
      );
      return dist <= parseFloat(distance);
    });
  }

  // ⭐ Minimum Rating
  if (minimumRating) {
    vocalists = (
      await Promise.all(
        vocalists.map(async (vocalist) => {
          const reviews = await prisma.review.findMany({
            where: {
              vocalistId: vocalist.id,
            },
            select: {
              rating: true,
            },
          });

          const averageRating =
            reviews.length > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              : 0;

          return averageRating >= parseFloat(minimumRating) ? vocalist : null;
        })
      )
    ).filter(
      (vocalist): vocalist is (typeof vocalists)[0] => vocalist !== null
    );
  }

  // 🧾 Pagination
  const total = vocalists.length;
  const paginated = vocalists.slice(skip, skip + limit);

  // 🔁 Final Format with isFavorite & rating
  const data = await Promise.all(
    paginated.map(async (vocalist) => {
      const isFavorite = user.favorites.some(
        (fav) => fav.itemId === vocalist.id
      );

      const reviews = await prisma.review.findMany({
        where: {
          vocalistId: vocalist.id,
        },
        select: {
          rating: true,
        },
      });

      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        ...vocalist,
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
    data,
  };
};

const getSingleVocalistById = async (userId: string, vocalistId: string) => {
  const vocalist = await prisma.vocalists.findUnique({
    where: { id: vocalistId },
    include: {
      user: {
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
        where: { vocalistId, status: { in: ["PENDING"] } },
        select: { id: true, startTime: true, endTime: true },
      },
    },
  });

  if (!vocalist) {
    throw new ApiError(httpStatus.NOT_FOUND, "Vocalist not found!");
  }

  // Total review count
  const totalReview = vocalist.review.length;

  // Average review rating
  const avgReview =
    totalReview > 0
      ? vocalist.review.reduce((sum, r) => sum + r.rating, 0) / totalReview
      : 0;

  // Favorite check
  const isFavorite = vocalist.favorite.length > 0;

  const { favorite, ...restVocalist } = vocalist;

  return {
    ...restVocalist,
    isFavorite,
    totalReview,
    avgReview,
  };
};

export const VocalistServices = {
  AllVocalists,
  getSingleVocalistById,
};
