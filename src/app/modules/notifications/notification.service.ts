import admin from "../../config/firebaseAdmin";
import prisma from "../../config/prisma";
import ApiError from "../../errors/ApiError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination.type";

interface NotificationData {
  title: string;
  body: string;
}

const sendSingleNotification2 = async (
  senderId: string,
  receiverId: string,
  notificationData: NotificationData
) => {
  const user = await prisma.user.findUnique({
    where: { id: receiverId },
  });

  if (!user?.fcmToken) {
    console.warn(`No FCM token found for user ${receiverId}`);
    return;
  }

  const message = {
    notification: {
      title: notificationData.title,
      body: notificationData.body,
    },
    token: user.fcmToken,
  };

  await prisma.notification.create({
    data: {
      receiverId,
      senderId,
      title: notificationData.title,
      body: notificationData.body,
    },
  });

  try {
    const response = await admin.messaging().send(message);
    console.log(`Notification sent successfully to user ${receiverId}`);
    return response;
  } catch (error: any) {
    console.error("Error sending notification:", error);
    if (error.code === "messaging/invalid-registration-token") {
      throw new ApiError(400, "Invalid FCM registration token");
    } else if (error.code === "messaging/registration-token-not-registered") {
      throw new ApiError(404, "FCM token is no longer registered");
    } else {
      throw new ApiError(500, "Failed to send notification");
    }
  }
};

// Send notification to a single user
const sendSingleNotification = async (req: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.userId },
  });

  if (!user?.fcmToken) {
    return;
  }

  const message = {
    notification: {
      title: req.body.title,
      body: req.body.body,
    },
    token: user.fcmToken,
  };

  await prisma.notification.create({
    data: {
      receiverId: req.params.userId,
      senderId: req.user.id,
      title: req.body.title,
      body: req.body.body,
    },
  });

  try {
    const response = await admin.messaging().send(message);
    return response;
  } catch (error: any) {
    if (error.code === "messaging/invalid-registration-token") {
      throw new ApiError(400, "Invalid FCM registration token");
    } else if (error.code === "messaging/registration-token-not-registered") {
      throw new ApiError(404, "FCM token is no longer registered");
    } else {
      throw new ApiError(500, "Failed to send notification");
    }
  }
};

// Send notifications to all users with valid FCM tokens
const sendNotifications = async (senderId: string, req: any) => {
  const users = await prisma.user.findMany({
    where: {
      fcmToken: {},
    },
    select: {
      id: true,
      fcmToken: true,
    },
  });

  if (!users || users.length === 0) {
    throw new ApiError(404, "No users found with FCM tokens");
  }

  const fcmTokens = users.map((user) => user.fcmToken);

  const message = {
    notification: {
      title: req.body.title,
      body: req.body.body,
    },
    tokens: fcmTokens,
  };

  const response = await admin.messaging().sendEachForMulticast(message as any);
  // Find indices of successful responses
  const successIndices = response.responses
    .map((res, idx) => (res.success ? idx : null))
    .filter((idx) => idx !== null) as number[];

  // Filter users by success indices
  const successfulUsers = successIndices.map((idx) => users[idx]);

  // Prepare notifications data for only successfully notified users
  const notificationData = successfulUsers.map((user) => ({
    senderId: senderId,
    receiverId: user.id,
    title: req.body.title,
    body: req.body.body,
  }));

  // Save notifications only if there is data
  if (notificationData.length > 0) {
    await prisma.notification.createMany({
      data: notificationData,
    });
  }

  // Collect failed tokens
  const failedTokens = response.responses
    .map((res, idx) => (!res.success ? fcmTokens[idx] : null))
    .filter((token) => token !== null);

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    failedTokens,
  };
};

