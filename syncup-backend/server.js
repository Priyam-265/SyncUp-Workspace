import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import { initializeSocket } from "./socket/socket.js";

// Route imports
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import workspaceRoutes from "./routes/workspace.routes.js";
import channelRoutes from "./routes/channel.routes.js";
import messageRoutes from "./routes/message.routes.js";

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// ─── Middleware ───

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: [process.env.FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"].filter(Boolean),
    credentials: true,
  })
);

// ─── API Routes ───

app.get("/", (req, res) => {
  res.json({ message: "SyncUp Workspace API is running 🚀" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/workspaces", workspaceRoutes);

// Channel routes use a dual-prefix pattern, so mount at /api
app.use("/api", channelRoutes);

// Message & upload routes also use dual prefixes, so mount at /api
app.use("/api", messageRoutes);

// ─── Initialize Socket.io ───

initializeSocket(server);

// ─── Start Server ───

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || "development"} mode`);
  });
});
