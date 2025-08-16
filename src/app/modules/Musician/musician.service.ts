import prisma from "../../config/prisma";
import ApiError from "../../errors/ApiError";
import httpStatus from "http-status";
import { MusicianQueryOptions } from "./musician.interface";
import {
  MusicianSkillsEnum,
  MusicianTypeEnum,
  PraiseEnum,
  Prisma,
  WorkDaysEnum,
  WorshipEnum,
} from "@prisma/client";
import { IPaginationOptions } from "../../interface/pagination.type";
import { paginationHelper } from "../../helpers/paginationHelper";
import { calculateDistance } from "./musician.utils";

const AllMusicians = async (
  userId: string,
  options: IPaginationOptions,
  params: MusicianQueryOptions // you may rename properly
) => {
  const {
    searchTerm,
    musicianType,
    availability,
    praise,
    worship,
    skills, // probably from skills?
    experienceLevel,
    minimumRating,
    priceRange,
    distance,
  } = params;

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  let where: Prisma.MusicianWhereInput = {};

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
      { aboutUs: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // 🎸 Musician Types
  if (
    musicianType &&
    Object.values(MusicianTypeEnum).includes(musicianType as MusicianTypeEnum)
  ) {
    where.musicianType = musicianType as MusicianTypeEnum;
  }

  // 🙌 Praise
  if (praise) {
    const praiseList = praise
      .split(",")
      .map((p) => p.trim())
      .filter((p) => Object.values(PraiseEnum).includes(p as PraiseEnum));

    if (praiseList.length > 0) {
      where.praise = { hasSome: praiseList as PraiseEnum[] };
    }
  }

  // 🙏 Worship
  if (worship) {
    const worshipList = worship
      .split(",")
      .map((w) => w.trim())
      .filter((w) => Object.values(WorshipEnum).includes(w as WorshipEnum));

    if (worshipList.length > 0) {
      where.worship = { hasSome: worshipList as WorshipEnum[] };
    }
  }

  // 🎼 Skills (mapped from 'musician' param)
  if (skills) {
    const skillsList = skills
      .split(",")
      .map((s) => s.trim())
      .filter((s) =>
        Object.values(MusicianSkillsEnum).includes(s as MusicianSkillsEnum)
      );

    if (skillsList.length > 0) {
      where.skills = { hasSome: skillsList as MusicianSkillsEnum[] };
    }
  }

  // 🎼 availability (mapped from 'musician' param)
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

  // 🔎 Fetch all matching musicians
  let musicians = await prisma.musician.findMany({
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
      aboutUs: true,
      ratePerHour: true,
      address: true,
      skills: true,
      worship: true,
      experience: true,
      musicianType: true,
      praise: true,
      latitude: true,
      longitude: true,
    },
  });

  // 📍 Distance filtering
  if (distance) {
    musicians = musicians.filter((musician) => {
      const dist = calculateDistance(
        user.latitude!,
        user.longitude!,
        musician.latitude!,
        musician.longitude!
      );
      return dist <= parseFloat(distance);
    });
  }

  // ⭐ Minimum Rating
  if (minimumRating) {
    musicians = (
      await Promise.all(
        musicians.map(async (musician) => {
          const reviews = await prisma.review.findMany({
            where: {
              musicianId: musician.id,
            },
            select: {
              rating: true,
            },
          });

          const averageRating =
            reviews.length > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              : 0;

          return averageRating >= parseFloat(minimumRating) ? musician : null;
        })
      )
    ).filter(
      (musician): musician is (typeof musicians)[0] => musician !== null
    );
  }

  // 🧾 Pagination
  const total = musicians.length;
  const paginated = musicians.slice(skip, skip + limit);

  // 🔁 Final Format with isFavorite & rating
  const data = await Promise.all(
    paginated.map(async (musician) => {
      const isFavorite = user.favorites.some(
        (fav) => fav.itemId === musician.id
      );

      const reviews = await prisma.review.findMany({
        where: {
          musicianId: musician.id,
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
        ...musician,
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

const getMusiciansForHome = async (
  userId: string,
  options: IPaginationOptions,
  params: MusicianQueryOptions
) => {
  // const { categories } = params;
  // const { sortBy, sortOrder } = paginationHelper.calculatePagination(options);
  // let where: Prisma.InstrumentWhereInput = {};
  // const user = await prisma.user.findUniqueOrThrow({
  //   where: { id: userId },
  //   select: {
  //     latitude: true,
  //     longitude: true,
  //     favorites: {
  //       select: {
  //         itemId: true,
  //       },
  //     },
  //   },
  // });
  // // Categories
  // if (categories) {
  //   const catList = categories
  //     .split(",")
  //     .map((cat) => cat.trim())
  //     .filter((cat) =>
  //       Object.values(InstrumentsCategoriesEnum).includes(
  //         cat as InstrumentsCategoriesEnum
  //       )
  //     );
  //   if (catList.length > 0) {
  //     where.categories = {
  //       hasSome: catList as InstrumentsCategoriesEnum[],
  //     };
  //   }
  // }
  // let instruments = await prisma.instrument.findMany({
  //   where,
  //   orderBy: {
  //     [sortBy]: sortOrder,
  //   },
  //   select: {
  //     id: true,
  //     title: true,
  //     description: true,
  //     image: true,
  //     ratePerHour: true,
  //     condition: true,
  //     categories: true,
  //     genre: true,
  //     address: true,
  //     availability: true,
  //     latitude: true,
  //     longitude: true,
  //   },
  // });
  // // Format data with isFavorite flag and ratings
  // const formatData = await Promise.all(
  //   instruments.map(async (instrument) => {
  //     const isFavorite = user.favorites.some(
  //       (fav) => fav.itemId === instrument.id
  //     );
  //     const reviews = await prisma.review.findMany({
  //       where: {
  //         itemId: instrument.id,
  //         itemType: ReviewItemTypeEnum.INSTRUMENT,
  //       },
  //       select: {
  //         rating: true,
  //       },
  //     });
  //     // Calculate average rating
  //     const averageRating =
  //       reviews.length > 0
  //         ? reviews.reduce((sum, review) => sum + review.rating, 0) /
  //           reviews.length
  //         : 0;
  //     return {
  //       ...instrument,
  //       isFavorite,
  //       averageRating: averageRating.toFixed(2), // Round to 2 decimal places
  //     };
  //   })
  // );
  // return formatData;
};

const getSingleMusicianById = async (userId: string, musicianId: string) => {
  const musician = await prisma.musician.findUnique({
    where: { id: musicianId },
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
        where: { musicianId, status: { in: ["PENDING"] } },
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

  const { favorite, ...restMusician } = musician;

  return {
    ...restMusician,
    isFavorite,
    totalReview,
    avgReview,
  };
};

export const MusicianServices = {
  AllMusicians,
  getMusiciansForHome,
  getSingleMusicianById,
};
