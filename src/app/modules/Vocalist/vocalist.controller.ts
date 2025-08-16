import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Request, Response } from "express";
import { VocalistServices } from "./vocalist.service";
import { VocalistFilterableFields } from "./vocalist.constants";
import pick from "../../helpers/pick";

const AllVocalists = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const filters = pick(req.query, VocalistFilterableFields);

  const result = await VocalistServices.AllVocalists(userId, options, filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vocalist data fetched!",
    data: result,
  });
});

const getSingleVocalistById = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { vocalistId } = req.params;

    const result = await VocalistServices.getSingleVocalistById(
      userId,
      vocalistId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Vocalists data fetched!",
      data: result,
    });
  }
);

export const VocalistControllers = {
  AllVocalists,
  getSingleVocalistById,
};
