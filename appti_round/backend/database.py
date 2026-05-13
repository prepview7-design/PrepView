from sqlalchemy import create_engine, Column, Integer, String, Text
from sqlalchemy.orm import declarative_base, sessionmaker
import os
import json

# Define the base directory relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "questions.db")

engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class QuestionDB(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    company = Column(String, index=True)      # e.g., "TCS", "Infosys", "Generic"
    category = Column(String, index=True)     # "Logical Reasoning", "Numerical Ability"
    difficulty = Column(String, index=True)   # "Easy", "Medium", "Hard"
    question_text = Column(Text, unique=True) # Text of the question (unique to prevent exact duplicates before ML kicks in)
    options_json = Column(Text)               # JSON string of options: [{'key': 'A', 'value': '10'}, ...]
    
    # Store the vector embedding as a JSON string to keep it simple with SQLite. 
    # For large scale, we would use pgvector or ChromaDB.
    embedding_json = Column(Text, nullable=True) 

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
