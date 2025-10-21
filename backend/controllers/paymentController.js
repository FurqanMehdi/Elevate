import fetch from "node-fetch";
import User from "../models/User.js";

// ✅ Correct Paddle base URLs (v2)
const PADDLE_API_URL =
  process.env.PADDLE_ENV === "sandbox"
    ? "https://sandbox-api.paddle.com"
    : "https://api.paddle.com";

export const createCheckout = async (req, res) => {
  try {
    console.log("🔵 Using Paddle API:", PADDLE_API_URL);

    // 1️⃣ Find the user
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2️⃣ Build checkout payload
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

    // 3️⃣ Send request to Paddle
    const response = await fetch(`${PADDLE_API_URL}/checkout-links`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("🟢 Paddle Response:", data);

    // 4️⃣ Handle API errors
    if (!response.ok) {
      console.error("🔴 Paddle error response:", data);
      return res.status(response.status).json({
        message: "Paddle request failed",
        error: data,
      });
    }

    // 5️⃣ Success — send checkout URL back to frontend
    res.status(200).json({
      success: true,
      checkoutUrl: data.data?.url,
    });
  } catch (err) {
    console.error("🔴 Payment error:", err.message);
    res.status(500).json({
      message: "Payment initiation failed",
      error: err.message,
    });
  }
};

// ✅ Paddle webhook
export const paddleWebhook = async (req, res) => {
  try {
    const event = req.body;

    if (event.type === "transaction.completed") {
      const userId = event.data.custom_data?.userId;
      if (!userId)
        return res.status(400).json({ message: "No userId in event" });

      await User.findByIdAndUpdate(userId, { plan: "pro" });
      console.log(`✅ User ${userId} upgraded to Pro`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("🔴 Webhook error:", err.message);
    res.status(500).json({ message: "Webhook failed" });
  }
};
