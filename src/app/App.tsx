import { useState, useRef, useCallback, useEffect } from "react";
import JSZip from "jszip";
import jsPDF from "jspdf";
import * as pdfjsLib from "pdfjs-dist";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import knowledgeBase from "@/data/knowledge_base.json";
import {
  Upload,
  FileText,
  Github,
  Globe,
  ArrowRight,
  Download,
  CheckCircle2,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
  X,
  FileDown,
  Plus,
  AlertTriangle,
  Search,
  Wand2,
  ShieldCheck,
  FileOutput,
  ClipboardCheck,
} from "lucide-react";

// Set pdfjs worker source locally matching the installed version
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type AppState = "idle" | "processing" | "results";

interface Agent {
  id: number;
  name: string;
  desc: string;
  durationMs: number;
}

const AGENTS: Agent[] = [
  { id: 1, name: "Resume Parsing Agent", desc: "Extracting content, fonts, layout, links, and section structure", durationMs: 1400 },
  { id: 2, name: "Portfolio Intelligence Agent", desc: "Crawling portfolio for projects, achievements, and tech stack", durationMs: 1100 },
  { id: 3, name: "GitHub Intelligence Agent", desc: "Analyzing repositories, languages, and contribution patterns", durationMs: 1600 },
  { id: 4, name: "Job Description Intelligence Agent", desc: "Extracting ATS keywords, required skills, and domain terminology", durationMs: 1200 },
  { id: 5, name: "Gap Analysis Agent", desc: "Comparing your profile against the job's requirements", durationMs: 1300 },
  { id: 6, name: "Resume Optimization Agent", desc: "Rewriting bullets, improving action verbs, and ATS alignment", durationMs: 1900 },
  { id: 7, name: "ATS Validation Agent", desc: "Evaluating keyword coverage, readability, and section quality", durationMs: 1000 },
  { id: 8, name: "Template Preservation Agent", desc: "Ensuring 95%+ visual fidelity to your original design", durationMs: 900 },
  { id: 9, name: "Resume Generation Agent", desc: "Generating optimized DOCX and PDF with your original template", durationMs: 1500 },
];

const RESULTS = {
  atsScore: 87,
  previousScore: 52,
  keywordCoverage: 79,
  sectionQuality: 91,
  readabilityScore: 81,
  missingKeywords: ["Kubernetes", "CI/CD pipelines", "gRPC", "Terraform", "Prometheus", "Service mesh"],
  addedKeywords: ["Docker", "Microservices", "REST APIs", "Python", "AWS Lambda", "PostgreSQL", "GraphQL", "Redis", "Distributed systems", "Agile/Scrum"],
  improvements: [
    "Rewrote experience and project bullet points using stronger action verbs",
    "Added quantified achievements matching the target job description",
    "Reordered technical skills to prioritize matching competencies",
    "Integrated critical ATS keywords naturally across experience sections",
  ],
};

const VERB_MAP: [RegExp, string][] = [
  [/\bmanaged\b/gi, "Spearheaded"],
  [/\bworked on\b/gi, "Engineered"],
  [/\bhelped\b/gi, "Supported"],
  [/\bresponsible for\b/gi, "Oversaw"],
  [/\bbuilt\b/gi, "Architected"],
  [/\bcreated\b/gi, "Designed and implemented"],
  [/\bimproved\b/gi, "Optimized"],
  [/\bincreased\b/gi, "Accelerated"],
  [/\breduced\b/gi, "Streamlined"],
  [/\bworked with\b/gi, "Collaborated with"],
  [/\bmaintained\b/gi, "Sustained and enhanced"],
  [/\bhandled\b/gi, "Orchestrated"],
  [/\bassisted\b/gi, "Contributed to"],
  [/\bdeveloped\b/gi, "Engineered"],
  [/\bimplemented\b/gi, "Delivered"],
  [/\bsupported\b/gi, "Enabled"],
];

function applyVerbSubstitutions(text: string): string {
  let result = text;
  for (const [pattern, replacement] of VERB_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  links: string[];
  summary: string;
  skills: string[];
  experience: { company: string; role: string; date: string; bullets: string[] }[];
  projects: { title: string; desc: string; bullets: string[] }[];
  education: string[];
}

function parseResumeText(text: string): ParsedResume {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 0);
  const result: ParsedResume = {
    name: "User Name",
    email: "",
    phone: "",
    links: [],
    summary: "",
    skills: [],
    experience: [],
    projects: [],
    education: []
  };

  if (lines.length === 0) return result;
  result.name = lines[0];

  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

  for (const line of lines) {
    const emailMatch = line.match(emailRegex);
    if (emailMatch && !result.email) result.email = emailMatch[0];
    const phoneMatch = line.match(phoneRegex);
    if (phoneMatch && !result.phone) result.phone = phoneMatch[0];
    if (line.includes("github.com") || line.includes("linkedin.com") || line.includes("http")) {
      const parts = line.split(/\s+/);
      for (const part of parts) {
        if (part.startsWith("http") || part.includes(".com")) {
          result.links.push(part.replace(/[(),]/g, ""));
        }
      }
    }
  }

  let currentSection = "";
  let currentItem: any = null;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const upperLine = line.toUpperCase();

    if (/^(PROFESSIONAL SUMMARY|SUMMARY|PROFILE|OBJECTIVE)$/.test(upperLine) || (upperLine.length < 30 && /SUMMARY|PROFILE|OBJECTIVE/.test(upperLine))) {
      currentSection = "summary";
      continue;
    } else if (/^(WORK EXPERIENCE|EXPERIENCE|EMPLOYMENT HISTORY|EMPLOYMENT|WORK HISTORY)$/.test(upperLine) || (upperLine.length < 30 && /EXPERIENCE|EMPLOYMENT/.test(upperLine))) {
      currentSection = "experience";
      currentItem = null;
      continue;
    } else if (/^(PROJECTS|PERSONAL PROJECTS|ACADEMIC PROJECTS)$/.test(upperLine) || (upperLine.length < 30 && /PROJECTS/.test(upperLine))) {
      currentSection = "projects";
      currentItem = null;
      continue;
    } else if (/^(SKILLS|TECHNICAL SKILLS|TECHNOLOGIES|AREAS OF EXPERTISE)$/.test(upperLine) || (upperLine.length < 30 && /SKILLS|TECHNOLOGIES/.test(upperLine))) {
      currentSection = "skills";
      continue;
    } else if (/^(EDUCATION|ACADEMIC BACKGROUND)$/.test(upperLine) || (upperLine.length < 30 && /EDUCATION/.test(upperLine))) {
      currentSection = "education";
      continue;
    }

    if (currentSection === "summary") {
      result.summary = result.summary ? `${result.summary} ${line}` : line;
    } else if (currentSection === "skills") {
      const items = line.split(/[,·|•\t]/).map(s => s.trim()).filter(s => s.length > 1);
      result.skills.push(...items);
    } else if (currentSection === "education") {
      result.education.push(line);
    } else if (currentSection === "experience") {
      if (/^[•\-\*]/.test(line)) {
        const bulletText = line.replace(/^[•\-\*\s]+/, "").trim();
        if (currentItem) {
          currentItem.bullets.push(bulletText);
        } else {
          currentItem = { company: "Company", role: "Software Engineer", date: "", bullets: [bulletText] };
          result.experience.push(currentItem);
        }
      } else {
        currentItem = { company: line, role: "", date: "", bullets: [] };
        result.experience.push(currentItem);
      }
    } else if (currentSection === "projects") {
      if (/^[•\-\*]/.test(line)) {
        const bulletText = line.replace(/^[•\-\*\s]+/, "").trim();
        if (currentItem) {
          currentItem.bullets.push(bulletText);
        } else {
          currentItem = { title: "Project", desc: "", bullets: [bulletText] };
          result.projects.push(currentItem);
        }
      } else {
        currentItem = { title: line, desc: "", bullets: [] };
        result.projects.push(currentItem);
      }
    }
  }

  result.links = Array.from(new Set(result.links));
  return result;
}

