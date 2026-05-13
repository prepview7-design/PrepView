import os
import json
import asyncio
from typing import TypedDict, List, Dict, Any
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

import sys
import random

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.models import QuestionModel, QuestionOption, EvaluationResponse, QuestionResult
from backend.database import SessionLocal, QuestionDB

load_dotenv()


if os.getenv("GROQ_API_KEY"):
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.7)
elif os.getenv("GOOGLE_API_KEY"):
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.7)
elif os.getenv("OPENAI_API_KEY"):
    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
else:
    raise ValueError("Please set GROQ_API_KEY, GOOGLE_API_KEY, or OPENAI_API_KEY in the .env file")


async def generate_test(company: str, difficulty: str) -> List[QuestionModel]:
    """
    Fetches company-specific questions from the SQLite database instead of generating them on the fly.
    """
    db = SessionLocal()
    try:
        # Fetch all matching questions from the DB
        query = db.query(QuestionDB)
        if company != "Generic":
            query = query.filter(QuestionDB.company == company)
            
        # Optional: filter by difficulty if we have enough questions
        # query = query.filter(QuestionDB.difficulty == difficulty)
        
        all_db_questions = query.all()
        selected_questions = all_db_questions.copy()
        
        # We need exactly 60 questions. If we don't have enough for this company, pad with Generic.
        if len(selected_questions) < 60 and company != "Generic":
            generic_questions = db.query(QuestionDB).filter(QuestionDB.company == "Generic").all()
            selected_questions.extend(generic_questions)
            
        # If STILL less than 60, duplicate randomly until 60 so the test doesn't crash or run short
        if not selected_questions:
            raise Exception(f"No questions found at all! Please run the scraper or seed_db.py first.")
            
        while len(selected_questions) < 60:
            selected_questions.append(random.choice(selected_questions))
            
        # Shuffle and pick exactly 60 questions
        random.shuffle(selected_questions)
        selected_questions = selected_questions[:60]
        
        formatted_questions = []
        for i, q in enumerate(selected_questions):
            options_data = json.loads(q.options_json)
            options = [QuestionOption(key=opt['key'], value=opt['value']) for opt in options_data]
            
            formatted_questions.append(
                QuestionModel(
                    id=i + 1,
                    category=q.category,
                    question=q.question_text,
                    options=options
                )
            )
            
        return formatted_questions
    finally:
        db.close()



class EvaluationOutput(BaseModel):
    results: List[Dict[str, Any]] = Field(description="List of results per question with question_id, is_correct, correct_option, and explanation")
    summary: str = Field(description="A short summary of the user's performance")

eval_parser = JsonOutputParser(pydantic_object=EvaluationOutput)

async def evaluate_answers(difficulty: str, questions: List[QuestionModel], answers: List[dict]) -> EvaluationResponse:
    prompt = PromptTemplate(
        template="""You are an expert evaluator for an aptitude test.
Difficulty: {difficulty}

Here are the questions and the options provided to the user:
{questions}

Here are the user's selected answers:
{answers}

Evaluate the user's answers. Provide the correct option (A, B, C, or D) for each question, whether the user was correct, and a brief explanation of the correct answer. Also, provide a short overall summary of their performance.
\n{format_instructions}""",
        input_variables=["difficulty", "questions", "answers"],
        partial_variables={"format_instructions": eval_parser.get_format_instructions()}
    )
    
    chain = prompt | llm | eval_parser
    
    # We must chunk the questions because 60 questions will exceed the LLM's output token limit
    # and cause the JSON parser to crash from truncated JSON.
    chunk_size = 15
    tasks = []
    
    for i in range(0, len(questions), chunk_size):
        q_chunk = questions[i:i+chunk_size]
        a_chunk = [ans for ans in answers if any(ans['question_id'] == q.id for q in q_chunk)]
        
        q_data = [{"id": q.id, "question": q.question, "options": [{"key": o.key, "value": o.value} for o in q.options]} for q in q_chunk]
        
        tasks.append(chain.ainvoke({
            "difficulty": difficulty,
            "questions": json.dumps(q_data, indent=2),
            "answers": json.dumps(a_chunk, indent=2)
        }))
        
    try:
        chunk_results = await asyncio.gather(*tasks)
        
        # Combine the results
        all_results = []
        combined_summary = ""
        for res in chunk_results:
            all_results.extend(res.get("results", []))
            combined_summary += res.get("summary", "") + " "
            
        total_score = sum(1 for r in all_results if r.get("is_correct"))
        
        # Final summary pass: combine the multiple chunk summaries into one clean summary
        summary_prompt = PromptTemplate(
            template="Summarize the following partial performance reviews into a single, cohesive, short 3-sentence performance summary for an aptitude test user. Write directly to the user.\n\nReviews:\n{reviews}",
            input_variables=["reviews"]
        )
        summary_chain = summary_prompt | llm
        final_summary = await summary_chain.ainvoke({"reviews": combined_summary})
        
        final_eval = []
        for r in all_results:
            final_eval.append(QuestionResult(
                question_id=int(r.get("question_id", 0)),
                is_correct=bool(r.get("is_correct", False)),
                correct_option=str(r.get("correct_option", "A")),
                explanation=str(r.get("explanation", "No explanation provided."))
            ))
            
        return EvaluationResponse(
            total_score=total_score,
            max_score=len(questions),
            results=final_eval,
            summary=final_summary.content if hasattr(final_summary, "content") else str(final_summary)
        )
        
    except Exception as e:
        print(f"Evaluation Error: {e}")
        # Fallback if evaluation fails, return dummy evaluation so UI doesn't crash
        return EvaluationResponse(
            total_score=0,
            max_score=len(questions),
            results=[],
            summary="Evaluation failed due to LLM context limits or rate limits. Please try a shorter test."
        )
