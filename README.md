# F.R.I.D.A.Y — AI Platform

> Your personal AI platform with 12 specialized agents, 
> anime character personalities, and a cinematic UI.

![FRIDAY AI Platform](./preview.png)

## 🚀 Live Demo
[friday-ai.vercel.app](https://friday-ai.vercel.app)

## ✨ Features

- **12 AI Agents** — Code, Research, Write, Analyze, 
  Translate, Debug, Plan, Finance and more
- **Auto-detection** — Automatically picks the best 
  agent for your task
- **Anime Characters** — Choose from 6 personalities 
  (Naruto, Levi, Zero Two, Itachi, Rem, Gojo)
- **Cinematic Onboarding** — Netflix-style character 
  selection with animated intro
- **Full Auth System** — JWT authentication, 
  15-day sessions
- **Your Data** — All conversations saved to 
  YOUR database, not Claude's
- **PWA Ready** — Works on iPhone/Android 
  like a native app

## 🛠️ Tech Stack

### Backend
- Python + FastAPI
- SQLAlchemy + SQLite
- JWT Authentication (bcrypt)
- Anthropic Claude API
- ChromaDB (Vector DB)

### Frontend
- React.js
- GSAP Animations
- Lucide Icons
- Axios

## 📦 Installation

### Backend
\`\`\`bash
cd backend
python -m venv ai-env
ai-env\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
\`\`\`

### Frontend
\`\`\`bash
cd frontend
npm install
npm start
\`\`\`

### Environment Variables
\`\`\`env
ANTHROPIC_API_KEY=your_key
SECRET_KEY=your_secret
DATABASE_URL=sqlite:///./friday.db
\`\`\`

## 🏗️ Architecture

\`\`\`
React Frontend → FastAPI Backend → Claude API
                     ↓
               SQLite Database
                     ↓
               ChromaDB (RAG)
\`\`\`

## 👤 Author
Built by Mehtab # FRIDAY-Ai
# FRIDAY-Ai
# Friday
