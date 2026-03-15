import { extractText } from "../utils/extractText.js";

import { parserAgent } from "../agents/parserAgent.js";
import { scoringAgent } from "../agents/scoringAgent.js";
import { matcherAgent } from "../agents/matcherAgent.js";
import { advisorAgent } from "../agents/advisorAgent.js";
import Resume from "../models/Resume.js";

export const getResumeHistory = async (req, res) => {

  const resumes = await Resume.find({
    user: req.user.id
  }).sort({ createdAt: -1 });

  res.json(resumes);

};

export const analyzeResume = async (req, res) => {

  const file = req.file;
  const userId = req.user.id;
  const { requirements } = req.body;

  const resumeText = await extractText(file.path);

  const parsed = await parserAgent(resumeText);

  const score = await scoringAgent(resumeText);

  const match = await matcherAgent(resumeText, requirements);

  const advice = await advisorAgent(resumeText);

  const resumeDoc = await Resume.create({
    user: userId,
    fileName: file.originalname,

    parsedData: parsed,

    score: score,

    skillMatch: match,

    careerAdvice: advice
  });

  res.json({
    resume: resumeDoc
  });

};
