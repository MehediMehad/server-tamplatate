import { Request } from "express";
import httpStatus from "http-status";
import ApiError from "../../errors/ApiError";
import prisma from "../../config/prisma";
import { checkIfItemExists } from "../Favorite/favorite.service";
import { FavoriteTypeEnum } from "@prisma/client";

const sendReview = async (req: Request) => {
  const userId = req.user.id;
  const { itemId, itemType, rating, comment } = req.body;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "User not authenticated");
  }

  // Check if item exists
  const itemExists = await checkIfItemExists(
    itemId,
    itemType as FavoriteTypeEnum
  );
  if (!itemExists) {
    throw new ApiError(httpStatus.NOT_FOUND, `${itemType} not found.`);
  }

  // Map itemType to the correct foreign key field
  const itemFieldMap: Record<string, string> = {
    INSTRUMENT: "instrumentId",
    MUSICIAN: "musicianId",
    VOCALIST: "vocalistId",
    CHARITY: "charityId",
  };

  const itemField = itemFieldMap[itemType];
  if (!itemField) {
    throw new ApiError(httpStatus.BAD_REQUEST, "Invalid item type");
  }

  // Check if the user has already reviewed this item
  const existingReview = await prisma.review.findFirst({
    where: {
      userId,
      [itemField]: itemId,
    },
  });

  let review;

  if (existingReview) {
    // Update existing review
    review = await prisma.review.update({
      where: { id: existingReview.id },
      data: {
        rating: Number(rating),
        comment,
      },
    });
  } else {
    // Create new review
    review = await prisma.review.create({
      data: {
        userId,
        rating: Number(rating),
        comment,
        [itemField]: itemId,
      },
    });
  }

  return {
    message: existingReview
      ? "Review updated successfully!"
      : "Review submitted successfully!",
    data: review,
  };
};

const deleteReview = async (userId: string, reviewId: string) => {
  // Check if the review exists and belongs to the user
  const review = await prisma.review.findFirst({
    where: {
      id: reviewId,
      userId,
    },
  });

  if (!review) {
    throw new ApiError(
      httpStatus.FORBIDDEN,
      "Review not found or you are not authorized to delete this review"
    );
  }

  // Delete the review
  await prisma.review.delete({
    where: {
      id: reviewId,
    },
  });

  return {
    message: "Review deleted successfully",
  };
};

export interface UpdateReviewData {
  rating?: string;
  comment?: string;
}

export const ReviewsService = {
  sendReview,
  deleteReview,
};
