import axios from "axios";

export const advisorAgent = async (resume)=>{

const prompt = `
You are a career advisor for a 3rd year Computer Science student in India.

Analyze the resume and suggest:

1. skills to learn
2. projects to build
3. technologies trending in 2026
4. ways to improve the resume

Return JSON:

{
skills_to_learn: [],
projects_to_build: [],
trending_technologies: [],
resume_improvements: []
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
