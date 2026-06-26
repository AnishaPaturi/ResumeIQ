import json
import httpx

async def call_gemini(api_key: str, prompt: str, system_instruction: str = "") -> dict:
    """Helper to query the Gemini API or OpenRouter with JSON output constraint."""
    if api_key.startswith("sk-or-"):
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "ResumeIQ"
        }
        if system_instruction:
            prompt = f"System Instruction: {system_instruction}\n\nUser Request: {prompt}"
        payload = {
            "model": "google/gemini-2.5-flash",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload, headers=headers)
            if response.status_code != 200:
                raise Exception(f"OpenRouter API error ({response.status_code}): {response.text}")
            result = response.json()
            try:
                text = result["choices"][0]["message"]["content"]
                return json.loads(text)
            except (KeyError, IndexError, json.JSONDecodeError) as e:
                raise Exception(f"Failed to parse OpenRouter response: {e}. Raw: {result}")
    else:
        models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"]
        last_exception = None
        
        if system_instruction:
            prompt = f"System Instruction: {system_instruction}\n\nUser Request: {prompt}"
            
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for model in models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                try:
                    response = await client.post(url, json=payload)
                    if response.status_code == 200:
                        result = response.json()
                        text = result["candidates"][0]["content"]["parts"][0]["text"]
                        return json.loads(text)
                    else:
                        raise Exception(f"Gemini API error ({response.status_code}): {response.text}")
                except Exception as e:
                    print(f"Model {model} failed, trying next fallback... Error: {e}")
                    last_exception = e
            
            raise last_exception or Exception("All Gemini API models failed.")

# 1. Resume Parsing Agent
async def resume_parsing_agent(resume_text: str, api_key: str) -> dict:
    prompt = f"""
    Extract structured data from the following resume text:
    \"\"\"
    {resume_text}
    \"\"\"
    
    Respond only with a JSON object in this format:
    {{
      "name": "Full Name",
      "email": "Email Address",
      "phone": "Phone Number",
      "links": ["portfolio url", "github url", etc],
      "summary": "Professional summary...",
      "skills": ["skill1", "skill2"],
      "experience": [
        {{
          "company": "Company Name",
          "role": "Role Title",
          "bullets": ["bullet point 1", "bullet point 2"]
        }}
      ],
      "projects": [
        {{
          "title": "Project Title",
          "bullets": ["bullet point 1", "bullet point 2"]
        }}
      ],
      "education": ["education item 1"]
    }}
    """
    return await call_gemini(api_key, prompt, "You are a professional Resume Parsing Agent.")

# 2. Portfolio Intelligence Agent
async def portfolio_intelligence_agent(portfolio_text: str, api_key: str) -> dict:
    if not portfolio_text:
        return {"projects": [], "technologies": []}
    prompt = f"""
    Analyze this crawled portfolio text and extract projects and technologies:
    \"\"\"
    {portfolio_text}
    \"\"\"
    
    Respond only with a JSON object in this format:
    {{
      "projects": [{{ "name": "Project Name", "tech_stack": ["react", "node"], "description": "brief desc" }}],
      "technologies": ["tech1", "tech2"]
    }}
    """
    return await call_gemini(api_key, prompt, "You are a Portfolio Intelligence Agent.")

# 3. GitHub Intelligence Agent
async def github_intelligence_agent(github_analysis: dict, api_key: str) -> dict:
    if not github_analysis:
        return {"projects_summary": [], "languages": []}
    prompt = f"""
    Summarize and format the GitHub repositories and active languages:
    {json.dumps(github_analysis)}
    
    Respond only with a JSON object in this format:
    {{
      "projects_summary": ["bullet of repo 1 with details", "bullet of repo 2 with details"],
      "languages": ["Lang1", "Lang2"]
    }}
    """
    return await call_gemini(api_key, prompt, "You are a GitHub Intelligence Agent.")

