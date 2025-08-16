import httpStatus from "http-status";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { Request, Response } from "express";
import { InstrumentServices } from "./instrument.service";
import { instrumentFilterableFields } from "./instrument.constants";
import pick from "../../helpers/pick";

const createInstruments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const result = await InstrumentServices.createInstruments(
    userId,
    req.body,
    req
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    message: "Instrument Created Successfully!",
    data: result,
  });
});

const AllInstruments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.id;
  const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
  const filters = pick(req.query, instrumentFilterableFields);

  const result = await InstrumentServices.AllInstruments(
    userId,
    options,
    filters
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Instruments data fetched!",
    data: result,
  });
});

const getInstrumentsForHome = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const options = pick(req.query, ["limit", "page", "sortBy", "sortOrder"]);
    const filters = pick(req.query, instrumentFilterableFields);

    const result = await InstrumentServices.getInstrumentsForHome(
      userId,
      options,
      filters
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Instruments data fetched!",
      data: result,
    });
  }
);

const getSingleInstrumentById = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { instrumentId } = req.params;

    const result = await InstrumentServices.getSingleInstrumentById(
      userId,
      instrumentId
    );
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Instrument data fetched!",
      data: result,
    });
  }
);

export const InstrumentControllers = {
  createInstruments,
  AllInstruments,
  getInstrumentsForHome,
  getSingleInstrumentById,
};
