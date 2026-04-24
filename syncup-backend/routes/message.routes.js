import express from "express";
import multer from "multer";
import { getMessages, sendMessage, deleteMessage } from "../controllers/message.controller.js";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Multer memory storage for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Message routes scoped under /api/channels/:channelId/messages
router.get("/channels/:channelId/messages", protectRoute, getMessages);
router.post("/channels/:channelId/messages", protectRoute, sendMessage);

// Message route scoped under /api/messages/:id
router.delete("/messages/:id", protectRoute, deleteMessage);

// File upload route — POST /api/upload
router.post("/upload", protectRoute, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const result = await uploadToCloudinary(req.file.buffer, "syncup/files");

    res.status(200).json({
      fileUrl: result.secure_url,
      fileType: req.file.mimetype,
      fileName: req.file.originalname,
    });
  } catch (error) {
    console.error("File upload error:", error.message);
    res.status(500).json({ message: "File upload failed" });
  }
});

export default router;
