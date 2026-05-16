import streamlit as st
import requests
import json
from datetime import datetime, timedelta
import time
import streamlit.components.v1 as components

# Configuration
API_BASE_URL = "http://localhost:8000/api"
TEST_DURATION_MINUTES = 20

st.set_page_config(page_title="Aptitude Test", page_icon="⏱️", layout="wide")

def initialize_session():
    if "test_started" not in st.session_state:
        st.session_state.test_started = False
    if "questions" not in st.session_state:
        st.session_state.questions = []
    if "answers" not in st.session_state:
        st.session_state.answers = {}
    if "end_time" not in st.session_state:
        st.session_state.end_time = None
    if "submitted" not in st.session_state:
        st.session_state.submitted = False
    if "evaluation" not in st.session_state:
        st.session_state.evaluation = None

initialize_session()

def start_test(company, difficulty):
    with st.spinner(f"Fetching questions for {company}..."):
        try:
            response = requests.post(f"{API_BASE_URL}/generate-test", json={"company": company, "difficulty": difficulty}, timeout=120)
            response.raise_for_status()
            data = response.json()
            st.session_state.questions = data.get("questions", [])
            st.session_state.test_started = True
            st.session_state.end_time = datetime.now() + timedelta(minutes=TEST_DURATION_MINUTES)
            st.session_state.answers = {q["id"]: None for q in st.session_state.questions}
            return True
        except requests.exceptions.RequestException as e:
            st.error(f"Backend Connection Error: {e}")
            st.warning("Please make sure your FastAPI backend is running! (uvicorn backend.main:app --port 8001)")
            return False
        except Exception as e:
            st.error(f"Unexpected Error: {e}")
            return False

# ... (submit_test omitted for brevity, keeping original lines intact below it)

def submit_test():
    st.session_state.submitted = True
    answers_payload = [
        {"question_id": q_id, "selected_option": ans}
        for q_id, ans in st.session_state.answers.items()
        if ans is not None
    ]
    
    with st.spinner("Evaluating your answers..."):
        try:
            response = requests.post(
                f"{API_BASE_URL}/evaluate-test",
                json={
                    "difficulty": st.session_state.difficulty,
                    "questions": st.session_state.questions,
                    "answers": answers_payload
                },
                timeout=120
            )
            response.raise_for_status()
            st.session_state.evaluation = response.json()
        except requests.exceptions.RequestException as e:
            st.error(f"Error evaluating test: {e}")

# --- UI ---

st.title("🧠 AI Aptitude Test (Company Specific)")

if not st.session_state.test_started:
    st.write("Welcome to the AI-generated Aptitude Test. You will have 20 minutes to complete 20 questions.")
    st.write("Select a target company to get Previous Year Questions (PYQs).")
    
    col1, col2 = st.columns(2)
    with col1:
        company = st.selectbox("Select Target Company:", ["Generic", "TCS", "Infosys", "Wipro", "Amazon"])
    with col2:
        difficulty = st.selectbox("Select Difficulty:", ["Easy", "Medium", "Hard"])
    
    if st.button("Start Test", type="primary"):
        st.session_state.difficulty = difficulty
        st.session_state.company = company
        success = start_test(company, difficulty)
        if success:
            st.rerun()

elif st.session_state.test_started and not st.session_state.submitted:
    # Check Timer
    now = datetime.now()
    time_left = st.session_state.end_time - now
    
    if time_left.total_seconds() <= 0:
        st.warning("Time is up! Auto-submitting...")
        submit_test()
        st.rerun()
    
    mins, secs = divmod(int(time_left.total_seconds()), 60)
    
    # HTML/JS Ticking Timer
    timer_html = f"""
    <div style="font-family: sans-serif; padding: 10px; border-radius: 8px; background: #262730; color: white; text-align: center; border: 1px solid #4B4C53;">
        <h3 style="margin:0; font-size: 24px;">⏱️ <span id="timer">{mins:02d}:{secs:02d}</span></h3>
    </div>
    <script>
        var timeLeft = {int(time_left.total_seconds())};
        var timerElement = window.parent.document.getElementById('timer');
        if (!timerElement) {{
            // If parent document access is blocked, render it inside the iframe itself
            document.body.innerHTML = '<div style="font-family: sans-serif; padding: 10px; border-radius: 8px; background: #262730; color: white; text-align: center; border: 1px solid #4B4C53;"><h3 style="margin:0; font-size: 24px;">⏱️ <span id="inner_timer">{mins:02d}:{secs:02d}</span></h3></div>';
            timerElement = document.getElementById('inner_timer');
        }}
        var countdown = setInterval(function() {{
            if (timeLeft <= 0) {{
                clearInterval(countdown);
                const buttons = window.parent.document.querySelectorAll('button');
                buttons.forEach(btn => {{
                    if (btn.innerText === 'Submit Test') {{ btn.click(); }}
                }});
            }} else {{
                timeLeft--;
                var m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
                var s = (timeLeft % 60).toString().padStart(2, '0');
                if (timerElement) timerElement.innerText = m + ':' + s;
            }}
        }}, 1000);
    </script>
    """
    with st.sidebar:
        components.html(timer_html, height=80)
        st.progress(time_left.total_seconds() / (TEST_DURATION_MINUTES * 60))
        
    st.write(f"**Difficulty:** {st.session_state.difficulty}")
    
    
    with st.form("test_form"):
        for i, q in enumerate(st.session_state.questions):
            st.markdown(f"**Q{i+1} ({q['category']}):** {q['question']}")
            
            
            options_dict = {opt['key']: opt['value'] for opt in q['options']}
            display_options = [f"{k}. {v}" for k, v in options_dict.items()]
            
            
            selected = st.radio(
                "Select an option:",
                options=display_options,
                index=None,
                key=f"q_{q['id']}"
            )
            
            if selected:
                
                key = selected.split(". ")[0]
                st.session_state.answers[q['id']] = key
                
            st.divider()
            
        submitted = st.form_submit_button("Submit Test", type="primary")
        if submitted:
            submit_test()
            st.rerun()

elif st.session_state.submitted:
    st.header("Results 📊")
    
    if st.session_state.evaluation:
        eval_data = st.session_state.evaluation
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Score", f"{eval_data['total_score']} / {eval_data['max_score']}")
        with col2:
            percentage = (eval_data['total_score'] / eval_data['max_score']) * 100 if eval_data['max_score'] > 0 else 0
            st.metric("Percentage", f"{percentage:.2f}%")
            
        st.subheader("Summary")
        st.info(eval_data['summary'])
        
        st.subheader("Correct Answers")
        
        for q in st.session_state.questions:
            
            result = next((r for r in eval_data['results'] if r['question_id'] == q['id']), None)
            user_ans = st.session_state.answers.get(q['id'])
            
            with st.expander(f"Q{q['id']}: {q['question'][:50]}..."):
                st.write(f"**Question:** {q['question']}")
                
                
                for opt in q['options']:
                    st.write(f"- {opt['key']}: {opt['value']}")
                
                st.write("---")
                st.write(f"**Your Answer:** {user_ans if user_ans else 'Not answered'}")
                
                if result:
                    if result['is_correct']:
                        st.success(f"Correct!")
                    else:
                        st.error(f"Incorrect. The correct option is **{result['correct_option']}**.")
                else:
                    st.warning("Evaluation not available for this question.")
        
        if st.button("Start New Test"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()
    else:
        st.warning("Evaluation pending or failed.")
