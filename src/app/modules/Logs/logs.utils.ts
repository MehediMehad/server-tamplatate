import fs from "fs";
import path from "path";

export const clearErrorLogs = () => {
  const logFilePath = path.join(__dirname, "../../../../logs/error.log");
  try {
    if (fs.existsSync(logFilePath)) {
      fs.writeFileSync(logFilePath, "");
      return true;
    }
    return false;
  } catch (error) {
    throw new Error(`Failed to clear error logs: ${(error as Error).message}`);
  }
};

export const LogsUtils = {
  clearErrorLogs,
};