# 4. Job Description Intelligence Agent
async def job_description_intelligence_agent(job_desc: str, api_key: str) -> dict:
    prompt = f"""
    Analyze this Job Description and extract keywords, required skills, and domain terminology:
    \"\"\"
    {job_desc}
    \"\"\"
    
    Respond only with a JSON object in this format:
    {{
      "role": "Job Title/Domain",
      "required_skills": ["skill1", "skill2"],
      "ats_keywords": ["keyword1", "keyword2"]
    }}
    """
    return await call_gemini(api_key, prompt, "You are a Job Description Intelligence Agent.")

# 5. Gap Analysis Agent
async def gap_analysis_agent(parsed_resume: dict, portfolio_data: dict, github_data: dict, jd_data: dict, api_key: str) -> dict:
    prompt = f"""
    Compare the candidate's profile against the job description requirements.
    
    Candidate Resume Details:
    {json.dumps(parsed_resume)}
    
    Portfolio Details:
    {json.dumps(portfolio_data)}
    
    GitHub Details:
    {json.dumps(github_data)}
    
    Job Description Requirements:
    {json.dumps(jd_data)}
    
    Analyze and identify the gaps.
    Respond only with a JSON object in this format:
    {{
      "compatibility_score": 75,
      "matching_skills": ["skill1", "skill2"],
      "missing_skills": ["skill3", "skill4"],
      "action_plan": ["learn technology X", "emphasize project Y"]
    }}
    """
    return await call_gemini(api_key, prompt, "You are a Gap Analysis Agent.")

# 6. Resume Optimization Agent
async def resume_optimization_agent(parsed_resume: dict, gap_analysis: dict, api_key: str) -> dict:
    prompt = f"""
    Optimize the resume bullets and summary to address the gaps and align with the target job.
    
    Original Resume Content:
    {json.dumps(parsed_resume)}
    
    Gap Analysis findings:
    {json.dumps(gap_analysis)}
    
    You must:
    1. Rewrite professional summary.
    2. Map the original experience and project bullet points directly to optimized versions that weave in missing skills/keywords and use strong action verbs.
    
    Respond only with a JSON object in this format:
    {{
      "summary": "Optimized professional summary text...",
      "optimizedBullets": {{
        "original bullet text exactly": "new optimized bullet text",
        ...
      }}
    }}
    """
    return await call_gemini(api_key, prompt, "You are a Resume Optimization Agent.")

# 7. ATS Validation Agent
async def ats_validation_agent(optimized_data: dict, jd_data: dict, api_key: str) -> dict:
    prompt = f"""
    Evaluate the optimized resume against the job description requirements to measure ATS performance.
    
    Optimized Resume data:
    {json.dumps(optimized_data)}
    
    Job Requirements:
    {json.dumps(jd_data)}
    
    Respond only with a JSON object in this format:
    {{
      "atsScore": 85,
      "previousScore": 55,
      "keywordCoverage": 82,
      "sectionQuality": 90,
      "readabilityScore": 80,
      "missingKeywords": ["kw1"],
      "addedKeywords": ["kw2"],
      "improvements": ["improvement detail 1", "improvement detail 2"]
    }}
    """
    return await call_gemini(api_key, prompt, "You are an ATS Validation Agent.")

# 8. Template Preservation Agent
def template_preservation_agent(file_bytes: bytes, optimized_bullets: dict, tailored_summary: str, file_name: str) -> bytes:
    """Invokes python-docx utility to perform formatting-safe XML text substitution."""
    from .utils import patch_docx_file
    if file_name.endswith(".docx"):
        return patch_docx_file(file_bytes, optimized_bullets, tailored_summary)
    # If PDF, we pass it back (frontend pdf-lib will patch PDF templates in-place)
    return file_bytes

# 9. Resume Generation Agent
def resume_generation_agent(patched_bytes: bytes, file_name: str) -> dict:
    """Prepares and packages the generated file for delivery."""
    return {
        "file_name": file_name,
        "content_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document" if file_name.endswith(".docx") else "application/pdf",
        "size_bytes": len(patched_bytes)
    }
