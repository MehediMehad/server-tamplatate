import { Server } from "http";
import app from "./app";
import seedSuperAdmin from "./app/DB";
import config from "./app/config";
import { createUploadsFolder } from "./app/helpers/createUploadsFolder";
import { getLocalIPv4Addresses } from "./app/helpers/Development/getLocalIPv4Addresses";

let server: Server;

async function main() {
  try {
    // 🟢 Start the server
    const port = config.port || 5000;
    server = app.listen(port, async () => {
      console.log(`🚀 Server is running on port ${port}`);
      createUploadsFolder(); // 📁 Create (Uploads) Folder
      await seedSuperAdmin(); // Seed Super Admin user on startup
      getLocalIPv4Addresses(); // 🖥️ Your PC's local IPv4 address(es)
    });

    // 🔐 Handle Uncaught Exceptions
    process.on("uncaughtException", (error) => {
      console.error("❌ Uncaught Exception:", error);
      shutdown();
    });

    // 🔐 Handle Unhandled Promise Rejections
    process.on("unhandledRejection", (reason) => {
      console.error("❌ Unhandled Rejection:", reason);
      shutdown();
    });

    // 🛑 Graceful Shutdown
    process.on("SIGTERM", () => {
      console.info("🔁 SIGTERM received.");
      shutdown();
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// 🔁 Graceful Server Shutdown
function shutdown() {
  if (server) {
    server.close(() => {
      console.info("🔒 Server closed gracefully.");
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
}

main();
