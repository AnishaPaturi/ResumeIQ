import express from "express";
import Resume from "../models/Resume.js";
import fs from "fs";

import { parserAgent } from "../agents/parserAgent.js";
import { scoringAgent } from "../agents/scoringAgent.js";
import { matcherAgent } from "../agents/matcherAgent.js";
import { advisorAgent } from "../agents/advisorAgent.js";

const router = express.Router();



router.get("/:resumeId", async (req, res) => {
  try {

    const resume = await Resume.findById(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({ message: "Resume not found" });
    }

    console.log("Reading resume from:", resume.path);

    const buffer = await fs.promises.readFile(resume.path);

    // dynamic import
    const pdfParse = (await import("pdf-parse")).default;

    const pdf = await pdfParse(buffer);
    const resumeText = pdf.text;

    console.log("Resume text length:", resumeText.length);

    const parsed = await parserAgent(resumeText);
    const score = await scoringAgent(resumeText);
    const match = await matcherAgent(resumeText, "");
    const advice = await advisorAgent(resumeText);

    resume.parsedData = parsed;
    resume.score = score;
    resume.skillMatch = match;
    resume.careerAdvice = advice;

    await resume.save();

    res.json({
      parsedData: parsed,
      score,
      skillMatch: match,
      careerAdvice: advice
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
