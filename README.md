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

* React
* Vite
* TailwindCSS
* Axios
* React Router

## Backend

* Node.js
* Express.js
* MongoDB
* JWT Authentication
* Multer (file upload)

## AI Integration

* OpenRouter API
* Claude / DeepSeek models

## Utilities

* pdf-parse (resume text extraction)
* bcryptjs (password hashing)

---

# 📁 Complete Project Folder Structure

```text
RESUMEAI
│
├── frontend
│   │
│   ├── node_modules
│   │
│   ├── src
│   │   │
│   │   ├── components
│   │   │   │
│   │   │   └── ProtectedRoute.jsx
│   │   │       Protects routes that require authentication
│   │   │
│   │   ├── context
│   │   │   │
│   │   │   └── AuthContext.jsx
│   │   │       Handles login state, authentication logic,
│   │   │       and JWT token management
│   │   │
│   │   ├── pages
│   │   │   │
│   │   │   ├── Login.jsx
│   │   │   │   Login page UI and authentication request
│   │   │   │
│   │   │   ├── Signup.jsx
│   │   │   │   User registration page
│   │   │   │
│   │   │   ├── Dashboard.jsx
│   │   │   │   Displays AI analysis results
│   │   │   │
│   │   │   └── UploadResume.jsx
│   │   │       Resume upload interface
│   │   │
│   │   ├── services
│   │   │   │
│   │   │   └── api.js
│   │   │       Central API configuration using Axios
│   │   │
│   │   ├── App.jsx
│   │   │   Main React application router
│   │   │
│   │   ├── main.jsx
│   │   │   React entry point
│   │   │
│   │   └── index.css
│   │       Tailwind global styles
│   │
│   ├── index.html
│   │   HTML root template
│   │
│   ├── package.json
│   │   Frontend dependencies
│   │
│   ├── vite.config.js
│   │   Vite configuration
│   │
│   ├── tailwind.config.js
│   │   Tailwind configuration
│   │
│   └── postcss.config.js
│       PostCSS configuration
│
│
├── backend
│   │
│   ├── controllers
│   │   │
│   │   ├── authController.js
│   │   │   Handles login and registration logic
│   │   │
│   │   └── resumeController.js
│   │       Handles resume analysis workflow
│   │
│   ├── routes
│   │   │
│   │   ├── authRoutes.js
│   │   │   API routes for login and signup
│   │   │
│   │   └── resumeRoutes.js
│   │       API routes for resume upload and analysis
│   │
│   ├── models
│   │   │
│   │   └── User.js
│   │       MongoDB schema for user accounts
│   │
│   ├── middleware
│   │   │
│   │   └── authMiddleware.js
│   │       Verifies JWT token for protected routes
│   │
│   ├── agents
│   │   │
│   │   ├── parserAgent.js
│   │   │   Extracts information from resume
│   │   │
│   │   ├── scoringAgent.js
│   │   │   Generates ATS-style resume score
│   │   │
│   │   ├── matcherAgent.js
│   │   │   Compares resume with job requirements
│   │   │
│   │   └── advisorAgent.js
│   │       Suggests skills and improvements
│   │
│   ├── utils
│   │   │
│   │   └── extractText.js
│   │       Extracts text from uploaded PDF resumes
│   │
│   ├── uploads
│   │   Temporary storage for uploaded resumes
│   │
│   ├── server.js
│   │   Main backend server entry point
│   │
│   ├── package.json
│   │   Backend dependencies
│   │
│   └── .env
│       Environment variables
│
└── README.md
```

---

# ⚙️ Backend Installation

### 1️⃣ Navigate to backend

```
cd backend
```

### 2️⃣ Install dependencies

```
npm install
```

### Required Backend Packages

```
express
mongoose
cors
dotenv
bcryptjs
jsonwebtoken
multer
pdf-parse
axios
```

---

### 3️⃣ Create Environment Variables

Create a `.env` file in the backend folder.

```
MONGO_URI=mongodb://localhost:27017/resumeai
JWT_SECRET=your_secret_key
OPENROUTER_API_KEY=your_openrouter_api_key
```

---

### 4️⃣ Start Backend Server

```
node server.js
```

Backend will run on:

```
http://localhost:5000
```

---

# ⚙️ Frontend Installation

### 1️⃣ Navigate to frontend

```
cd frontend
```

---

### 2️⃣ Install dependencies

```
npm install
```

### Required Frontend Packages

```
react
react-dom
react-router-dom
axios
tailwindcss
postcss
vite
```

---

### 3️⃣ Start Frontend Server

```
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

Open **two terminals**

### Terminal 1 — Backend

```
cd backend
npm install
node server.js
```

### Terminal 2 — Frontend

```
cd frontend
npm install
npm run dev
```

Now open:

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
