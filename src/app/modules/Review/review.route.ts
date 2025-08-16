import express from "express";
import { ReviewsController } from "./review.controller";
import auth from "../../middlewares/auth";
import { ReviewsValidation } from "./review.validation";
import validateRequest from "../../middlewares/validateRequest";

const router = express.Router();

router.post(
  "/add-review",
  auth("MUSICIAN", "USER", "VOCALIST"),
  validateRequest(ReviewsValidation.createReviewSchema),
  ReviewsController.sendReview
);

router.delete(
  "/:reviewId",
  auth("MUSICIAN", "USER", "VOCALIST"),
  ReviewsController.deleteReview
);

export const ReviewsRoutes = router;
