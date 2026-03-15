import axios from "axios";

export const matcherAgent = async (resume,requirements)=>{

const prompt = `
Compare this resume with the job requirements.

Identify:

- matching skills
- missing skills
- compatibility score out of 100

Return JSON:

{
matching_skills: [],
missing_skills: [],
compatibility_score: number
}

Resume:
${resume}

Job Requirements:
${requirements}
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
