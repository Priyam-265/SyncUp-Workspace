import { Server } from "socket.io";
import User from "../models/User.js";

let io;

/**
 * Initialize Socket.io with all real-time event handlers.
 * @param {import("http").Server} server - The HTTP server instance
 */
export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Track online users: Map<socketId, { userId, workspaceId }>
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // ─── Workspace & Channel Room Management ───

    socket.on("join-workspace", ({ workspaceId, userId }) => {
      socket.join(`workspace:${workspaceId}`);
      onlineUsers.set(socket.id, { userId, workspaceId });

      // Update user status to online
      User.findByIdAndUpdate(userId, { status: "online", lastSeen: new Date() })
        .then(() => {
          // Broadcast to workspace that user is online
          io.to(`workspace:${workspaceId}`).emit("user-status-changed", {
            userId,
            status: "online",
          });
        })
        .catch((err) => console.error("Error updating user status:", err));

      console.log(`User ${userId} joined workspace ${workspaceId}`);
    });

    socket.on("leave-workspace", ({ workspaceId, userId }) => {
      socket.leave(`workspace:${workspaceId}`);
      onlineUsers.delete(socket.id);
      console.log(`User ${userId} left workspace ${workspaceId}`);
    });

    socket.on("join-channel", ({ channelId }) => {
      socket.join(`channel:${channelId}`);
      console.log(`Socket ${socket.id} joined channel ${channelId}`);
    });

    socket.on("leave-channel", ({ channelId }) => {
      socket.leave(`channel:${channelId}`);
      console.log(`Socket ${socket.id} left channel ${channelId}`);
    });

    // ─── Message Events ───

    socket.on("send-message", (message) => {
      // Broadcast to channel room (the REST controller also emits, 
      // but this handles pure socket-based sends from the client)
      io.to(`channel:${message.channelId}`).emit("new-message", message);
    });

    socket.on("delete-message", ({ messageId, channelId }) => {
      io.to(`channel:${channelId}`).emit("delete-message", { messageId, channelId });
    });

    // ─── Presence Events ───

    socket.on("user-online", ({ userId, workspaceId }) => {
      User.findByIdAndUpdate(userId, { status: "online", lastSeen: new Date() })
        .then(() => {
          io.to(`workspace:${workspaceId}`).emit("user-status-changed", {
            userId,
            status: "online",
          });
        })
        .catch((err) => console.error("Error updating online status:", err));
    });

    socket.on("user-offline", ({ userId, workspaceId }) => {
      User.findByIdAndUpdate(userId, { status: "offline", lastSeen: new Date() })
        .then(() => {
          io.to(`workspace:${workspaceId}`).emit("user-status-changed", {
            userId,
            status: "offline",
          });
        })
        .catch((err) => console.error("Error updating offline status:", err));
    });

    socket.on("user-away", ({ userId, workspaceId }) => {
      User.findByIdAndUpdate(userId, { status: "away" })
        .then(() => {
          io.to(`workspace:${workspaceId}`).emit("user-status-changed", {
            userId,
            status: "away",
          });
        })
        .catch((err) => console.error("Error updating away status:", err));
    });

    // ─── Typing Events ───

    socket.on("typing", ({ channelId, userId, fullName }) => {
      socket.to(`channel:${channelId}`).emit("user-typing", {
        channelId,
        userId,
        fullName,
      });
    });

    socket.on("stop-typing", ({ channelId, userId }) => {
      socket.to(`channel:${channelId}`).emit("user-stop-typing", {
        channelId,
        userId,
      });
    });

    // ─── Disconnect ───

    socket.on("disconnect", () => {
      const userData = onlineUsers.get(socket.id);

      if (userData) {
        const { userId, workspaceId } = userData;

        // Update user status to offline
        User.findByIdAndUpdate(userId, { status: "offline", lastSeen: new Date() })
          .then(() => {
            io.to(`workspace:${workspaceId}`).emit("user-status-changed", {
              userId,
              status: "offline",
            });
          })
          .catch((err) => console.error("Error updating disconnect status:", err));

        onlineUsers.delete(socket.id);
      }

      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  console.log("Socket.io initialized");
  return io;
};

/**
 * Get the Socket.io instance (for use in controllers).
 * @returns {Server} The Socket.io server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized — call initializeSocket first");
  }
  return io;
};
