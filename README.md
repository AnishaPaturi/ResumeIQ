# 🚀 ResumeAI — Multi-Agent AI Resume Analyzer

ResumeAI is an **AI-powered resume analysis platform** that evaluates resumes using multiple AI agents.
It analyzes a user's resume, compares it with industry requirements, calculates an **ATS-style score**, and suggests **skills, projects, and improvements** to help students and developers become more competitive in the job market.

The system uses a **React frontend** and a **Node.js backend** with multiple AI agents that interact with large language models.

---

# ✨ Key Features

• Upload resumes (PDF) for analysis
• AI-powered resume parsing
• ATS-style resume scoring
• Skill gap analysis based on job requirements
• Career suggestions for Computer Science students
• Industry trend recommendations
• Secure login & signup authentication
• Protected routes for logged-in users
• Multi-agent AI architecture

---

# 🧠 AI Agents Used

The backend orchestrates multiple AI agents:

### 1️⃣ Resume Parser Agent

Extracts structured data from resumes:

* skills
* education
* projects
* experience

### 2️⃣ Resume Scoring Agent

Evaluates resumes based on:

* skills
* projects
* ATS friendliness
* relevance to industry roles

Outputs:

* resume score (0–100)
* strengths
* weaknesses

### 3️⃣ Skill Matching Agent

Compares resume content with **job requirements** and identifies:

* matching skills
* missing skills
* compatibility score

### 4️⃣ Career Advisor Agent

Provides career advice such as:

* trending technologies
* skills to learn
* project ideas
* resume improvements

---

# 🏗️ System Architecture

User → React Frontend → Express Backend → AI Agent Pipeline → LLM API

AI agents analyze the resume sequentially and generate insights that are displayed in the frontend dashboard.

---

# 🛠️ Technology Stack

## Frontend

* React (TypeScript)
* Vite
* TailwindCSS / @tailwindcss/vite
* Lucide React (Icons)
* PDFJS (Local client-side text extraction worker)
* jsPDF & JSZip (Client-side document editing & downloads)

## Backend

* Python
* FastAPI
* Httpx (Async HTTP calls)
* Uvicorn (ASGI web server)

* OpenRouter API
* Cascading fallback models (`google/gemini-2.5-flash`, `google/gemini-2.0-flash`, `google/gemini-2.0-flash-lite`, etc.) with intelligent rate limit retry handling.

---

# 📁 Complete Project Folder Structure

```text
ResumeIQ
│
├── src                     # Frontend React Source
│   ├── app
│   │   └── App.tsx         # Core resume analysis dashboard & UI
│   ├── data
│   │   └── knowledge_base.json # RAG Industry knowledge base
│   ├── styles
│   │   └── index.css       # Styling & tailwind integrations
│   └── main.tsx            # React application entry point
│
├── backend                 # Python FastAPI Backend
│   ├── app
│   │   ├── main.py         # FastAPI endpoints & .env loader
│   │   ├── agents.py       # Multi-agent prompt pipelines & API call fallback logic
│   │   └── utils.py        # PDF & Word text extraction helpers
│   ├── .env                # Server-side API key configuration
│   └── requirements.txt    # Python package dependencies
│
├── package.json            # React/Vite dependencies & build scripts
├── vite.config.ts          # Vite configuration
└── README.md               # Documentation
```

---

# ⚙️ Backend Installation

### 1️⃣ Navigate to backend and install requirements

```bash
cd backend
pip install -r requirements.txt
```

---

### 2️⃣ Configure Environment Variables

Create or open the `.env` file inside the `backend/` folder and paste your key:

```env
# OpenRouter API Key
OPENROUTER_API_KEY=your_openrouter_key_here
```

---

### 3️⃣ Start the Backend Server

Run the FastAPI backend with uvicorn:

```bash
uvicorn app.main:app --reload
```

The backend server will run on:
```
http://localhost:8000
```

---

# ⚙️ Frontend Installation

### 1️⃣ Install dependencies (at the root of the project)

```bash
npm install
```

---

### 2️⃣ Start Frontend Server

```bash
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

# 🔐 Authentication Flow

1️⃣ User registers using **Signup Page**
2️⃣ User logs in using **Login Page**
3️⃣ Backend generates a **JWT token**
4️⃣ Token stored in **localStorage**
5️⃣ Protected routes are controlled by:

```
components/ProtectedRoute.jsx
```

Authentication state is managed using:

```
context/AuthContext.jsx
```

---

# 📄 Resume Analysis Flow

```
User Uploads Resume
        ↓
PDF Text Extraction
        ↓
Resume Parser Agent
        ↓
Resume Scoring Agent
        ↓
Skill Matching Agent
        ↓
Career Advisor Agent
        ↓
Results Returned to Dashboard
```

---

# 🚀 Running the Full Application

Open **two terminals**:

### Terminal 1 — Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Terminal 2 — Frontend (at root of the project)
```bash
npm install
npm run dev
```

Now open the React client in your browser:
```
http://localhost:5173
```

---

# 📌 Environment Requirements

Node.js ≥ 18
MongoDB installed locally
OpenRouter API key

---

# 🚀 Future Improvements

• Resume rewriting AI
• ATS keyword optimization
• LinkedIn profile analysis
• GitHub project analysis
• AI interview preparation

---

# 👩‍💻 Author

Anisha Paturi
Computer Science Engineering Student

---

# ⭐ Support

If you like this project, give it a star on GitHub!
