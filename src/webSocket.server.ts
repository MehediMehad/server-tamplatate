// import { Server } from "http";
// import app from "./app";
// import seedSuperAdmin from "./app/DB";
// import config from "./app/config";
// import { chatServices } from "./app/modules/chat/chat.Service";
// import { WebSocket, WebSocketServer } from "ws";
// import prisma from "./app/config/prisma";
// import { notificationServices } from "./app/modules/notifications/notification.service";
// const port = config.port || 5001;

// async function main() {
//   const server: Server = app.listen(port, () => {
//     console.log("Sever is running on port ", port);
//     seedSuperAdmin();
//   });

//   const exitHandler = () => {
//     if (server) {
//       server.close(() => {
//         console.info("Server closed!");
//       });
//     }
//     process.exit(1);
//   };

//   process.on("uncaughtException", (error) => {
//     console.log(error);
//     exitHandler();
//   });

//   process.on("unhandledRejection", (error) => {
//     console.log(error);
//     exitHandler();
//   });

//   //Web Socket
//   interface JoinRoomMessage {
//     type: "joinRoom";
//     user1Id: string;
//     user2Id: string;
//   }

//   interface SendMessage {
//     type: "sendMessage";
//     chatroomId: string;
//     senderId: string;
//     receiverId: string;
//     content: string;
//     file?: string; // Optional file attachment
//   }

//   interface ViewMessages {
//     type: "viewMessages";
//     chatroomId: string;
//     userId: string;
//   }

//   type WebSocketMessage = JoinRoomMessage | SendMessage | ViewMessages;

//   // WebSocket Extended Interface to include custom properties like userId and roomId
//   interface ExtendedWebSocket extends WebSocket {
//     userId?: string;
//     roomId?: string;
//   }

//   const sendMessageToRoom = async (wss: any, chatroomId: any, message: any) => {
//     wss.clients.forEach((client: ExtendedWebSocket) => {
//       if (client.roomId === chatroomId && client.readyState === 1) {
//         client.send(
//           JSON.stringify({
//             type: "receiveMessage",
//             message,
//           })
//         );
//       }
//     });
//   };

//   const sendUnreadCount = async (
//     wss: any,
//     receiverId: any,
//     chatroomId: any
//   ) => {
//     const unreadCount = await chatServices.countUnreadMessages(
//       receiverId,
//       chatroomId
//     );
//     wss.clients.forEach((client: ExtendedWebSocket) => {
//       if (client.userId === receiverId && client.readyState === 1) {
//         client.send(
//           JSON.stringify({
//             type: "unreadCount",
//             unreadCount,
//           })
//         );
//       }
//     });
//   };

//   const sendNotificationIfInactive = async (
//     senderId: string,
//     receiverId: string
//   ) => {
//     const isReceiverActive = Array.from(wss.clients).some(
//       (client: ExtendedWebSocket) =>
//         client.userId === receiverId && client.readyState === 1
//     );

//     if (!isReceiverActive) {
//       const senderProfile = await prisma.user.findUnique({
//         where: { id: senderId },
//         select: { name: true },
//       });

//       const notificationData = {
//         title: "New Message Received!",
//         body: `${senderProfile?.name || "Someone"} has sent you a new message.`,
//       };

//       try {
//         await notificationServices.sendSingleNotification2(
//           senderId,
//           receiverId,
//           notificationData
//         );
//       } catch (error: any) {
//         console.error("Failed to send notification:", error.message);
//       }
//     }
//   };

//   const handleJoinRoom = async (ws: any, parsedData: any) => {
//     const { user1Id, user2Id } = parsedData;
//     ws.userId = user1Id;

//     console.log(`User ${user1Id} is now active`);

//     // Create or get conversation
//     const conversation = await chatServices.createConversationIntoDB(
//       user1Id,
//       user2Id
//     );
//     ws.roomId = conversation.id;

//     const unreadCount = await chatServices.countUnreadMessages(
//       user1Id,
//       ws.roomId
//     );
//     const conversationWithMessages =
//       await chatServices.getMessagesByConversationIntoDB(user1Id, user2Id);

//     ws.send(
//       JSON.stringify({
//         type: "loadMessages",
//         conversation: conversationWithMessages,
//         unreadCount,
//       })
//     );
//   };

//   const handleSendMessage = async (ws: any, wss: any, parsedData: any) => {
//     const { chatroomId, senderId, receiverId, content, file } = parsedData;

//     const message = await chatServices.createMessageIntoDB(
//       chatroomId,
//       senderId,
//       receiverId,
//       content,
//       file
//     );

//     ws.send(
//       JSON.stringify({
//         type: "messageSent",
//         message,
//       })
//     );

//     // Notify other users in the room
//     await sendMessageToRoom(wss, chatroomId, message);

//     // Send unread count to receiver
//     await sendUnreadCount(wss, receiverId, chatroomId);

//     // Check receiver's activity status and send notification if necessary
//     await sendNotificationIfInactive(senderId, receiverId);
//   };

//   const handleViewMessages = async (ws: any, parsedData: any) => {
//     const { chatroomId, userId } = parsedData;

//     console.log(parsedData, "parsedData");

//     // Mark messages as read when the user views the chat
//     await chatServices.markMessagesAsRead(userId, chatroomId);

//     // Send updated unread count
//     const unreadCount = await chatServices.countUnreadMessages(
//       userId,
//       chatroomId
//     );
//     ws.send(
//       JSON.stringify({
//         type: "unreadCount",
//         unreadCount,
//       })
//     );
//   };

//   // WebSocket Server Setup
//   const wss = new WebSocketServer({ server });

//   wss.on("connection", (ws: ExtendedWebSocket) => {
//     console.log("New client connected");

//     // Handle incoming messages
//     ws.on("message", async (data: string) => {
//       try {
//         const parsedData = JSON.parse(data);

//         switch (parsedData.type) {
//           case "joinRoom":
//             await handleJoinRoom(ws, parsedData);
//             break;

//           case "sendMessage":
//             await handleSendMessage(ws, wss, parsedData);
//             break;

//           case "viewMessage":
//             await handleViewMessages(ws, parsedData);
//             break;

//           default:
//             console.log("Unknown message type:", parsedData.type);
//         }
//       } catch (error) {
//         console.error("Error handling WebSocket message:", error);
//       }
//     });

//     // Handle WebSocket disconnect
//     ws.on("close", () => {
//       if (ws.userId) {
//         console.log(`User ${ws.userId} is now inactive`);
//       }
//     });
//   });
// }

// main();
