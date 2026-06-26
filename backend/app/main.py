import json
import os
from fastapi import FastAPI, UploadFile, File, Form, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import io

from .utils import (
    extract_text_from_pdf,
    extract_text_from_docx,
    crawl_portfolio,
    analyze_github
)
from .agents import (
    resume_parsing_agent,
    portfolio_intelligence_agent,
    github_intelligence_agent,
    job_description_intelligence_agent,
    gap_analysis_agent,
    resume_optimization_agent,
    ats_validation_agent,
    template_preservation_agent,
    resume_generation_agent
)

app = FastAPI(title="ResumeIQ Multi-Agent API", version="1.0.0")

# Enable CORS for the frontend development server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/analyze")
async def analyze_resume_endpoint(
    resume: UploadFile = File(...),
    job_description: str = Form(...),
    portfolio_url: str = Form(""),
    github_url: str = Form(""),
    x_api_key: str = Header(None) # Accept API key from request header
):
    # Ensure API Key is provided (checking request header or server-side env vars)
    api_key = x_api_key or os.environ.get("GEMINI_API_KEY") or os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="Missing API Key. Please enter an API key in the frontend settings, or configure the GEMINI_API_KEY / OPENROUTER_API_KEY environment variable on the server."
        )
    
    try:
        # Read file bytes
        file_bytes = await resume.read()
        
        # Agent 1: Resume Parsing Agent
        # First extract text
        if resume.filename.endswith(".pdf"):
            resume_text = extract_text_from_pdf(file_bytes)
        elif resume.filename.endswith(".docx"):
            resume_text = extract_text_from_docx(file_bytes)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF or DOCX.")
            
        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Failed to extract text from resume.")
            
        parsed_resume = await resume_parsing_agent(resume_text, api_key)
        
        # Agent 2: Portfolio Intelligence Agent
        portfolio_text = ""
        if portfolio_url:
            portfolio_text = await crawl_portfolio(portfolio_url)
        portfolio_data = await portfolio_intelligence_agent(portfolio_text, api_key)
        
        # Agent 3: GitHub Intelligence Agent
        github_raw = {}
        if github_url:
            github_raw = await analyze_github(github_url)
        github_data = await github_intelligence_agent(github_raw, api_key)
        
        # Agent 4: Job Description Intelligence Agent
        jd_data = await job_description_intelligence_agent(job_description, api_key)
        
        # Agent 5: Gap Analysis Agent
        gap_analysis = await gap_analysis_agent(
            parsed_resume, portfolio_data, github_data, jd_data, api_key
        )
        
        # Agent 6: Resume Optimization Agent
        optimization_data = await resume_optimization_agent(parsed_resume, gap_analysis, api_key)
        
        # Agent 7: ATS Validation Agent
        ats_results = await ats_validation_agent(optimization_data, jd_data, api_key)
        
        # Package and return results
        return {
            "success": True,
            "ats_score_details": ats_results,
            "optimized_bullets": optimization_data.get("optimizedBullets", {}),
            "tailored_summary": optimization_data.get("summary", ""),
            "gap_analysis": gap_analysis
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/download/docx")
async def download_tailored_docx(
    resume: UploadFile = File(...),
    optimized_bullets: str = Form(...),
    tailored_summary: str = Form("")
):
    try:
        file_bytes = await resume.read()
        bullets_dict = json.loads(optimized_bullets)
        
        # Agent 8 & 9: Template Preservation and Resume Generation
        patched_bytes = template_preservation_agent(
            file_bytes, bullets_dict, tailored_summary, resume.filename
        )
        generation_metadata = resume_generation_agent(patched_bytes, resume.filename)
        
        return StreamingResponse(
            io.BytesIO(patched_bytes),
            media_type=generation_metadata["content_type"],
            headers={"Content-Disposition": f"attachment; filename=optimized_{resume.filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
