import { IPaginationOptions } from "../../interface/pagination.type";
import { InstrumentQueryOptions } from "./instrument.interface";

const AllInstruments2 = async (
  userId: string,
  options: IPaginationOptions,
  params: InstrumentQueryOptions
) => {
  // const {
  //   searchTerm,
  //   availability,
  //   categories,
  //   condition,
  //   genre,
  //   minimumRating,
  //   priceRange,
  //   distance,
  // } = params;
  // const { page, limit, skip, sortBy, sortOrder } =
  //   paginationHelper.calculatePagination(options);
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
  // // Search
  // if (searchTerm) {
  //   where.OR = [
  //     { title: { contains: searchTerm, mode: "insensitive" } },
  //     { address: { contains: searchTerm, mode: "insensitive" } },
  //     { description: { contains: searchTerm, mode: "insensitive" } },
  //   ];
  // }
  // // Availability
  // if (availability) {
  //   const availabilities = availability
  //     .split(",")
  //     .map((day) => day.trim())
  //     .filter((day) =>
  //       Object.values(WorkDaysEnum).includes(day as WorkDaysEnum)
  //     );
  //   if (availabilities.length > 0) {
  //     where.availability = {
  //       hasSome: availabilities as WorkDaysEnum[],
  //     };
  //   }
  // }
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
  // // Genre
  // if (genre) {
  //   const genres = genre
  //     .split(",")
  //     .map((g) => g.trim())
  //     .filter((g) =>
  //       Object.values(InstrumentsGenresEnum).includes(
  //         g as InstrumentsGenresEnum
  //       )
  //     );
  //   if (genres.length > 0) {
  //     where.genre = {
  //       hasSome: genres as InstrumentsGenresEnum[],
  //     };
  //   }
  // }
  // // Condition
  // if (condition) {
  //   if (
  //     Object.values(InstrumentsConditionEnum).includes(
  //       condition as InstrumentsConditionEnum
  //     )
  //   ) {
  //     where.condition = condition as InstrumentsConditionEnum;
  //   } else {
  //     throw new ApiError(
  //       httpStatus.BAD_REQUEST,
  //       "Invalid instrument condition"
  //     );
  //   }
  // }
  // // Price Range (e.g., "10-100")
  // if (priceRange) {
  //   const [min, max] = priceRange.split("-").map(Number);
  //   if (!isNaN(min) && !isNaN(max)) {
  //     where.ratePerHour = {
  //       gte: min,
  //       lte: max,
  //     };
  //   } else {
  //     throw new ApiError(httpStatus.BAD_REQUEST, "Invalid price range format");
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
  // if (distance) {
  //   instruments = instruments.filter((instrument) => {
  //     const dist = calculateDistance(
  //       user.latitude!,
  //       user.longitude!,
  //       instrument.latitude,
  //       instrument.longitude
  //     );
  //     return dist <= parseFloat(distance);
  //   });
  // }
  // // Apply minimumRating filter
  // if (minimumRating) {
  //   instruments = (
  //     await Promise.all(
  //       instruments.map(async (instrument) => {
  //         const reviews = await prisma.review.findMany({
  //           where: {
  //             itemId: instrument.id,
  //             itemType: ReviewItemTypeEnum.INSTRUMENT,
  //           },
  //           select: {
  //             rating: true,
  //           },
  //         });
  //         const averageRating =
  //           reviews.length > 0
  //             ? reviews.reduce((sum, review) => sum + review.rating, 0) /
  //               reviews.length
  //             : 0;
  //         return averageRating >= parseFloat(minimumRating) ? instrument : null;
  //       })
  //     )
  //   ).filter(
  //     (instrument): instrument is (typeof instruments)[0] => instrument !== null
  //   );
  // }
  // // Apply pagination AFTER distance and rating filtering
  // const total = instruments.length;
  // const paginatedInstruments = instruments.slice(skip, skip + limit);
  // // Format data with isFavorite flag and ratings
  // const formatData = await Promise.all(
  //   paginatedInstruments.map(async (instrument) => {
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
  //         comment: true, // Include comment if needed
  //         createdAt: true, // Include createdAt if needed
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
  // return {
  //   meta: {
  //     page,
  //     limit,
  //     total,
  //     totalPage: Math.ceil(total / limit),
  //   },
  //   data: formatData,
  // };
};

const getInstrumentsForHome2 = async (
  userId: string,
  options: IPaginationOptions,
  params: InstrumentQueryOptions
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
