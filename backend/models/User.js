import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },

    // 🪙 Plan & Credits
    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    resumeCredits: { type: Number, default: 1 }, // 🆓 Free = 1 credit
    paymentHistory: [
      {
        amount: Number,
        date: { type: Date, default: Date.now },
        transactionId: String,
        paymentMethod: String,
      },
    ],
  },
  { timestamps: true }
);

// 🔐 Encrypt password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🧠 Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
