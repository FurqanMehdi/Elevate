import Resume from "../models/Resume.js";
import User from "../models/User.js";

// 🟢 Create Resume
export const createResume = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Plan limit logic
    const resumeCount = await Resume.countDocuments({ user: user._id });
    if (user.plan === "free" && resumeCount >= 1) {
      return res.status(403).json({
        success: false,
        message: "Free plan allows only 1 resume. Upgrade to Pro plan.",
      });
    } else if (user.plan === "pro" && resumeCount >= 10) {
      return res.status(403).json({
        success: false,
        message: "Pro plan allows up to 10 resumes.",
      });
    }

    const newResume = await Resume.create({
      ...req.body,
      user: user._id,
    });

    res.status(201).json({
      success: true,
      message: "Resume created successfully",
      resume: newResume,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

// 🟡 Get All Resumes of a User
export const getUserResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, resumes });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 🔵 Get Single Resume by ID
export const getResumeById = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    if (resume.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });
    res.status(200).json({ success: true, resume });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 🟠 Update Resume
export const updateResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    if (resume.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    const updated = await Resume.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, message: "Resume updated", resume: updated });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

// 🔴 Delete Resume
export const deleteResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    if (resume.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    await Resume.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Resume deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
