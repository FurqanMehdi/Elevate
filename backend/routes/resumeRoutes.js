import express from "express";
import protect from "../middleware/authMiddleware.js";
import { downloadResumePDF } from "../controllers/resumePdfController.js";
import {
  createResume,
  getUserResumes,
  getResumeById,
  updateResume,
  deleteResume,
} from "../controllers/resumeController.js";

const router = express.Router();

// Protected Routes
router.post("/", protect, createResume);
router.get("/", protect, getUserResumes);
router.get("/:id", protect, getResumeById);
router.put("/:id", protect, updateResume);
router.delete("/:id", protect, deleteResume);
router.get("/:id/download", protect, downloadResumePDF);


export default router;
