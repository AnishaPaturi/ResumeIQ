import io
import re
import httpx
from bs4 import BeautifulSoup
from docx import Document
from pypdf import PdfReader

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts plain text from PDF bytes."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return ""

def extract_text_from_docx(docx_bytes: bytes) -> str:
    """Extracts plain text from DOCX bytes."""
    try:
        doc = Document(io.BytesIO(docx_bytes))
        text = []
        for paragraph in doc.paragraphs:
            text.append(paragraph.text)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text.append(cell.text)
        return "\n".join(text)
    except Exception as e:
        print(f"Error extracting DOCX text: {e}")
        return ""

async def crawl_portfolio(url: str) -> str:
    """Scrapes raw text from a portfolio website."""
    if not url:
        return ""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
            response = await client.get(url, headers=headers, follow_redirects=True)
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                # Remove script and style elements
                for element in soup(["script", "style"]):
                    element.decompose()
                text = soup.get_text(separator=" ")
                # Clean up whitespace
                text = re.sub(r'\s+', ' ', text).strip()
                return text[:5000] # Limit to first 5000 characters
            return f"Failed to crawl portfolio. Status code: {response.status_code}"
    except Exception as e:
        return f"Error crawling portfolio: {str(e)}"

async def analyze_github(github_url: str) -> dict:
    """Queries the GitHub API to analyze repositories, languages, and activity."""
    if not github_url:
        return {}
    
    # Extract username
    match = re.search(r'github\.com/([^/]+)', github_url)
    if not match:
        return {}
    username = match.group(1)
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Fetch user repos
            url = f"https://api.github.com/users/{username}/repos?sort=updated&per_page=10"
            response = await client.get(url)
            if response.status_code != 200:
                return {}
            
            repos = response.json()
            repo_list = []
            languages = {}
            
            for repo in repos:
                if not repo.get("fork"):
                    repo_list.append({
                        "name": repo.get("name"),
                        "description": repo.get("description"),
                        "language": repo.get("language"),
                        "stars": repo.get("stargazers_count")
                    })
                    
                    lang = repo.get("language")
                    if lang:
                        languages[lang] = languages.get(lang, 0) + 1
            
            # Sort languages
            sorted_languages = sorted(languages.items(), key=lambda x: x[1], reverse=True)
            return {
                "username": username,
                "repositories": repo_list[:5],
                "primary_languages": [l[0] for l in sorted_languages[:5]]
            }
    except Exception as e:
        print(f"Error fetching GitHub profile: {e}")
        return {}

def patch_docx_file(docx_bytes: bytes, optimized_bullets: dict, tailored_summary: str) -> bytes:
    """Replaces summary and experience bullets in DOCX while preserving original formatting."""
    try:
        doc = Document(io.BytesIO(docx_bytes))
        
        # 1. Substitute Summary
        if tailored_summary:
            in_summary_section = False
            for paragraph in doc.paragraphs:
                text_upper = paragraph.text.upper().strip()
                if any(hdr in text_upper for hdr in ["SUMMARY", "PROFESSIONAL SUMMARY", "PROFILE", "OBJECTIVE"]) and len(text_upper) < 30:
                    in_summary_section = True
                    continue
                
                if in_summary_section and len(paragraph.text.strip()) > 10:
                    # This is the summary paragraph following the header
                    # Easiest way to replace text while keeping run formatting: write to first run, clear others
                    if paragraph.runs:
                        paragraph.runs[0].text = tailored_summary
                        for run in paragraph.runs[1:]:
                            run.text = ""
                    else:
                        paragraph.text = tailored_summary
                    in_summary_section = False // Reset
                    break
        
        # 2. Substitute Bullets
        if optimized_bullets:
            # Map clean lowercase keys for matching
            clean_bullets = {k.lower().strip(): v for k, v in optimized_bullets.items() if k and v}
            
            for paragraph in doc.paragraphs:
                p_text_clean = paragraph.text.lower().strip()
                
                # Check for direct or partial match
                matched_opt = None
                for orig_clean, opt in clean_bullets.items():
                    if orig_clean in p_text_clean or p_text_clean in orig_clean:
                        matched_opt = opt
                        break
                        
                if matched_opt:
                    if paragraph.runs:
                        paragraph.runs[0].text = matched_opt
                        for run in paragraph.runs[1:]:
                            run.text = ""
                    else:
                        paragraph.text = matched_opt
                        
        # Save to buffer
        out_buf = io.BytesIO()
        doc.save(out_buf)
        return out_buf.getvalue()
    except Exception as e:
        print(f"Error patching DOCX: {e}")
        return docx_bytes
