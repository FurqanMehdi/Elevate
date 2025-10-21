import fetch from "node-fetch";
import User from "../models/User.js";

const PADDLE_API_URL =
  process.env.PADDLE_ENV === "sandbox"
    ? "https://api.sandbox.paddle.com"
    : "https://api.paddle.com";

export const createCheckout = async (req, res) => {
  try {
    console.log("🔵 ENV CHECK:");
    console.log("PADDLE_ENV:", process.env.PADDLE_ENV);
    console.log("PADDLE_API_URL:", PADDLE_API_URL);
    console.log("PADDLE_API_KEY (first 10 chars):", process.env.PADDLE_API_KEY?.slice(0, 10));
    console.log("PADDLE_PRO_PRICE_ID:", process.env.PADDLE_PRO_PRICE_ID);

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const payload = {
      items: [{ price_id: process.env.PADDLE_PRO_PRICE_ID, quantity: 1 }],
      customer: { email: user.email },
      custom_data: { userId: user._id.toString() },
      success_url: "https://elevate-tbrr.onrender.com/success",
      cancel_url: "https://elevate-tbrr.onrender.com/cancel",
    };

    console.log("📦 Sending payload:", JSON.stringify(payload, null, 2));

    const url = `${PADDLE_API_URL}/checkout-links`;
    console.log("🌐 Fetching URL:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("🟢 Paddle response:", data);

    if (!response.ok) {
      return res.status(response.status).json({
        message: "Paddle request failed",
        error: data,
      });
    }

    res.status(200).json({
      success: true,
      checkoutUrl: data.data?.url,
    });
  } catch (err) {
    console.error("🔴 Error in createCheckout:", err.message);
    res.status(500).json({
      message: "Payment initiation failed",
      error: err.message,
    });
  }
};


export const paddleWebhook = async (req, res) => {
  try {
    const event = req.body;
    if (event.type === "transaction.completed") {
      const userId = event.data.custom_data?.userId;
      if (!userId) return res.status(400).json({ message: "Missing userId" });

      await User.findByIdAndUpdate(userId, { plan: "pro" });
      console.log(`✅ User ${userId} upgraded to Pro`);
    }
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.status(500).json({ message: "Webhook failed" });
  }
};
