import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeResume(text) {

  const prompt = `
You are a professional resume reviewer.

Analyze this resume and return JSON with:
1. resumeScore (0-100)
2. strengths
3. weaknesses
4. improvementSuggestions
5. detectedSkills

Resume:
${text}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are an expert career advisor." },
      { role: "user", content: prompt }
    ],
    temperature: 0.4
  });

  return response.choices[0].message.content;
}
