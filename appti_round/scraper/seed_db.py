import os
import sys
import json
import asyncio
from dotenv import load_dotenv

# Ensure parent directory is in path to import backend
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.database import SessionLocal, QuestionDB, init_db
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer

load_dotenv()

print("Initializing DB and loading ML model...")
init_db()
model = SentenceTransformer('all-MiniLM-L6-v2')
db = SessionLocal()

llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0.7)

class SeedOutput(BaseModel):
    questions: List[Dict[str, Any]] = Field(description="List of questions with category, question, options (A,B,C,D array), correct_key, and explanation")

parser = JsonOutputParser(pydantic_object=SeedOutput)

async def seed_company_questions(company: str):
    print(f"Seeding Database for {company}...")
    
    prompt = PromptTemplate(
        template="""You are an expert at technical placements. Generate 5 highly realistic Previous Year Questions (PYQs) that are typically asked in {company} aptitude tests. 
Provide 3 Logical Reasoning and 2 Numerical Ability questions. 
For each, provide 4 options (A, B, C, D), the correct option key, and a short explanation.
\n{format_instructions}""",
        input_variables=["company"],
        partial_variables={"format_instructions": parser.get_format_instructions()}
    )
    
    chain = prompt | llm | parser
    
    try:
        res = await chain.ainvoke({"company": company})
        added = 0
        for q in res['questions']:
            q_text = q.get('question', '')
            
            # Check if it exists exactly
            if db.query(QuestionDB).filter(QuestionDB.question_text == q_text).first():
                continue
                
            # ML Embedding
            emb = model.encode(q_text).tolist()
            
            # Format options
            options = []
            if isinstance(q.get('options'), dict):
                options = [{'key': k, 'value': str(v)} for k, v in q['options'].items()]
            elif isinstance(q.get('options'), list):
                keys = ['A', 'B', 'C', 'D']
                for j, opt in enumerate(q['options']):
                    if isinstance(opt, dict) and 'key' in opt:
                        options.append({'key': opt['key'], 'value': str(opt.get('value', ''))})
                    else:
                        options.append({'key': keys[j] if j<4 else str(j), 'value': str(opt)})
            
            while len(options) < 4:
                options.append({'key': 'D', 'value': 'None'})
                
            new_q = QuestionDB(
                company=company,
                category=q.get('category', 'Logical Reasoning'),
                difficulty="Medium",
                question_text=q_text,
                options_json=json.dumps(options[:4]),
                embedding_json=json.dumps(emb)
            )
            db.add(new_q)
            added += 1
            
        db.commit()
        print(f"Successfully seeded {added} questions for {company}.")
        
    except Exception as e:
        safe_error = str(e).encode('ascii', 'ignore').decode('ascii')
        print(f"Failed to seed {company}: {safe_error}")

async def main():
    companies = ["TCS", "Infosys", "Wipro", "Amazon", "Generic"]
    for comp in companies:
        await seed_company_questions(comp)
    db.close()

if __name__ == "__main__":
    asyncio.run(main())
