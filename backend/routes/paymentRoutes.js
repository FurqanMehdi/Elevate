import express from "express";
import protect from "../middleware/authMiddleware.js";
import { createCheckout, paddleWebhook } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/create-checkout", protect, createCheckout);

// Paddle webhook
router.post("/webhook", express.json({ type: "*/*" }), paddleWebhook);

export default router;
