import axios from "axios";

export const parserAgent = async (resume) => {

  const prompt = `
Extract skills, projects, education and experience from this resume.

Return JSON.

Resume:
${resume}
`;

  const res = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model:"anthropic/claude-3-haiku",
      messages:[
        {role:"user",content:prompt}
      ]
    },
    {
      headers:{
        "Authorization":`Bearer ${process.env.OPENROUTER_API_KEY}`
      }
    }
  );

  return res.data.choices[0].message.content;
};
