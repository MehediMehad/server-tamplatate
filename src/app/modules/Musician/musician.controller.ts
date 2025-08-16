import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Request, Response } from "express";
import { MusicianServices } from "./musician.service";
import { MusicianFilterableFields } from "./musician.constants";
import pick from "../../helpers/pick";

const AllMusicians = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const filters = pick(req.query, MusicianFilterableFields);

  const result = await MusicianServices.AllMusicians(userId, options, filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Musicians data fetched!",
    data: result,
  });
});

const getMusiciansForHome = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const filters = pick(req.query, MusicianFilterableFields);

  const result = await MusicianServices.getMusiciansForHome(
    userId,
    options,
    filters
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Musicians data fetched!",
    data: result,
  });
});

const getSingleMusicianById = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { musicianId } = req.params;

    const result = await MusicianServices.getSingleMusicianById(
      userId,
      musicianId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Musicians data fetched!",
      data: result,
    });
  }
);

export const MusicianControllers = {
  AllMusicians,
  getMusiciansForHome,
  getSingleMusicianById,
};
