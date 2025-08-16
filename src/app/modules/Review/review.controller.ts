import { Request, Response } from "express";
import httpStatus from "http-status";
import { ReviewsService } from "./review.service";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../utils/sendResponse";

const sendReview = catchAsync(async (req: Request, res: Response) => {
  const result = await ReviewsService.sendReview(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: result.data,
  });
});

const deleteReview = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { reviewId } = req.params;

  const result = await ReviewsService.deleteReview(userId, reviewId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const ReviewsController = {
  sendReview,
  deleteReview,
};
