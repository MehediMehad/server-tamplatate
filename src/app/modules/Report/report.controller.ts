import { Request, Response } from "express";
import httpStatus from "http-status";
import { ReportsService } from "./report.service";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../utils/sendResponse";

const sendReport = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportsService.sendReport(req);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Report sent successfully!",
    data: result,
  });
});

const getHostPropertyServiceReport = catchAsync(
  async (req: Request, res: Response) => {
    const hostId = req.user.id;
    const result = await ReportsService.getHostPropertyServiceReport(hostId);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Reports retrieved successfully!",
      data: result,
    });
  }
);

export const ReportsController = {
  sendReport,
  getHostPropertyServiceReport,
};
