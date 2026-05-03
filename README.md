# Paper2Impact 🚀

Paper2Impact is an end-to-end AI-powered platform designed to bridge the gap between academic research and commercial products. It analyzes research papers, scores them based on commercial viability, and automatically generates actionable business proposals. 

## Features
- **PDF Upload & Processing**: Seamlessly upload research papers. Extracts text and stores semantic chunks in a local vector database (ChromaDB) for advanced context retrieval.
- **AI Impact Scoring**: Uses the Groq API to evaluate papers on *Novelty, Market Relevance, Feasibility,* and *Scalability*.
- **AI Proposal Generation**: Generates comprehensive business proposals including product ideas, target users, pricing models, and market positioning based on the paper's context.
- **BERTScore Verification**: Evaluates the faithfulness of the generated business proposal against the original paper abstract using BERTScore (RoBERTa).
- **Analyst Approval Workflow**: A complete pipeline spanning from `Upload` -> `Scoring` -> `Decision` -> `Proposal` -> `Final Approval`.
- **Modern UI**: A sleek, fully responsive frontend built with React, featuring glassmorphism, gradient accents, and dynamic progress trackers.

---

## Tech Stack

### Frontend
- **Framework**: React.js with Vite
- **Routing**: React Router
- **Styling**: Vanilla CSS with custom Design System variables (Glassmorphism, Gradients)
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python)
- **Database**: SQLite (via SQLAlchemy ORM)
- **Vector Store**: ChromaDB (with `sentence-transformers` for embeddings)
- **AI/LLM**: Groq API (for rapid inference)
- **Evaluation**: `bert-score` (for semantic verification)
- **PDF Processing**: PyMuPDF (`fitz`)

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.11
- A valid Groq API Key

### 1. Backend Setup
Navigate to the backend directory and set up the Python environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your Groq API Key
echo "GROQ_API_KEY=your_api_key_here" > .env

# Start the FastAPI server
python run.py
```
*The backend will run on `http://localhost:8000`*

### 2. Frontend Setup
Open a new terminal, navigate to the frontend directory, and run the dev server:
```bash
cd frontend

# Install dependencies
npm install

# Start the Vite dev server
npm run dev
```
*The frontend will run on `http://localhost:5173`*

---

## API Endpoints Overview

- `POST /api/papers/upload` - Upload a PDF and process it into the vector store.
- `GET /api/papers` - List all uploaded papers.
- `DELETE /api/papers/{id}` - Delete a paper and remove its vectors.
- `POST /api/papers/{id}/score` - Trigger AI impact scoring.
- `POST /api/papers/{id}/proposal/generate` - Generate a business proposal.
- `GET /api/papers/{id}/proposal/bertscore` - Evaluate the generated proposal against the abstract using BERTScore.

---

## License
MIT License
