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

    res.json({
      message: "Resume uploaded successfully",
      resumeId: resume._id
    });

  } catch (error) {

    console.error("UPLOAD ERROR:", error);

    res.status(500).json({
      message: "Upload failed"
    });

  }

});

router.get("/:resumeId", async (req, res) => {

  try {

    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    console.log("Resume found:", resume);

    const buffer = fs.readFileSync(resume.path);

    const data = await pdfParse(buffer);

    console.log("Parsed text length:", data.text.length);

    res.json({
      message: "Resume parsed",
      text: data.text
    });

  } catch (error) {

    console.error("ANALYZE ERROR:", error);

    res.status(500).json({
      message: "Analysis failed",
      error: error.message
    });

  }

});

export default router;
