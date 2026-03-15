import express from "express";
import multer from "multer";
import Resume from "../models/Resume.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

router.post("/upload", upload.single("resume"), async (req, res) => {

  try {

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const resume = new Resume({
      user: req.body.userId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path
    });

    await resume.save();

    return res.status(200).json({
      message: "Resume uploaded",
      resumeId: resume._id
    });

  } catch (error) {

    console.error("UPLOAD ERROR:", error);

    return res.status(500).json({
      message: "Upload failed",
      error: error.message
    });

  }

});

export default router;
