import os
import sys
import json
import requests
from bs4 import BeautifulSoup
from sentence_transformers import SentenceTransformer, util

# Ensure parent directory is in path to import backend
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from backend.database import SessionLocal, QuestionDB, init_db

# Load the ML Model for duplicate detection
print("Loading Sentence Transformer model for ML deduplication...")
model = SentenceTransformer('all-MiniLM-L6-v2')

def is_duplicate(new_question_text, db_session, threshold=0.90):
    """
    Uses ML embeddings to check if a semantically similar question already exists.
    """
    new_embedding = model.encode(new_question_text)
    
    # In a real massive DB, we'd use a Vector DB (FAISS/Chroma). 
    # For SQLite, we pull recent questions and compare.
    existing_questions = db_session.query(QuestionDB).all()
    
    for eq in existing_questions:
        if eq.embedding_json:
            existing_emb = json.loads(eq.embedding_json)
            # Calculate cosine similarity
            similarity = util.cos_sim(new_embedding, existing_emb).item()
            if similarity >= threshold:
                return True, similarity
    return False, 0.0

def scrape_and_process(url, company_name, category, difficulty):
    """
    A specific scraping pipeline for IndiaBix structure.
    """
    print(f"Scraping PYQs for {company_name} from {url}...")
    try:
        response = requests.get(url, headers={'User-Agent': 'Mozilla/5.0'})
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # IndiaBix question container
        question_blocks = soup.find_all('div', class_='bix-div-container') 
        
        db = SessionLocal()
        added_count = 0
        duplicate_count = 0
        
        for block in question_blocks:
            q_text_elem = block.find('div', class_='bix-td-qtxt')
            if not q_text_elem: continue
            question_text = q_text_elem.get_text(strip=True)
            
            # ML Deduplication
            is_dup, sim_score = is_duplicate(question_text, db)
            if is_dup:
                print(f"Skipping duplicate (Similarity: {sim_score:.2f}): {question_text[:30]}...")
                duplicate_count += 1
                continue
                
            # Extract options
            options = []
            opt_rows = block.find_all('div', class_='bix-opt-row')
            keys = ['A', 'B', 'C', 'D']
            for i, row in enumerate(opt_rows[:4]):
                val_elem = row.find('div', class_='bix-td-option-val')
                if val_elem:
                    options.append({'key': keys[i], 'value': val_elem.get_text(strip=True)})
            
            while len(options) < 4:
                options.append({'key': keys[len(options)], 'value': 'None'})
                
            # Extract correct answer
            correct_key = "A"
            ans_input = block.find('input', class_='jq-hdnakq')
            if ans_input and ans_input.get('value'):
                correct_key = ans_input.get('value')
                
            # Extract explanation
            explanation = ""
            exp_elem = block.find('div', class_='bix-ans-description')
            if exp_elem:
                explanation = exp_elem.get_text(strip=True)
            
            # Generate ML embedding
            embedding = model.encode(question_text).tolist()
            
            new_q = QuestionDB(
                company=company_name,
                category=category,
                difficulty=difficulty,
                question_text=question_text,
                options_json=json.dumps(options),
                embedding_json=json.dumps(embedding)
            )
            db.add(new_q)
            added_count += 1
            
        db.commit()
        db.close()
        print(f"Scraping complete. Added: {added_count}, Duplicates skipped: {duplicate_count}")
        
    except Exception as e:
        print(f"Failed to scrape {url}: {e}")

if __name__ == "__main__":
    init_db()
    # Let's scrape some real IndiaBix data and assign it to TCS for demonstration
    scrape_and_process("https://www.indiabix.com/logical-reasoning/number-series/", "TCS", "Logical Reasoning", "Medium")
