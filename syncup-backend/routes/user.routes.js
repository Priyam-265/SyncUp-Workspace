import express from "express";
import multer from "multer";
import {
  getAllUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  searchUsers,
  changePassword,
} from "../controllers/user.controller.js";
import protectRoute from "../middleware/auth.middleware.js";

const router = express.Router();

// Multer memory storage for avatar uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Search route MUST come before /:id to avoid being caught by the param route
router.get("/search", protectRoute, searchUsers);

router.get("/", protectRoute, getAllUsers);
router.get("/:id", protectRoute, getUserById);
router.patch("/:id", protectRoute, upload.single("avatar"), updateUser);
router.patch("/:id/status", protectRoute, updateUserStatus);
router.post("/:id/change-password", protectRoute, changePassword);

export default router;
