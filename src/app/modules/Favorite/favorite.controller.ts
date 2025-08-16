import { Request, Response } from "express";
import httpStatus from "http-status";
import { FavoritesService } from "./favorite.service";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../utils/sendResponse";

const addFavorite = catchAsync(async (req: Request, res: Response) => {
  const result = await FavoritesService.addFavorite(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Favorite sent successfully!",
    data: result,
  });
});

const removeFavorite = catchAsync(async (req: Request, res: Response) => {
  const result = await FavoritesService.removeFavorite(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: result.message,
    data: null,
  });
});

export const FavoritesController = {
  addFavorite,
  removeFavorite,
};
