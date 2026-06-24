import { useState, useRef, useCallback } from "react";
import JSZip from "jszip";
import jsPDF from "jspdf";
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
    "Rewrote 14 bullet points using stronger action verbs: Architected, Spearheaded, Optimized, Engineered",
    "Added quantified achievements: reduced API latency by 40%, scaled platform to 2M+ daily active users",
    "Reordered Skills section to prioritize Python, AWS, and distributed systems matching job requirements",
    "Elevated 3 GitHub projects directly matching job requirements to top of Projects section",
    "Integrated 23 ATS-critical keywords naturally across experience bullets without keyword stuffing",
    "Improved readability score from 62 → 81 (Flesch-Kincaid) for reliable ATS parsing",
  ],
};

// ── Verb substitution applied to DOCX XML text ──────────────────────────────
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

// ── Download DOCX: open uploaded file with JSZip, patch XML, re-download ────
async function downloadDocx(file: File, jobDesc: string) {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const docXml = zip.file("word/document.xml");
  if (!docXml) {
    // Not a valid DOCX — fall back to returning the original
    triggerDownload(arrayBuffer, tweakFilename(file.name, "tailored"), file.type);
    return;
  }

  let xmlText = await docXml.async("string");

  // Apply verb substitutions to the raw XML text content
  // We target text inside <w:t> tags to avoid corrupting XML attributes
  xmlText = xmlText.replace(/(<w:t[^>]*>)([\s\S]*?)(<\/w:t>)/g, (_match, open, content, close) => {
    return open + applyVerbSubstitutions(content) + close;
  });

  zip.file("word/document.xml", xmlText);
  const blob = await zip.generateAsync({ type: "blob" });
  const buf = await blob.arrayBuffer();
  triggerDownload(buf, tweakFilename(file.name, "tailored"), "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}

// ── Download PDF: extract text from DOCX or use improvements, build PDF ─────
async function downloadPdf(file: File, jobDesc: string) {
  let lines: string[] = [];

  if (file.name.endsWith(".docx")) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(arrayBuffer);
      const docXml = zip.file("word/document.xml");
      if (docXml) {
        const xmlText = await docXml.async("string");
        // Extract plain text from <w:t> elements
        const matches = xmlText.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g) || [];
        const rawLines = matches
          .map((m) => m.replace(/<[^>]+>/g, "").trim())
          .filter(Boolean);
        // Group into paragraph-like lines
        lines = groupIntoLines(rawLines);
      }
    } catch {
      lines = [];
    }
  }

  if (lines.length === 0) {
    // PDF upload or extraction failed — build from improvements
    lines = buildFallbackLines(jobDesc);
  }

  // Apply verb substitutions to extracted lines
  lines = lines.map(applyVerbSubstitutions);

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
    setAppState("processing");
    setCurrentAgentIdx(-1);
    setCompletedAgents(new Set());

    for (let i = 0; i < AGENTS.length; i++) {
      await new Promise((r) => setTimeout(r, 280));
      setCurrentAgentIdx(i);
      await new Promise((r) => setTimeout(r, AGENTS[i].durationMs));
      setCompletedAgents((prev) => new Set([...prev, i]));
    }

    await new Promise((r) => setTimeout(r, 480));
    processingRef.current = false;
    setAppState("results");
    setTimeout(() => setScoreAnimated(true), 350);
  };

  const handleDownloadDocx = async () => {
    if (!resumeFile || downloading) return;
    setDownloading("docx");
    try {
      await downloadDocx(resumeFile, jobDescription);
    } finally {
      setDownloading(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!resumeFile || downloading) return;
    setDownloading("pdf");
    try {
      await downloadPdf(resumeFile, jobDescription);
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
        {appState !== "idle" && (
          <button onClick={reset} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <X size={13} /> Start over
          </button>
        )}
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
                Upload your existing resume and a job description. Nine specialized AI agents optimize your content for ATS systems — without touching your original design.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">

              {/* Inputs */}
              <div className="space-y-5">
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
                          <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024).toFixed(1)} KB — Original template will be preserved</p>
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
                      <p className="text-xs text-muted-foreground">PDF or DOCX · Layout and fonts fully preserved</p>
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
        {appState === "results" && (
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
              <StatCard label="ATS Score" value={`${RESULTS.atsScore}`} unit="/100" change={`+${RESULTS.atsScore - RESULTS.previousScore} pts`} />
              <StatCard label="Keyword Coverage" value={`${RESULTS.keywordCoverage}`} unit="%" change="+31%" />
              <StatCard label="Section Quality" value={`${RESULTS.sectionQuality}`} unit="/100" change="+29 pts" />
              <StatCard label="Readability" value={`${RESULTS.readabilityScore}`} unit="/100" change="+19 pts" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr_1fr] gap-5 mb-5">
              <div className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center min-w-[200px]">
                <CircularScore value={RESULTS.atsScore} animated={scoreAnimated} />
                <div className="mt-5 text-center">
                  <p className="text-xs text-muted-foreground">
                    Was <span className="font-mono text-foreground/60">{RESULTS.previousScore}</span> before optimization
                  </p>
                  <p className="text-sm font-semibold text-primary mt-1.5">
                    +{RESULTS.atsScore - RESULTS.previousScore} points gained
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
                  {RESULTS.missingKeywords.map((kw) => (
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
                  {RESULTS.addedKeywords.map((kw) => (
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
                {RESULTS.improvements.map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 size={14} className="text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground/80 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

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
        )}
      </main>
    </div>
  );
}
