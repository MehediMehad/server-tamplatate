import { Request, Response } from "express";
import httpStatus from "http-status";
import { LogsService } from "./logs.service";
import catchAsync from "../../helpers/catchAsync";
import sendResponse from "../../utils/sendResponse";
import path from "path";

const getErrorLogs = catchAsync(async (req: Request, res: Response) => {
  const logs = await LogsService.getErrorLogs();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Error logs retrieved successfully",
    data: logs,
  });
});

const renderErrorLogs = catchAsync(async (req: Request, res: Response) => {
  const logs = await LogsService.getErrorLogs();
  res.render(path.join(__dirname, "../../../../logs.html"), { logs });
});

export const LogsController = {
  getErrorLogs,
  renderErrorLogs,
};