export interface NotificationMessage {
  receiverId: string;
  fcmToken: string | null;
  title: string;
  body: string;
}
// Send booking-related notifications via FCM and save to database
export const sendBookingNotifications2 = async (
  notificationMessages: NotificationMessage[],
  superAdminId: string
) => {
  // Filter notifications with valid fcmToken and create notification records
  const notificationsToCreate = notificationMessages
    .filter((message) => message.fcmToken !== null) // Only include messages with valid fcmToken
    .map((message) => ({
      receiverId: message.receiverId,
      senderId: superAdminId, // Set superAdminId as the sender
      title: message.title,
      body: message.body,
      read: false, // Default value as per schema
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

  // Create notifications in the database
  if (notificationsToCreate.length > 0) {
    await prisma.notification.createMany({
      data: notificationsToCreate,
    });
    console.log(
      `Created ${notificationsToCreate.length} notifications in the database.`
    );
  } else {
    console.log("No notifications to create (all fcmTokens were null).");
  }

  console.log(
    "notificationMessages:🎦",
    notificationMessages,
    "notificationsToCreate: ✅",
    notificationsToCreate
  );

  return { success: true, createdCount: notificationsToCreate.length };
};

export const sendBookingNotifications = async (
  notificationMessages: NotificationMessage[],
  superAdminId: string
) => {
  // Filter notifications with valid fcmToken and create notification records
  const notificationsToCreate = notificationMessages
    .filter((message) => message.fcmToken !== null) // Only include messages with valid fcmToken
    .map((message) => ({
      receiverId: message.receiverId,
      senderId: superAdminId, // Set superAdminId as the sender
      title: message.title,
      body: message.body,
      read: false, // Default value as per schema
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

  // Create notifications in the database
  if (notificationsToCreate.length > 0) {
    await prisma.notification.createMany({
      data: notificationsToCreate,
    });
    console.log(
      `Created ${notificationsToCreate.length} notifications in the database.`
    );
  } else {
    console.log("No notifications to create (all fcmTokens were null).");
  }

  // Prepare Firebase messages for valid fcmTokens
  const messages = notificationMessages
    .filter((message) => message.fcmToken !== null)
    .map((message) => ({
      notification: {
        title: message.title,
        body: message.body,
      },
      token: message.fcmToken!,
    }));

  // Send notifications via Firebase
  const results = {
    successCount: 0,
    failedCount: 0,
    errors: [] as { receiverId: string; error: string }[],
  };

  if (messages.length > 0) {
    const sendPromises = messages.map(async (message, index) => {
      try {
        await admin.messaging().send(message);
        results.successCount++;
      } catch (error: any) {
        results.failedCount++;
        results.errors.push({
          receiverId: notificationsToCreate[index].receiverId,
          error:
            error.code === "messaging/invalid-registration-token"
              ? "Invalid FCM registration token"
              : error.code === "messaging/registration-token-not-registered"
              ? "FCM token is no longer registered"
              : "Failed to send notification",
        });
      }
    });

    await Promise.all(sendPromises);
    console.log(
      `Sent ${results.successCount} notifications successfully, ${results.failedCount} failed.`
    );
    if (results.errors.length > 0) {
      console.log("Notification errors:", results.errors);
    }
  } else {
    console.log("No notifications to send (no valid fcmTokens).");
  }

  return {
    success: true,
    createdCount: notificationsToCreate.length,
    sentCount: results.successCount,
    failedCount: results.failedCount,
    errors: results.errors,
  };
};
const getNotificationsFromDB = async (userId: string) => {
  const notifications = await prisma.notification.findMany({
    where: {
      receiverId: userId,
    },
    select: {
      id: true,
      title: true,
      body: true,
      senderId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return notifications;
};

const getSingleNotificationFromDB = async (
  req: any,
  notificationId: string
) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      receiverId: req.user.id,
    },
  });

  const updatedNotification = await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
    select: {
      id: true,
      title: true,
      body: true,
      senderId: true,
      createdAt: true,
      // user: {
      //   select: {
      //     name: true,
      //     profileImage: true,
      //   },
      // },
    },
  });

  return updatedNotification;
};

export const notificationServices = {
  sendSingleNotification,
  sendSingleNotification2,
  sendNotifications,
  getNotificationsFromDB,
  getSingleNotificationFromDB,
};
