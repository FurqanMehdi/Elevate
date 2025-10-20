import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import Resume from "../models/Resume.js";
import User from "../models/User.js";
import { fileURLToPath } from "url";
import Handlebars from "handlebars";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const downloadResumePDF = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id).lean();
    if (!resume) return res.status(404).json({ message: "Resume not found" });
    if (resume.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not authorized" });

    // 🧩 Fetch user to check plan
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🛑 Restrict free users from using pro themes
    if (user.plan === "free" && resume.theme.startsWith("pro-")) {
      return res.status(403).json({
        message: "Upgrade to Pro to use this premium theme.",
      });
    }

    // 🧠 Template Path (theme stored in resume.theme)
    const templatePath = path.join(
      __dirname,
      `../templates/${resume.theme.includes("pro") ? "pro" : "free"}/${resume.theme}.html`
    );

    // 📝 Load and compile template
    const templateFile = fs.readFileSync(templatePath, "utf-8");
    const compiled = Handlebars.compile(templateFile);
    const html = compiled(resume);

    // 🖨️ Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await browser.close();

    // 📤 Send PDF as download
    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${resume.name}-resume.pdf"`,
    });
    res.send(pdfBuffer);

  } catch (err) {
    console.error("PDF Generation Error:", err);
    res.status(500).json({ message: "Server error while generating PDF" });
  }
};
