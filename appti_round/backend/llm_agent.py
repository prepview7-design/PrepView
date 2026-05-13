import os
import json
import asyncio
from typing import TypedDict, List, Dict, Any
from dotenv import load_dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langgraph.graph import StateGraph, END
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field

import sys


current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.models import QuestionModel, QuestionOption, EvaluationResponse, QuestionResult

load_dotenv()


if os.getenv("GROQ_API_KEY"):
    llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.7)
elif os.getenv("GOOGLE_API_KEY"):
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-pro", temperature=0.7)
elif os.getenv("OPENAI_API_KEY"):
    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
else:
    raise ValueError("Please set GROQ_API_KEY, GOOGLE_API_KEY, or OPENAI_API_KEY in the .env file")

class QuestionGenerationOutput(BaseModel):
    questions: List[Dict[str, Any]] = Field(description="List of questions with category, question text, and options (A, B, C, D)")

question_parser = JsonOutputParser(pydantic_object=QuestionGenerationOutput)


class GenerationState(TypedDict):
    difficulty: str
    logical_questions: List[Dict]
    numerical_questions: List[Dict]
    error: str


async def generate_logical(state: GenerationState):
    prompt = PromptTemplate(
        template="Generate 15 {difficulty} difficulty Logical Reasoning questions for an aptitude test.\n{format_instructions}\nEnsure each question has exactly 4 options labeled A, B, C, D.",
        input_variables=["difficulty"],
        partial_variables={"format_instructions": question_parser.get_format_instructions()}
    )
    chain = prompt | llm | question_parser
    try:
        res = await chain.ainvoke({"difficulty": state["difficulty"]})
        
        for q in res['questions']:
            q['category'] = "Logical Reasoning"
        return {"logical_questions": res['questions']}
    except Exception as e:
        return {"error": str(e)}

async def generate_numerical(state: GenerationState):
    prompt = PromptTemplate(
        template="Generate 15 {difficulty} difficulty Numerical Ability questions for an aptitude test.\n{format_instructions}\nEnsure each question has exactly 4 options labeled A, B, C, D.",
        input_variables=["difficulty"],
        partial_variables={"format_instructions": question_parser.get_format_instructions()}
    )
    chain = prompt | llm | question_parser
    try:
        res = await chain.ainvoke({"difficulty": state["difficulty"]})
        for q in res['questions']:
            q['category'] = "Numerical Ability"
        return {"numerical_questions": res['questions']}
    except Exception as e:
        return {"error": str(e)}

def build_generation_graph():
    workflow = StateGraph(GenerationState)
    workflow.add_node("generate_logical", generate_logical)
    workflow.add_node("generate_numerical", generate_numerical)
    
    workflow.set_entry_point("generate_logical")
    workflow.add_edge("generate_logical", "generate_numerical")
    workflow.add_edge("generate_numerical", END)
    
    return workflow.compile()

async def generate_test(difficulty: str) -> List[QuestionModel]:
    graph = build_generation_graph()
    initial_state = GenerationState(difficulty=difficulty, logical_questions=[], numerical_questions=[], error="")
    result = await graph.ainvoke(initial_state)
    
    if result.get("error"):
        raise Exception(f"Failed to generate test: {result['error']}")
        
    all_raw_questions = result["logical_questions"] + result["numerical_questions"]
    
    formatted_questions = []
    for i, q in enumerate(all_raw_questions):
        options = []
        if 'options' in q:
            if isinstance(q['options'], dict):
                 for k, v in q['options'].items():
                     options.append(QuestionOption(key=k, value=str(v)))
            elif isinstance(q['options'], list):
                 keys = ['A', 'B', 'C', 'D']
                 for j, opt in enumerate(q['options']):
                     if isinstance(opt, dict) and 'key' in opt and 'value' in opt:
                         options.append(QuestionOption(key=opt['key'], value=str(opt['value'])))
                     else:
                         options.append(QuestionOption(key=keys[j] if j < 4 else str(j), value=str(opt)))
                         
       
        while len(options) < 4:
             keys = ['A', 'B', 'C', 'D']
             options.append(QuestionOption(key=keys[len(options)], value="Option"))
             
        formatted_questions.append(
            QuestionModel(
                id=i + 1,
                category=q.get("category", "General"),
                question=q.get("question", "Missing question text"),
                options=options[:4]
            )
        )
        
    return formatted_questions



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
    
    questions_data = [{"id": q.id, "question": q.question, "options": [{"key": o.key, "value": o.value} for o in q.options]} for q in questions]
    
    res = await chain.ainvoke({
        "difficulty": difficulty,
        "questions": json.dumps(questions_data, indent=2),
        "answers": json.dumps(answers, indent=2)
    })
    
    results = []
    total_score = 0
    for r in res['results']:
        is_correct = bool(r.get('is_correct', False))
        if is_correct:
            total_score += 1
            
        results.append(QuestionResult(
            question_id=int(r['question_id']),
            is_correct=is_correct,
            correct_option=str(r.get('correct_option', '')),
            explanation=str(r.get('explanation', ''))
        ))
        
    return EvaluationResponse(
        total_score=total_score,
        max_score=len(questions),
        results=results,
        summary=res.get('summary', 'Evaluation completed.')
    )
