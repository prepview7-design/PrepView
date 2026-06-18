<<<<<<< HEAD
## PrepView 
# Technology & Model Log

This document maps the specific tasks and features in the AI Aptitude Test application to the exact Python libraries, frameworks, and Machine Learning / Deep Learning models used to accomplish them.

## 1. Web Scraping & Data Collection
**Task:** Extracting real Previous Year Questions (PYQs) from educational websites (like IndiaBix).
* **Library:** `beautifulsoup4` (BeautifulSoup)
* **Library:** `requests`
* **Why:** `requests` handles fetching the raw HTML from the website, and `BeautifulSoup` parses the HTML so we can easily extract the question text, options, and explanations using CSS classes.

## 2. Machine Learning Deduplication (Deep Learning)
**Task:** Preventing duplicate questions from being saved to the database by calculating the semantic similarity of text.
* **Library:** `sentence-transformers`
* **DL Model:** `all-MiniLM-L6-v2` (Hugging Face)
* **Why:** Standard text matching fails if a question is worded slightly differently. The `sentence-transformers` library converts text into a mathematical vector (embedding). We use cosine similarity (from the model) to detect if a new question means the exact same thing as an existing one, even if the wording is slightly altered.

## 3. Database Management & Storage
**Task:** Storing the scraped questions, options, and ML embeddings locally.
* **Library:** `sqlalchemy` (SQLAlchemy ORM)
* **Underlying Engine:** SQLite (`sqlite3`)
* **Why:** SQLAlchemy allows us to interact with the database using Python objects (like `QuestionDB`) instead of writing raw SQL queries. SQLite provides a lightweight, file-based database (`questions.db`) perfect for local development without needing a heavy server.

## 4. Backend API Server
**Task:** Serving the questions to the frontend and handling the evaluation requests.
* **Library:** `fastapi`
* **Library:** `uvicorn`
* **Why:** FastAPI is a modern, extremely fast web framework for building APIs in Python. Uvicorn is the ASGI server that actually runs the FastAPI application.

## 5. LLM Evaluation & Agent Workflow
**Task:** Evaluating the user's submitted answers, generating a performance summary, and orchestrating prompts.
* **Library:** `langchain`
* **Library:** `langchain-groq`
* **LLM Model:** `llama-3.1-8b-instant` (via Groq API)
* **Why:** LangChain provides the framework for building structured prompts and parsing the JSON output (`JsonOutputParser`). The `llama-3.1-8b-instant` model is a state-of-the-art open-source Large Language Model that is highly capable of reasoning and explanation, running at lightning speed on Groq's LPU hardware.

## 6. Frontend User Interface
**Task:** Displaying the interactive test, countdown timer, and results dashboard.
* **Library:** `streamlit`
* **Why:** Streamlit allows us to build complex, interactive data-driven web applications using pure Python, without needing to write complex React/Vue frontend code. It handles the session state, user inputs (dropdowns, radio buttons), and UI rendering.
=======
# PrepView
>>>>>>> 6e2f81c734c8172a36ae535e5a4666172f9bea9e


In Order to Run the backend
 -> cd backend
 -> node server.js

 In Order to Run the Frontend
 -> cd frontend
 -> npm run dev

 In Order to Run Apti Round
 -> cd appti_round
 -> uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload

 In Order to Run Compiler
 -> cd compiler
 -> cd app
 -> cd uvicorn main:app --reload

 In Order to Run Avatar_Interview
 -> cd avatar_interview
 ->  uvicorn backend.main:app --host 0.0.0.0 --port 8002 --reload