import fs from "fs";
import path from "path";
import httpStatus from "http-status";
import AppError from "../../errors/ApiError";

export const getErrorLogs = async () => {
  const logFilePath = path.join(__dirname, "../../../../logs/error.log");
  if (!fs.existsSync(logFilePath)) {
    throw new AppError(httpStatus.NOT_FOUND, "Error log file not found");
  }

  const logs = fs.readFileSync(logFilePath, "utf-8");
  const logEntries = logs
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch (e) {
        return { message: "Invalid log entry", raw: line };
      }
    });

  return logEntries;
};

export const LogsService = {
  getErrorLogs,
};
