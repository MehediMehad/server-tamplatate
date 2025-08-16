import fs from "fs/promises";
import path from "path";

/**
 * Recursively removes all files in a specified folder.
 * @param folderPath - The path to the folder to clean.
 */
export const removeAllFilesInFolder = async (
  folderPath: string = "uploads"
) => {
  try {
    const files = await fs.readdir(folderPath);

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const stat = await fs.lstat(filePath);

      if (stat.isDirectory()) {
        // Recursive delete inside sub-folder
        await removeAllFilesInFolder(filePath);
        await fs.rmdir(filePath); // Delete empty folder
      } else {
        await fs.unlink(filePath);
        console.log(`✅ Deleted file: ${filePath}`);
      }
    }

    console.log(`🧹 All files in "${folderPath}" have been deleted.`);
  } catch (error: any) {
    console.error(`❌ Error cleaning folder "${folderPath}":`, error);
  }
};
