import { ReviewItemTypeEnum } from "@prisma/client";
import { z } from "zod";

const ratingValues = [1, 2, 3, 4, 5] as const;

const createReviewSchema = z.object({
  body: z.object({
    itemId: z.string().min(1, "itemId is required"),
    itemType: z.enum(ReviewItemTypeEnum),
    rating: z
      .enum(ratingValues.map(String) as [string, ...string[]])
      .transform(Number),
    comment: z.string().optional(),
  }),
});

export const ReviewsValidation = {
  createReviewSchema,
};