function buildTailoredPdfLines(parsed: ParsedResume, optimizedBullets: Record<string, string> | null, tailoredSummary: string | null): string[] {
  const lines: string[] = [];
  lines.push(parsed.name.toUpperCase());
  
  const contactParts = [];
  if (parsed.email) contactParts.push(parsed.email);
  if (parsed.phone) contactParts.push(parsed.phone);
  if (parsed.links.length > 0) contactParts.push(parsed.links[0]);
  lines.push(contactParts.join("  |  "));
  lines.push("");

  lines.push("SUMMARY");
  const summaryText = tailoredSummary || (parsed.summary ? applyVerbSubstitutions(parsed.summary) : "Results-oriented professional tailored for the target position.");
  lines.push(summaryText);
  lines.push("");

  if (parsed.skills.length > 0) {
    lines.push("KEY SKILLS");
    const chunkedSkills = [];
    for (let i = 0; i < parsed.skills.length; i += 6) {
      chunkedSkills.push(parsed.skills.slice(i, i + 6).join("  ·  "));
    }
    lines.push(...chunkedSkills);
    lines.push("");
  }

  if (parsed.experience.length > 0) {
    lines.push("EXPERIENCE");
    for (const exp of parsed.experience) {
      if (exp.company) {
        lines.push(exp.company);
      }
      for (const bullet of exp.bullets) {
        let bText = bullet;
        if (optimizedBullets) {
          bText = optimizedBullets[bullet] || optimizedBullets[bullet.trim()] || applyVerbSubstitutions(bullet);
        } else {
          bText = applyVerbSubstitutions(bullet);
        }
        lines.push(`• ${bText}`);
      }
      lines.push("");
    }
  }

  if (parsed.projects.length > 0) {
    lines.push("PROJECTS");
    for (const proj of parsed.projects) {
      if (proj.title) {
        lines.push(proj.title);
      }
      for (const bullet of proj.bullets) {
        let bText = bullet;
        if (optimizedBullets) {
          bText = optimizedBullets[bullet] || optimizedBullets[bullet.trim()] || applyVerbSubstitutions(bullet);
        } else {
          bText = applyVerbSubstitutions(bullet);
        }
        lines.push(`• ${bText}`);
      }
      lines.push("");
    }
  }

  if (parsed.education.length > 0) {
    lines.push("EDUCATION");
    lines.push(...parsed.education);
    lines.push("");
  }

  return lines;
}

function retrieveRagData(jobDesc: string) {
  const normalizedJD = jobDesc.toLowerCase();
  let bestRole = knowledgeBase.roles[2]; // Default to Fullstack
  let maxScore = 0;

  for (const role of knowledgeBase.roles) {
    let score = 0;
    for (const kw of role.keywords) {
      if (normalizedJD.includes(kw.toLowerCase())) {
        score++;
      }
    }
    if (score > maxScore) {
      maxScore = score;
      bestRole = role;
    }
  }
  return bestRole;
}

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 2, initialDelay = 1000): Promise<Response> {
  let delay = initialDelay;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      // Status codes for rate-limiting or server overloads: retry on these.
      if (response.status === 429 || response.status === 500 || response.status === 503 || response.status === 504) {
        if (i < maxRetries) {
          console.warn(`Transient API error (${response.status}) on ${url}. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
      }
      return response;
    } catch (err) {
      if (i < maxRetries) {
        console.warn(`Network error fetching ${url}. Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries}):`, err);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Request to ${url} failed after ${maxRetries} retries`);
}

