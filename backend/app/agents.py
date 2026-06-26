import json
import httpx
import asyncio
import os

async def call_gemini(api_key: str, prompt: str, system_instruction: str = "") -> dict:
    """Helper to query OpenRouter as default and fallback to standard Gemini API."""
    # Gather keys from parameter or env vars
    openrouter_key = api_key if api_key.startswith("sk-or-") else os.environ.get("OPENROUTER_API_KEY")
    gemini_key = api_key if not api_key.startswith("sk-or-") else os.environ.get("GEMINI_API_KEY")
    
    last_exception = None
    
    # 1. Query OpenRouter first if a key is available
    if openrouter_key:
        models = [
            "google/gemini-2.5-flash",
            "google/gemini-2.0-flash",
            "google/gemini-2.0-flash-lite",
            "google/gemini-flash-latest",
            "google/gemini-pro-latest"
        ]
        
        url = "https://openrouter.ai/api/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {openrouter_key}",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "ResumeIQ"
        }
        
        openrouter_prompt = prompt
        if system_instruction:
            openrouter_prompt = f"System Instruction: {system_instruction}\n\nUser Request: {prompt}"
            
        async with httpx.AsyncClient(timeout=30.0) as client:
            for model in models:
                max_retries = 3
                initial_delay = 2.0
                delay = initial_delay
                
                for attempt in range(max_retries):
                    try:
                        payload = {
                            "model": model,
                            "messages": [
                                {"role": "user", "content": openrouter_prompt}
                            ],
                            "response_format": {"type": "json_object"}
                        }
                        response = await client.post(url, json=payload, headers=headers)
                        
                        # Handle Rate Limits (429) specifically
                        if response.status_code == 429:
                            if attempt < max_retries - 1:
                                print(f"OpenRouter Rate limit (429) for {model}. Waiting for 5s...")
                                await asyncio.sleep(5.0)
                                continue
                                
                        if response.status_code == 200:
                            result = response.json()
                            text = result["choices"][0]["message"]["content"]
                            return json.loads(text)
                            
                        raise Exception(f"OpenRouter API error ({response.status_code}): {response.text}")
                    except Exception as e:
                        if attempt < max_retries - 1 and any(ec in str(e) for ec in ["429", "500", "503", "504"]):
                            await asyncio.sleep(delay)
                            delay *= 2
                            continue
                        print(f"OpenRouter Model {model} failed. Error: {e}")
                        last_exception = e
                        break
        print("OpenRouter failed completely. Attempting fallback to standard Gemini API...")

    # 2. Fall back to standard Gemini API if key is available
    if gemini_key:
        models = [
            "gemini-3.5-flash",
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-2.0-flash-lite",
            "gemini-3.1-flash-lite",
            "gemini-2.5-flash-lite",
            "gemini-flash-latest",
            "gemini-flash-lite-latest",
            "gemini-pro-latest"
        ]
        
        gemini_prompt = prompt
        if system_instruction:
            gemini_prompt = f"System Instruction: {system_instruction}\n\nUser Request: {prompt}"
            
        payload = {
            "contents": [{
                "parts": [{"text": gemini_prompt}]
            }],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for model in models:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={gemini_key}"
                
                max_retries = 3
                initial_delay = 2.0  # seconds
                delay = initial_delay
                
                for attempt in range(max_retries):
                    try:
                        response = await client.post(url, json=payload)
                        if response.status_code == 200:
                            result = response.json()
                            text = result["candidates"][0]["content"]["parts"][0]["text"]
                            return json.loads(text)
                        
                        # Handle Rate Limits (429) specifically by parsing retryDelay
                        if response.status_code == 429:
                            sleep_time = 38.0  # default fallback based on Google quota duration
                            try:
                                err_data = response.json()
                                for detail in err_data.get("error", {}).get("details", []):
                                    if "RetryInfo" in detail.get("@type", "") or "retryDelay" in detail:
                                        retry_delay_str = detail.get("retryDelay", "38s")
                                        sleep_time = float(retry_delay_str.rstrip("s"))
                                        break
                            except Exception:
                                pass
                            
                            if attempt < max_retries - 1:
                                print(f"Rate limit (429) hit for {model}. Waiting for {sleep_time} seconds before retrying...")
                                await asyncio.sleep(sleep_time)
                                continue
                        
                        # Retrying on temporary server issues (500, 503, 504)
                        if response.status_code in [500, 503, 504]:
                            if attempt < max_retries - 1:
                                print(f"Transient error {response.status_code} for {model}. Retrying in {delay}s...")
                                await asyncio.sleep(delay)
                                delay *= 2
                                continue
                        
                        raise Exception(f"Gemini API error ({response.status_code}): {response.text}")
                    except Exception as e:
                        err_str = str(e)
                        is_429 = "429" in err_str
                        is_transient = any(err_code in err_str for err_code in ["500", "503", "504"])
                        
                        if attempt < max_retries - 1:
                            if is_429:
                                print(f"Rate limit Exception during request for {model}: {e}. Waiting for 38 seconds...")
                                await asyncio.sleep(38.0)
                                continue
                            elif is_transient:
                                print(f"Transient Exception during request for {model}: {e}. Retrying in {delay}s...")
                                await asyncio.sleep(delay)
                                delay *= 2
                                continue
                        
                        print(f"Model {model} failed, trying next fallback... Error: {e}")
                        last_exception = e
                        break
            
            raise last_exception or Exception("All Gemini API models failed.")
            
    raise last_exception or Exception("No valid API Key (OpenRouter or standard Gemini) could be found.")

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
