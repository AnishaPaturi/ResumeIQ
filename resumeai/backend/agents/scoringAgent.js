import axios from "axios";

export const scoringAgent = async (resume) => {

const prompt = `
Score this resume out of 100 based on

- technical skills
- projects
- ATS friendliness
- relevance for software engineering roles

Return JSON:

{
score: number,
strengths: [],
weaknesses: []
}

Resume:
${resume}
`;

const response = await axios.post(
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

return response.data.choices[0].message.content;

};
