import { extractText } from "../utils/extractText.js";

import { parserAgent } from "../agents/parserAgent.js";
import { scoringAgent } from "../agents/scoringAgent.js";
import { matcherAgent } from "../agents/matcherAgent.js";
import { advisorAgent } from "../agents/advisorAgent.js";

export const analyzeResume = async (req,res) => {

  const file = req.file;
  const {requirements} = req.body;

  const resumeText = await extractText(file.path);

  const parsed = await parserAgent(resumeText);

  const score = await scoringAgent(resumeText);

  const match = await matcherAgent(resumeText,requirements);

  const advice = await advisorAgent(resumeText);

  res.json({
    parsed,
    score,
    match,
    advice
  });
};
