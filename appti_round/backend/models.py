from pydantic import BaseModel
from typing import List, Optional

class TestRequest(BaseModel):
    difficulty: str  
    company: str = "Generic"

class QuestionOption(BaseModel):
    key: str  
    value: str

class QuestionModel(BaseModel):
    id: int
    category: str  
    question: str
    options: List[QuestionOption]

class TestResponse(BaseModel):
    questions: List[QuestionModel]

class AnswerModel(BaseModel):
    question_id: int
    selected_option: str

class EvaluationRequest(BaseModel):
    difficulty: str
    questions: List[QuestionModel]
    answers: List[AnswerModel]

class QuestionResult(BaseModel):
    question_id: int
    is_correct: bool
    correct_option: str
    explanation: str

class EvaluationResponse(BaseModel):
    total_score: int
    max_score: int
    results: List[QuestionResult]
    summary: str
