import { Request } from "express";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import prisma from "../../config/prisma";
import { FavoriteTypeEnum } from "@prisma/client";

// Helper to check if the item exists by type
export const checkIfItemExists = async (
  itemId: string,
  itemType: FavoriteTypeEnum
) => {
  switch (itemType) {
    case "INSTRUMENT":
      return await prisma.instrument.findUnique({ where: { id: itemId } });
    case "MUSICIAN":
      return await prisma.musician.findUnique({ where: { id: itemId } });
    case "VOCALIST":
      return await prisma.vocalists.findUnique({ where: { id: itemId } });
    case "CHARITY":
      return await prisma.charity.findUnique({ where: { id: itemId } });
    default:
      return null;
  }
};

const addFavorite = async (req: Request) => {
  const userId = req.user.id;
  const { itemId, type } = req.body;

  if (!itemId || !type) {
    throw new ApiError(httpStatus.BAD_REQUEST, "itemId and type are required.");
  }

  const validTypes = ["INSTRUMENT", "MUSICIAN", "VOCALIST", "CHARITY"];
  if (!validTypes.includes(type)) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid type.");
  }

  // Check if user exists
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found.");
  }

  // Helper to check if item exists and return relation field name + id key
  const checkAndGetRelationField = async () => {
    switch (type) {
      case "INSTRUMENT":
        return (await prisma.instrument.findUnique({ where: { id: itemId } }))
          ? { instrumentId: itemId }
          : null;
      case "MUSICIAN":
        return (await prisma.musician.findUnique({ where: { id: itemId } }))
          ? { musicianId: itemId }
          : null;
      case "VOCALIST":
        return (await prisma.vocalists.findUnique({ where: { id: itemId } }))
          ? { vocalistId: itemId }
          : null;
      case "CHARITY":
        return (await prisma.charity.findUnique({ where: { id: itemId } }))
          ? { charityId: itemId }
          : null;
      default:
        return null;
    }
  };

  const relationField = await checkAndGetRelationField();

  if (!relationField) {
    throw new ApiError(httpStatus.NOT_FOUND, `${type} not found.`);
  }

  // Check if favorite already exists
  const existingFavorite = await prisma.favorite.findFirst({
    where: {
      userId,
      itemId,
    },
  });

  if (existingFavorite) {
    throw new ApiError(httpStatus.CONFLICT, "Already added to favorites.");
  }

  // Create favorite with proper relation field
  const favorite = await prisma.favorite.create({
    data: {
      userId,
      itemId,
      type,
      ...relationField,
    },
  });

  return favorite;
};

const removeFavorite = async (req: Request) => {
  const userId = req.user.id;
  const { itemId } = req.params;

  // 1. Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, "User not found!");
  }

  // 2. Check if favorite exists
  const existingFavorite = await prisma.favorite.findFirst({
    where: {
      userId,
      itemId,
    },
  });

  if (!existingFavorite) {
    throw new ApiError(httpStatus.NOT_FOUND, "Favorite not found!");
  }

  // 3. Delete the favorite by its id
  await prisma.favorite.delete({
    where: {
      id: existingFavorite.id,
    },
  });

  return { message: "Favorite removed successfully!" };
};

export const FavoritesService = {
  addFavorite,
  removeFavorite,
};