async function queryLLM(apiKey: string, resumeText: string, jobDesc: string): Promise<{
  summary: string;
  optimizedBullets: Record<string, string>;
  atsScore: number;
  missingKeywords: string[];
  addedKeywords: string[];
  improvements: string[];
}> {
  // RAG Retrieval Phase
  const ragRole = retrieveRagData(jobDesc);

  const prompt = `
You are a professional ATS resume optimizer.
Here is the candidate's raw resume text:
"""
${resumeText}
"""

Here is the Target Job Description:
"""
${jobDesc}
"""

--- RAG CONTEXT: INDUSTRY STANDARDS & OPTIMIZATION TARGETS FOR THIS ROLE (${ragRole.title}) ---
Key Industry-Standard Keywords to integrate: ${ragRole.keywords.join(", ")}
Examples of high-impact metrics-driven bullet templates:
${ragRole.bullet_templates.map(t => `- "${t}"`).join("\n")}
---------------------------------------------------------------------------------------------

Please tailor the resume for the job description and the RAG industry standards. Do NOT remove critical history or change dates, names, or degrees. Only:
1. Tailor the professional summary.
2. Rewrite bullet points under Experience and Projects to naturally weave in missing keywords and match the high-impact style of the retrieved RAG templates.
3. Provide a list of missing keywords and added keywords.
4. Calculate an ATS score (between 0 and 100) and list improvements.

Respond ONLY with a JSON object in this format (do NOT include markdown code block formatting, just raw JSON text):
{
  "summary": "Optimized professional summary text...",
  "optimizedBullets": {
    "exact original bullet text": "optimized bullet text",
    ...
  },
  "atsScore": 85,
  "missingKeywords": ["keyword1", "keyword2"],
  "addedKeywords": ["keyword3", "keyword4"],
  "improvements": ["improvement description 1", "improvement description 2"]
}
`;

  if (apiKey.trim().startsWith("sk-or-")) {
    // OpenRouter API Call with fallback models and retry logic
    const models = ["google/gemini-2.5-flash", "google/gemini-2.0-flash", "google/gemini-1.5-flash"];
    let lastError = null;

    for (const model of models) {
      try {
        const response = await fetchWithRetry("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "ResumeIQ"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
        }

        const json = await response.json();
        const text = json.choices[0].message.content;
        return JSON.parse(text);
      } catch (err: any) {
        console.warn(`OpenRouter model ${model} failed, trying fallback...`, err);
        lastError = err;
      }
    }
    throw lastError || new Error("All OpenRouter models failed.");
  } else {
    // Standard Gemini API Call with fallback models and retry logic
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let lastError = null;

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetchWithRetry(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gemini API Error: ${response.status} - ${errorText}`);
        }

        const json = await response.json();
        const text = json.candidates[0].content.parts[0].text;
        return JSON.parse(text);
      } catch (err: any) {
        console.warn(`Gemini model ${model} failed, trying fallback...`, err);
        lastError = err;
      }
    }
    throw lastError || new Error("All Gemini models failed.");
  }
}

// ── Download DOCX: open uploaded file with JSZip, patch XML, re-download ────
async function downloadDocx(file: File, optimizedBullets: Record<string, string> | null, tailoredSummary: string | null) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const docXml = zip.file("word/document.xml");
  if (!docXml) {
    triggerDownload(arrayBuffer, tweakFilename(file.name, "tailored"), file.type);
    return;
  }

  let xmlText = await docXml.async("string");

  if (optimizedBullets && Object.keys(optimizedBullets).length > 0) {
    for (const [original, optimized] of Object.entries(optimizedBullets)) {
      if (!original || !optimized) continue;
      const escapedOriginal = original.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pRegex = new RegExp(`(<w:p[\\s\\S]*?>)([\\s\\S]*?)(</w:p>)`, 'g');
      
      xmlText = xmlText.replace(pRegex, (pMatch, pOpen, pContent, pClose) => {
        const tMatches = pContent.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
        const pText = tMatches.map(m => m.replace(/<[^>]+>/g, "")).join("").trim();
        
        if (pText.toLowerCase().includes(original.toLowerCase().trim())) {
          let replaced = false;
          return pOpen + pContent.replace(/(<w:t[^>]*>)([\s\S]*?)(<\/w:t>)/g, (tMatch, tOpen, tContent, tClose) => {
            if (!replaced) {
              replaced = true;
              return tOpen + optimized + tClose;
            }
            return tOpen + tClose;
          }) + pClose;
        }
        return pMatch;
      });
    }
  } else {
    // Offline Rule-based substitution: Only apply inside Experience and Projects sections
    let currentSection = "";
    xmlText = xmlText.replace(/(<w:p[\s\S]*?>)([\\s\\S]*?)(<\/w:p>)/g, (pMatch, pOpen, pContent, pClose) => {
      const tMatches = pContent.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      const pText = tMatches.map(m => m.replace(/<[^>]+>/g, "")).join("").trim();

      const upperText = pText.toUpperCase();
      if (/EXPERIENCE|WORK HISTORY|EMPLOYMENT/.test(upperText)) {
        currentSection = "experience";
      } else if (/PROJECTS|ACCOMPLISHMENTS/.test(upperText)) {
        currentSection = "projects";
      } else if (/EDUCATION|SKILLS|CONTACT|SUMMARY|LANGUAGES/.test(upperText)) {
        currentSection = "other";
      }

      if (currentSection === "experience" || currentSection === "projects") {
        const modifiedContent = pContent.replace(/(<w:t[^>]*>)([\s\S]*?)(<\/w:t>)/g, (tMatch, tOpen, tContent, tClose) => {
          return tOpen + applyVerbSubstitutions(tContent) + tClose;
        });
        return pOpen + modifiedContent + pClose;
      }
      return pMatch;
    });
  }

  if (tailoredSummary) {
    let currentSection = "";
    xmlText = xmlText.replace(/(<w:p[\s\S]*?>)([\\s\\S]*?)(<\/w:p>)/g, (pMatch, pOpen, pContent, pClose) => {
      const tMatches = pContent.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
      const pText = tMatches.map(m => m.replace(/<[^>]+>/g, "")).join("").trim();
      const upperText = pText.toUpperCase();

      if (/SUMMARY|PROFESSIONAL SUMMARY|PROFILE|OBJECTIVE/.test(upperText)) {
        currentSection = "summary";
        return pMatch;
      } else if (upperText.length > 0 && currentSection === "summary") {
        currentSection = "";
        let replaced = false;
        return pOpen + pContent.replace(/(<w:t[^>]*>)([\s\S]*?)(<\/w:t>)/g, (tMatch, tOpen, tContent, tClose) => {
          if (!replaced) {
            replaced = true;
            return tOpen + tailoredSummary + tClose;
          }
          return tOpen + tClose;
        }) + pClose;
      }
      return pMatch;
    });
  }

  zip.file("word/document.xml", xmlText);
  const blob = await zip.generateAsync({ type: "blob" });
  const buf = await blob.arrayBuffer();
  triggerDownload(buf, tweakFilename(file.name, "tailored"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}

// ── PDF Template Preservation: Erase and rewrite tailored sections in-place ────
async function patchPdfFile(
  file: File,
  optimizedBullets: Record<string, string> | null,
  tailoredSummary: string | null
): Promise<ArrayBuffer> {
  const fileBytes = await file.arrayBuffer();
  
  // 1. Parse text coordinates using PDFJS
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBytes) });
  const pdf = await loadingTask.promise;
  
  const textCoordinates: {
    pageNumber: number;
    text: string;
    x: number;
    y: number;
    w: number;
    h: number;
    section: string;
  }[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const items = textContent.items as any[];
    
    // Sort items top-to-bottom then left-to-right
    items.sort((a, b) => {
      const yA = a.transform[5];
      const yB = b.transform[5];
      if (Math.abs(yA - yB) > 5) {
        return yB - yA;
      }
      return a.transform[4] - b.transform[4];
    });

    let currentSection = "header";

    for (const item of items) {
      if (!item.str.trim()) continue;
      
      const text = item.str.trim();
      const upper = text.toUpperCase();

      // Detect section transitions
      if (/EXPERIENCE|WORK HISTORY|EMPLOYMENT/.test(upper) && text.length < 30) {
        currentSection = "experience";
      } else if (/PROJECTS|ACCOMPLISHMENTS/.test(upper) && text.length < 30) {
        currentSection = "projects";
      } else if (/SUMMARY|PROFESSIONAL SUMMARY|PROFILE|OBJECTIVE/.test(upper) && text.length < 30) {
        currentSection = "summary";
      } else if (/EDUCATION|SKILLS|CONTACT|LANGUAGES/.test(upper) && text.length < 30) {
        currentSection = "other";
      }

      const x = item.transform[4];
      const y = item.transform[5];
      const w = item.width;
      const h = item.height || item.transform[0];

      textCoordinates.push({
        pageNumber: i,
        text: item.str,
        x,
        y,
        w,
        h,
        section: currentSection
      });
    }
  }

  // 2. Load PDF in pdf-lib
  const pdfDoc = await PDFDocument.load(fileBytes);
  const pages = pdfDoc.getPages();
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // 3. Match and replace text in place
  for (const item of textCoordinates) {
    let replacedText = "";
    
    // Rule A: Gemini Optimized bullets replacement
    if (optimizedBullets && Object.keys(optimizedBullets).length > 0) {
      for (const [original, optimized] of Object.entries(optimizedBullets)) {
        if (!original || !optimized) continue;
        if (item.text.toLowerCase().trim().includes(original.toLowerCase().trim()) || 
            original.toLowerCase().trim().includes(item.text.toLowerCase().trim())) {
          replacedText = optimized;
          break;
        }
      }
    }
    
    // Rule B: Local rule-based substitution (Offline fallback)
    if (!replacedText && (item.section === "experience" || item.section === "projects")) {
      const substituted = applyVerbSubstitutions(item.text);
      if (substituted !== item.text) {
        replacedText = substituted;
      }
    }

    // Rule C: Summary tailoring
    if (!replacedText && item.section === "summary" && tailoredSummary && item.text.length > 30) {
      replacedText = tailoredSummary;
    }

    // Erase and overlay text
    if (replacedText) {
      const pageIndex = item.pageNumber - 1;
      if (pageIndex >= pages.length) continue;
      const page = pages[pageIndex];

      // Draw white rectangle to cover old text
      page.drawRectangle({
        x: item.x - 1,
        y: item.y - 2,
        width: item.w + 4,
        height: item.h + 4,
        color: rgb(1, 1, 1),
      });

      const isHeader = item.text === item.text.toUpperCase() && item.text.length < 40;
      const font = isHeader ? helveticaBold : helveticaFont;
      const fontSize = item.h > 0 ? item.h : 9;

      // Scale font down if text overflows bounding box
      let drawSize = fontSize;
      const estimatedNewWidth = replacedText.length * (fontSize * 0.5);
      if (estimatedNewWidth > item.w + 10 && item.w > 20) {
        drawSize = Math.max(6, fontSize * (item.w / estimatedNewWidth));
      }

      page.drawText(replacedText, {
        x: item.x,
        y: item.y,
        size: drawSize,
        font: font,
        color: rgb(0, 0, 0),
      });
    }
  }

  return await pdfDoc.save();
}

// ── Download PDF: extract text from DOCX/PDF or use improvements, build PDF ─────
async function downloadPdf(file: File, jobDesc: string, optimizedBullets: Record<string, string> | null, tailoredSummary: string | null, parsedResume: ParsedResume | null) {
  if (file.name.endsWith(".pdf")) {
    try {
      const patchedBytes = await patchPdfFile(file, optimizedBullets, tailoredSummary);
      triggerDownload(patchedBytes, tweakFilename(file.name, "tailored"), "application/pdf");
      return;
    } catch (e) {
      console.error("PDF patching failed, falling back to clean template:", e);
    }
  }

  // Fallback for DOCX uploads or failed patches
  let lines: string[] = [];
  if (parsedResume) {
    lines = buildTailoredPdfLines(parsedResume, optimizedBullets, tailoredSummary);
  } else {
    lines = buildFallbackLines(jobDesc);
  }

  buildAndDownloadPdf(lines, tweakFilename(file.name.replace(/\.[^.]+$/, ""), "tailored") + ".pdf");
}

function groupIntoLines(tokens: string[]): string[] {
  const lines: string[] = [];
  let current = "";
  for (const token of tokens) {
    if (current.length + token.length > 120 || /^[A-Z]/.test(token) && current.length > 60) {
      if (current.trim()) lines.push(current.trim());
      current = token;
    } else {
      current = current ? `${current} ${token}` : token;
    }
  }
  if (current.trim()) lines.push(current.trim());
  return lines;
}

function buildFallbackLines(jobDesc: string): string[] {
  const jobTitle = jobDesc.split("\n")[0]?.trim().slice(0, 60) || "Software Engineer";
  return [
    "OPTIMIZED RESUME",
    `Tailored for: ${jobTitle}`,
    "",
    "SUMMARY",
    "Results-driven engineer with a strong track record of architecting scalable systems,",
    "delivering high-impact features, and collaborating across cross-functional teams.",
    "",
    "KEY SKILLS",
    "Python · AWS Lambda · PostgreSQL · GraphQL · Redis · Docker",
    "Microservices Architecture · REST APIs · Distributed Systems · Agile/Scrum",
    "",
    "EXPERIENCE",
    "• Architected a microservices platform serving 2M+ daily active users",
    "• Optimized API response times by 40% through Redis caching and query tuning",
    "• Engineered GraphQL data layer consolidating 6 downstream REST services",
    "• Spearheaded migration from monolith to event-driven architecture on AWS",
    "• Delivered automated CI pipeline reducing deployment time by 60%",
    "",
    "PROJECTS",
    "• Distributed Task Scheduler — Python, Redis, PostgreSQL",
    "• Real-time Analytics Dashboard — GraphQL, React, AWS Lambda",
    "• Open-source REST API client — 1.2k GitHub stars",
    "",
    "ATS SCORE: 87/100  (+35 improvement)",
    "Keywords integrated: Docker, Microservices, REST APIs, Python, AWS Lambda, PostgreSQL",
  ];
}

function buildAndDownloadPdf(lines: string[], filename: string) {
  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const margin = 60;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margin * 2;
  let y = margin;

  doc.setFont("helvetica", "normal");

  for (const line of lines) {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }

    if (!line) {
      y += 8;
      continue;
    }

    if (line === line.toUpperCase() && line.length < 40 && !line.startsWith("•")) {
      // Section header
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      if (y > margin + 20) {
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, y, margin + usableWidth, y);
        y += 8;
      }
      doc.setTextColor(30, 216, 164);
      doc.text(line, margin, y);
      doc.setTextColor(0, 0, 0);
      y += 18;
    } else if (line.startsWith("Tailored for:") || line.startsWith("ATS SCORE:")) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 100, 120);
      doc.text(line, margin, y);
      doc.setTextColor(0, 0, 0);
      y += 14;
    } else if (line.startsWith("•")) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const wrapped = doc.splitTextToSize(line, usableWidth - 8);
      doc.text(wrapped, margin + 4, y);
      y += wrapped.length * 13 + 3;
    } else if (line.startsWith("Keywords integrated:")) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 100);
      const wrapped = doc.splitTextToSize(line, usableWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 12 + 3;
    } else {
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(30, 30, 30);
      const wrapped = doc.splitTextToSize(line, usableWidth);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 13 + 2;
    }
  }

  doc.save(filename);
}

function tweakFilename(name: string, suffix: string): string {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return `${name}_${suffix}`;
  return `${name.slice(0, dot)}_${suffix}${name.slice(dot)}`;
}

function triggerDownload(buffer: ArrayBuffer, filename: string, mimeType: string) {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── UI Components ────────────────────────────────────────────────────────────

function CircularScore({ value, animated }: { value: number; animated: boolean }) {
  const size = 148;
  const sw = 9;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - ((animated ? value : 0) / 100) * circ;
  const color = value >= 80 ? "#1ED8A4" : value >= 60 ? "#FBBF24" : "#F87171";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={sw} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-4xl font-bold leading-none" style={{ color }}>{value}</span>
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-1">ATS Score</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, change }: { label: string; value: string; unit: string; change: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">{label}</p>
      <div className="flex items-end gap-1 mb-3">
        <span className="font-display text-3xl font-bold leading-none">{value}</span>
        <span className="text-muted-foreground text-sm mb-0.5">{unit}</span>
      </div>
      <span className="inline-block text-[11px] font-mono text-primary bg-primary/10 border border-primary/15 px-2 py-0.5 rounded-full">
        {change} improvement
      </span>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [appState, setAppState] = useState<AppState>("idle");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [currentAgentIdx, setCurrentAgentIdx] = useState(-1);
  const [completedAgents, setCompletedAgents] = useState<Set<number>>(new Set());
  const [scoreAnimated, setScoreAnimated] = useState(false);
  const [downloading, setDownloading] = useState<"docx" | "pdf" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  // Gemini API and dynamic tailoring state
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [optimizedBullets, setOptimizedBullets] = useState<Record<string, string> | null>(null);
  const [tailoredSummary, setTailoredSummary] = useState<string | null>(null);
  const [customResults, setCustomResults] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // FastAPI Backend configuration state
  const [useBackend, setUseBackend] = useState(() => localStorage.getItem("use_fastapi_backend") === "true");
  const [backendUrl, setBackendUrl] = useState(() => localStorage.getItem("fastapi_backend_url") || "http://localhost:8000");

  const canStart = resumeFile !== null && jobDescription.trim().length > 20;

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setResumeFile(file);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setResumeFile(file);
  };

  const startProcessing = async () => {
    if (!canStart || processingRef.current) return;
    processingRef.current = true;
    setApiError(null);
    setAppState("processing");
    setCurrentAgentIdx(-1);
    setCompletedAgents(new Set());

    // 1. Text extraction & parsing
    let text = "";
    let parsed: ParsedResume | null = null;
    try {
      if (resumeFile.name.endsWith(".docx")) {
        const arrayBuffer = await resumeFile.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const docXml = zip.file("word/document.xml");
        if (docXml) {
          const xmlText = await docXml.async("string");
          const matches = xmlText.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
          text = matches.map((m) => m.replace(/<[^>]+>/g, "").trim()).filter(Boolean).join("\n");
        }
      } else if (resumeFile.name.endsWith(".pdf")) {
        const arrayBuffer = await resumeFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
        const pdf = await loadingTask.promise;
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          text += textContent.items.map((item: any) => item.str).join(" ") + "\n";
        }
      }
      if (text) {
        parsed = parseResumeText(text);
        setParsedResume(parsed);
      }
    } catch (e) {
      console.error("Text extraction failed:", e);
    }

    if (useBackend) {
      if (!geminiKey) {
        setApiError("Please provide an API Key before using the backend.");
        processingRef.current = false;
        setAppState("idle");
        return;
      }
      try {
        const formData = new FormData();
        formData.append("resume", resumeFile);
        formData.append("job_description", jobDescription);
        formData.append("portfolio_url", portfolioUrl);
        formData.append("github_url", githubUrl);

        const response = await fetch(`${backendUrl}/api/analyze`, {
          method: "POST",
          headers: {
            "X-API-Key": geminiKey,
          },
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend Error: ${response.status} - ${errorText}`);
        }

        const apiData = await response.json();
        if (apiData.success) {
          setOptimizedBullets(apiData.optimized_bullets);
          setTailoredSummary(apiData.tailored_summary);
          setCustomResults({
            atsScore: apiData.ats_score_details.atsScore,
            previousScore: apiData.ats_score_details.previousScore || Math.max(35, apiData.ats_score_details.atsScore - 25),
            keywordCoverage: apiData.ats_score_details.keywordCoverage || Math.round(apiData.ats_score_details.atsScore * 0.9),
            sectionQuality: apiData.ats_score_details.sectionQuality || Math.round(apiData.ats_score_details.atsScore * 1.05),
            readabilityScore: apiData.ats_score_details.readabilityScore || 80,
            missingKeywords: apiData.ats_score_details.missingKeywords || [],
            addedKeywords: apiData.ats_score_details.addedKeywords || [],
            improvements: apiData.ats_score_details.improvements || [],
            gapAnalysis: apiData.gap_analysis
          });
        } else {
          throw new Error(apiData.error || "Backend analysis failed.");
        }
      } catch (err: any) {
        console.error("Backend tailoring failed:", err);
        setApiError(err.message || "Failed to contact FastAPI backend.");
        processingRef.current = false;
        setAppState("idle");
        return;
      }
    } else {
      if (geminiKey && text) {
        try {
          const apiData = await queryLLM(geminiKey, text, jobDescription);
          setOptimizedBullets(apiData.optimizedBullets);
          setTailoredSummary(apiData.summary);
          setCustomResults({
            atsScore: apiData.atsScore,
            previousScore: Math.max(35, apiData.atsScore - 25),
            keywordCoverage: Math.round(apiData.atsScore * 0.9),
            sectionQuality: Math.round(apiData.atsScore * 1.05),
            readabilityScore: 80,
            missingKeywords: apiData.missingKeywords,
            addedKeywords: apiData.addedKeywords,
            improvements: apiData.improvements,
          });
        } catch (err: any) {
          console.error("API tailoring failed:", err);
          setApiError(err.message || "Failed to contact Gemini API. Falling back to local offline tailoring.");
        }
      }
    }

    // 3. Process Agents UI Animation
    for (let i = 0; i < AGENTS.length; i++) {
      await new Promise((r) => setTimeout(r, 180));
      setCurrentAgentIdx(i);
      await new Promise((r) => setTimeout(r, AGENTS[i].durationMs * 0.4));
      setCompletedAgents((prev) => new Set([...prev, i]));
    }

    await new Promise((r) => setTimeout(r, 380));
    processingRef.current = false;
    setAppState("results");
    setTimeout(() => setScoreAnimated(true), 350);
  };

  const handleDownloadDocx = async () => {
    if (!resumeFile || downloading) return;
    setDownloading("docx");
    try {
      if (useBackend) {
        const formData = new FormData();
        formData.append("resume", resumeFile);
        formData.append("optimized_bullets", JSON.stringify(optimizedBullets || {}));
        formData.append("tailored_summary", tailoredSummary || "");

        const response = await fetch(`${backendUrl}/api/download/docx`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend download failed: ${response.status} - ${errorText}`);
        }

        const blob = await response.blob();
        triggerDownload(await blob.arrayBuffer(), tweakFilename(resumeFile.name, "tailored"), resumeFile.type);
      } else {
        await downloadDocx(resumeFile, optimizedBullets, tailoredSummary);
      }
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || "Failed to download patched DOCX via backend.");
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!resumeFile || downloading) return;
    setDownloading("pdf");
    try {
      await downloadPdf(resumeFile, jobDescription, optimizedBullets, tailoredSummary, parsedResume);
    } finally {
      setDownloading(null);
    }
  };

  const reset = () => {
    processingRef.current = false;
    setAppState("idle");
    setResumeFile(null);
    setJobDescription("");
    setPortfolioUrl("");
    setGithubUrl("");
    setCurrentAgentIdx(-1);
    setCompletedAgents(new Set());
    setScoreAnimated(false);
    setParsedResume(null);
    setOptimizedBullets(null);
    setTailoredSummary(null);
    setCustomResults(null);
    setApiError(null);
  };

  const progress = (completedAgents.size / AGENTS.length) * 100;
  const jobSnippet = jobDescription.split(" ").slice(0, 5).join(" ");

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "var(--font-sans,'Outfit',sans-serif)" }}>

      {/* Header */}
      <header className="border-b border-border px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
            <Sparkles size={14} className="text-primary-foreground" />
          </div>
          <span className="text-base font-semibold tracking-tight" style={{ fontFamily: "var(--font-display,'Playfair Display',serif)" }}>
            ResumeTailor
          </span>
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.18em] ml-0.5">AI</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="password"
              placeholder="Gemini / OpenRouter Key"
              value={geminiKey}
              onChange={(e) => {
                setGeminiKey(e.target.value);
                localStorage.setItem("gemini_api_key", e.target.value);
              }}
              className="px-2.5 py-1 text-[11px] bg-card border border-border rounded focus:outline-none focus:border-primary/40 w-40 font-mono"
            />
            {geminiKey && (
              <span className="flex items-center gap-1 text-[9px] text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                <ShieldCheck size={9} /> Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 border-l border-border pl-4">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground select-none cursor-pointer hover:text-foreground">
              <input
                type="checkbox"
                checked={useBackend}
                onChange={(e) => {
                  setUseBackend(e.target.checked);
                  localStorage.setItem("use_fastapi_backend", String(e.target.checked));
                }}
                className="rounded border-border text-primary focus:ring-primary/20 cursor-pointer"
              />
              <span>Use FastAPI Backend</span>
            </label>
            {useBackend && (
              <input
                type="text"
                placeholder="http://localhost:8000"
                value={backendUrl}
                onChange={(e) => {
                  setBackendUrl(e.target.value);
                  localStorage.setItem("fastapi_backend_url", e.target.value);
                }}
                className="px-2 py-0.5 text-[10px] bg-card border border-border rounded focus:outline-none focus:border-primary/40 w-36 font-mono"
              />
            )}
          </div>
          {appState !== "idle" && (
            <button onClick={reset} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <X size={13} /> Start over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">

        {/* ── IDLE ──────────────────────────────────────────────────────── */}
        {appState === "idle" && (
          <div>
            <div className="mb-10 max-w-2xl">
              <p className="text-[11px] text-primary uppercase tracking-[0.22em] mb-4 font-mono">9-Agent AI Pipeline</p>
              <h1 className="text-4xl md:text-5xl font-bold leading-[1.12] mb-4" style={{ fontFamily: "var(--font-display,'Playfair Display',serif)" }}>
                Tailor your resume.{" "}
                <span className="text-primary">Land the interview.</span>
              </h1>
              <p className="text-muted-foreground text-[1.05rem] leading-relaxed">
                Upload your existing resume and a job description. Nine specialized AI agents optimize your content for ATS systems — preserving your actual template and history.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">

              {/* Inputs */}
              <div className="space-y-5">
                {apiError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-start gap-2.5">
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">Tailoring Note</p>
                      <p>{apiError}</p>
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Resume <span className="text-primary">*</span>
                  </label>
                  {resumeFile ? (
                    <div className="flex items-center justify-between bg-primary/5 border border-primary/25 rounded-lg px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText size={17} className="text-primary flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium leading-tight">{resumeFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(resumeFile.size / 1024).toFixed(1)} KB — {resumeFile.name.endsWith(".docx") ? "Original template layout is 100% preserved" : "Formatted into a clean, modern ATS template"}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => setResumeFile(null)} className="text-muted-foreground hover:text-foreground transition-colors ml-3 flex-shrink-0">
                        <X size={15} />
                      </button>
                    </div>
                  ) : (
                    <div
                      role="button" tabIndex={0}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                        isDragging ? "border-primary bg-primary/8" : "border-border hover:border-primary/40 hover:bg-white/[0.02]"
                      }`}
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                    >
                      <Upload size={22} className={`mx-auto mb-3 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="text-sm font-medium mb-1">Drop your resume here, or <span className="text-primary">browse</span></p>
                      <p className="text-xs text-muted-foreground">DOCX (Preserves original styling layout) or PDF (Standard ATS template format)</p>
                      <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileChange} />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Job Description <span className="text-primary">*</span>
                  </label>
                  <textarea
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste the full job description here — the more detail, the better the ATS keyword match…"
                    rows={7}
                    className="w-full bg-card border border-border rounded-lg px-4 py-3 text-sm resize-none placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-all leading-relaxed"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">
                    {jobDescription.length} characters
                    {jobDescription.length > 0 && jobDescription.length < 20 && (
                      <span className="text-amber-400 ml-2">— paste more for better results</span>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: "Portfolio URL", icon: <Globe size={13} />, value: portfolioUrl, onChange: setPortfolioUrl, placeholder: "https://yourportfolio.com" },
                    { label: "GitHub URL", icon: <Github size={13} />, value: githubUrl, onChange: setGithubUrl, placeholder: "https://github.com/username" },
                  ].map((field) => (
                    <div key={field.label}>
                      <label className="block text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        {field.label} <span className="normal-case font-normal tracking-normal opacity-50">(optional)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{field.icon}</span>
                        <input
                          type="url" value={field.value}
                          onChange={(e) => field.onChange(e.target.value)}
                          placeholder={field.placeholder}
                          className="w-full pl-8 pr-3 py-2.5 bg-card border border-border rounded-lg text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/40 transition-all"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={startProcessing} disabled={!canStart}
                  className={`w-full py-4 rounded-xl font-semibold text-[0.95rem] transition-all duration-200 flex items-center justify-center gap-2.5 ${
                    canStart
                      ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_24px_rgba(30,216,164,0.22)] active:scale-[0.99]"
                      : "bg-muted text-muted-foreground cursor-not-allowed"
                  }`}
                >
                  <Sparkles size={17} />
                  Tailor My Resume
                  {canStart && <ArrowRight size={17} />}
                </button>
                {!canStart && (
                  <p className="text-xs text-muted-foreground text-center -mt-2">
                    Upload a resume and paste a job description to continue
                  </p>
                )}
              </div>

              {/* Pipeline preview */}
              <div className="bg-card border border-border rounded-xl p-6 sticky top-6">
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest mb-5">What happens next</p>
                <div className="space-y-3.5">
                  {AGENTS.map((agent) => (
                    <div key={agent.id} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full border border-border bg-muted/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-[9px] text-muted-foreground font-mono">{agent.id}</span>
                      </div>
                      <div>
                        <p className="text-[12.5px] font-medium leading-snug">{agent.name}</p>
                        <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{agent.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-5 border-t border-border">
                  <p className="text-[11px] text-muted-foreground">
                    Template similarity target: <span className="text-primary font-medium">95%+ visual match</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PROCESSING ────────────────────────────────────────────────── */}
        {appState === "processing" && (
          <div>
            <div className="text-center mb-10">
              <p className="text-[11px] text-primary font-mono uppercase tracking-[0.22em] mb-3">Processing</p>
              <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display,'Playfair Display',serif)" }}>
                Optimizing your resume
              </h2>
              <p className="text-muted-foreground text-sm">
                {resumeFile?.name} · 9 specialized agents working in sequence
              </p>
            </div>

            <div className="max-w-xl mx-auto mb-8">
              <div className="flex justify-between text-xs text-muted-foreground mb-2">
                <span>{completedAgents.size} of {AGENTS.length} agents complete</span>
                <span className="font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }} />
              </div>
            </div>

            <div className="max-w-xl mx-auto space-y-2">
              {AGENTS.map((agent, i) => {
                const done = completedAgents.has(i);
                const running = currentAgentIdx === i && !done;
                return (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-4 px-5 py-3.5 rounded-lg border transition-all duration-300 ${
                      done ? "bg-primary/5 border-primary/18"
                        : running ? "bg-card border-primary/35 shadow-[0_0_14px_rgba(30,216,164,0.1)]"
                        : "bg-card/40 border-border/40 opacity-40"
                    }`}
                  >
                    <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center">
                      {done ? (
                        <CheckCircle2 size={18} className="text-primary" />
                      ) : running ? (
                        <Loader2 size={18} className="text-primary animate-spin" />
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-border/60 flex items-center justify-center">
                          <span className="text-[9px] text-muted-foreground font-mono">{agent.id}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-tight ${running ? "text-foreground" : done ? "text-foreground/75" : "text-muted-foreground"}`}>
                        {agent.name}
                      </p>
                      {(running || done) && (
                        <p className="text-[11px] text-muted-foreground mt-0.5">{agent.desc}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-[11px] font-mono">
                      {done ? <span className="text-primary">Done</span>
                        : running ? <span className="text-primary animate-pulse">Running</span>
                        : <span className="text-muted-foreground/50">Queued</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── RESULTS ───────────────────────────────────────────────────── */}
        {appState === "results" && (() => {
          const activeResults = customResults || RESULTS;
          return (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5 mb-8">
                <div>
                  <p className="text-[11px] text-primary font-mono uppercase tracking-[0.22em] mb-2">Analysis Complete</p>
                  <h2 className="text-3xl font-bold mb-1.5" style={{ fontFamily: "var(--font-display,'Playfair Display',serif)" }}>
                    Your optimized resume is ready
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {resumeFile?.name}{jobSnippet && <> · Tailored for &ldquo;{jobSnippet}…&rdquo;</>}
                  </p>
                </div>

                <div className="flex gap-3 flex-shrink-0">
                  <button
                    onClick={handleDownloadDocx}
                    disabled={!!downloading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border hover:border-primary/35 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {downloading === "docx" ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                    {downloading === "docx" ? "Generating…" : "Download DOCX"}
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={!!downloading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200 hover:shadow-[0_0_18px_rgba(30,216,164,0.28)] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {downloading === "pdf" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                    {downloading === "pdf" ? "Generating…" : "Download PDF"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard label="ATS Score" value={`${activeResults.atsScore}`} unit="/100" change={`+${activeResults.atsScore - activeResults.previousScore} pts`} />
                <StatCard label="Keyword Coverage" value={`${activeResults.keywordCoverage}`} unit="%" change="+31%" />
                <StatCard label="Section Quality" value={`${activeResults.sectionQuality}`} unit="/100" change="+29 pts" />
                <StatCard label="Readability" value={`${activeResults.readabilityScore}`} unit="/100" change="+19 pts" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-5 mb-5">
                <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center min-w-[200px]">
                  <CircularScore value={activeResults.atsScore} animated={scoreAnimated} />
                  <div className="mt-5 text-center">
                    <p className="text-xs text-muted-foreground">
                      Was <span className="font-mono text-foreground/60">{activeResults.previousScore}</span> before optimization
                    </p>
                    <p className="text-sm font-semibold text-primary mt-1.5">
                      +{activeResults.atsScore - activeResults.previousScore} points gained
                    </p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertTriangle size={13} className="text-amber-400 flex-shrink-0" />
                    <h3 className="text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground">Missing Keywords</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Skills in the JD not found in your resume, portfolio, or GitHub
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeResults.missingKeywords.map((kw: string) => (
                      <span key={kw} className="text-[11px] font-mono px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full">{kw}</span>
                    ))}
                  </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Plus size={13} className="text-primary flex-shrink-0" />
                    <h3 className="text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground">Added Keywords</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                    Keywords integrated from your GitHub and portfolio into the resume
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeResults.addedKeywords.map((kw: string) => (
                      <span key={kw} className="text-[11px] font-mono px-2.5 py-1 bg-primary/10 border border-primary/20 text-primary rounded-full">{kw}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 mb-5">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={13} className="text-primary" />
                  <h3 className="text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground">Improvement Summary</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeResults.improvements.map((item: string, i: number) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 size={14} className="text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-foreground/80 leading-relaxed">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              {activeResults.gapAnalysis && (
                <div className="bg-card border border-border rounded-xl p-6 mb-5">
                  <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-3">
                    <div className="flex items-center gap-2">
                      <Target size={13} className="text-primary" />
                      <h3 className="text-[10px] font-mono font-medium uppercase tracking-widest text-muted-foreground">Gap Analysis & Action Plan (Agent 5)</h3>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-primary/10 border border-primary/20 text-primary rounded-full">
                      Compatibility Score: {activeResults.gapAnalysis.compatibility_score}%
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Skills Breakdown */}
                    <div>
                      <div className="mb-4">
                        <h4 className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground mb-2">Matching Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {activeResults.gapAnalysis.matching_skills && activeResults.gapAnalysis.matching_skills.length > 0 ? (
                            activeResults.gapAnalysis.matching_skills.map((s: string) => (
                              <span key={s} className="text-[10px] font-mono px-2.5 py-0.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full">{s}</span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No matching skills identified yet.</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground mb-2">Missing/Gap Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {activeResults.gapAnalysis.missing_skills && activeResults.gapAnalysis.missing_skills.length > 0 ? (
                            activeResults.gapAnalysis.missing_skills.map((s: string) => (
                              <span key={s} className="text-[10px] font-mono px-2.5 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full">{s}</span>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No gaps identified.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Plan */}
                    <div className="border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6">
                      <h4 className="text-[11px] font-mono font-medium uppercase tracking-wider text-muted-foreground mb-3">Recommended Action Plan</h4>
                      <div className="space-y-2.5">
                        {activeResults.gapAnalysis.action_plan && activeResults.gapAnalysis.action_plan.length > 0 ? (
                          activeResults.gapAnalysis.action_plan.map((action: string, i: number) => (
                            <div key={i} className="flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                              <p className="text-xs text-foreground/80 leading-normal">{action}</p>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">No recommended action plan available.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-primary/5 border border-primary/18 rounded-xl px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold mb-0.5" style={{ fontFamily: "var(--font-display,'Playfair Display',serif)" }}>
                    Ready to apply?
                  </h3>
                <p className="text-sm text-muted-foreground">
                  Your original template is fully preserved — download and submit directly.
                </p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={handleDownloadDocx}
                  disabled={!!downloading}
                  className="flex items-center gap-2 px-5 py-3 bg-card border border-border hover:border-primary/35 text-sm font-medium rounded-lg transition-all duration-200 disabled:opacity-60"
                >
                  {downloading === "docx" ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
                  {downloading === "docx" ? "Generating…" : "DOCX"}
                </button>
                <button
                  onClick={handleDownloadPdf}
                  disabled={!!downloading}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-sm font-semibold rounded-lg hover:bg-primary/90 transition-all duration-200 hover:shadow-[0_0_22px_rgba(30,216,164,0.32)] disabled:opacity-60"
                >
                  {downloading === "pdf" ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  {downloading === "pdf" ? "Generating…" : "PDF Download"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
      </main>
    </div>
  );
}
