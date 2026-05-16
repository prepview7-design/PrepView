from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

import os
import sys


current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.models import TestRequest, TestResponse, EvaluationRequest, EvaluationResponse
from backend.llm_agent import generate_test, evaluate_answers

app = FastAPI(title="Aptitude Test API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/generate-test", response_model=TestResponse)
async def api_generate_test(request: TestRequest):
    try:
        questions = await generate_test(request.company, request.difficulty)
        return TestResponse(questions=questions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/evaluate-test", response_model=EvaluationResponse)
async def api_evaluate_test(request: EvaluationRequest):
    try:
        
        answers_dict = [{"question_id": a.question_id, "selected_option": a.selected_option} for a in request.answers]
        result = await evaluate_answers(request.difficulty, request.questions, answers_dict)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8001, reload=True)
