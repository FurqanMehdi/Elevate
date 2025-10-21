import fetch from "node-fetch";
import User from "../models/User.js";

// 🌍 Automatically select Paddle API environment
const PADDLE_API_URL =
  process.env.PADDLE_ENV === "sandbox"
    ? "https://api.sandbox.paddle.com"
    : "https://api.paddle.com";

/**
 * @desc Create Paddle checkout link
 * @route POST /api/payments/create-checkout
 * @access Private
 */
export const createCheckout = async (req, res) => {
  try {
    console.log("🔵 Using Paddle API:", PADDLE_API_URL);

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Checkout payload for Paddle
    const payload = {
      items: [
        {
          price_id: process.env.PADDLE_PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      customer: {
        email: user.email,
      },
      custom_data: {
        userId: user._id.toString(),
      },
      success_url: "https://elevate-tbrr.onrender.com/success",
      cancel_url: "https://elevate-tbrr.onrender.com/cancel",
    };

    // ✅ Send request to Paddle API
    const response = await fetch(`${PADDLE_API_URL}/checkout-links`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("🔵 Paddle Response:", data);

    // ❌ Handle Paddle API errors gracefully
    if (!response.ok) {
      return res.status(response.status).json({
        message: "Paddle request failed",
        error: data,
      });
    }

    // ✅ Return checkout URL to frontend
    return res.status(200).json({
      success: true,
      checkoutUrl: data.data?.url,
    });
  } catch (err) {
    console.error("🔴 Paddle Error:", err.message);
    return res.status(500).json({
      message: "Payment initiation failed",
      error: err.message,
    });
  }
};

/**
 * @desc Paddle webhook to handle completed transactions
 * @route POST /api/payments/webhook
 * @access Public
 */
export const paddleWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (event.type === "transaction.completed") {
      const userId = event.data.custom_data?.userId;

      if (!userId) {
        return res.status(400).json({ message: "No userId in event" });
      }

      // ✅ Upgrade user plan
      await User.findByIdAndUpdate(userId, { plan: "pro" });
      console.log(`✅ User ${userId} upgraded to Pro`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    return res.status(500).json({ message: "Webhook failed" });
  }
};
