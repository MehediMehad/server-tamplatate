import { z } from "zod";

// Create review schema
const createReviewSchema = z.object({
  body: z.object({}),
});

export const ReviewsValidation = {
  createReviewSchema,
};
