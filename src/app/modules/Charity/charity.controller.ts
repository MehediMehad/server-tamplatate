import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Request, Response } from "express";
import { CharityServices } from "./charity.service";
import { CharityFilterableFields } from "./charity.constants";
import pick from "../../helpers/pick";

const createCharity = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await CharityServices.createCharity(userId, req.body, req);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Charity Created Successfully!",
    data: result,
  });
});

const AllCharity = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const filters = pick(req.query, CharityFilterableFields);

  const result = await CharityServices.AllCharity(userId, options, filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Charity data fetched!",
    data: result,
  });
});

export const CharityControllers = {
  createCharity,
  AllCharity,
};
