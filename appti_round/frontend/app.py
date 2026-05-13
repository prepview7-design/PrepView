import streamlit as st
import requests
import json
from datetime import datetime, timedelta
import time
import streamlit.components.v1 as components

# Configuration
API_BASE_URL = "http://localhost:8001/api"
TEST_DURATION_MINUTES = 60

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

def start_test(difficulty):
    with st.spinner(f"Generating 50 {difficulty} questions... This may take a minute or two."):
        try:
            response = requests.post(f"{API_BASE_URL}/generate-test", json={"difficulty": difficulty}, timeout=120)
            response.raise_for_status()
            data = response.json()
            st.session_state.questions = data.get("questions", [])
            st.session_state.test_started = True
            st.session_state.end_time = datetime.now() + timedelta(minutes=TEST_DURATION_MINUTES)
            st.session_state.answers = {q["id"]: None for q in st.session_state.questions}
        except requests.exceptions.RequestException as e:
            st.error(f"Error starting test: {e}")

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

st.title("🧠 AI Aptitude Test")

if not st.session_state.test_started:
    st.write("Welcome to the AI-generated Aptitude Test. You will have 60 minutes to complete 50 questions.")
    st.write("The test consists of Logical Reasoning and Numerical Ability questions.")
    
    difficulty = st.selectbox("Select Difficulty:", ["Easy", "Medium", "Hard"])
    
    if st.button("Start Test", type="primary"):
        st.session_state.difficulty = difficulty
        start_test(difficulty)
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
    st.sidebar.markdown(f"### ⏱️ Time Left: {mins:02d}:{secs:02d}")
    st.sidebar.progress(time_left.total_seconds() / (TEST_DURATION_MINUTES * 60))
    
    
    js_code = f"""
    <script>
        setTimeout(function() {{
            const buttons = window.parent.document.querySelectorAll('button');
            buttons.forEach(btn => {{
                if (btn.innerText === 'Submit Test') {{
                    btn.click();
                }}
            }});
        }}, {int(time_left.total_seconds() * 1000)});
    </script>
    """
    components.html(js_code, height=0, width=0)
    
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
        
        st.subheader("Detailed Review")
        
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
                        st.success(f"Correct! Explanation: {result['explanation']}")
                    else:
                        st.error(f"Incorrect. The correct option is **{result['correct_option']}**.")
                        st.write(f"**Explanation:** {result['explanation']}")
                else:
                    st.warning("Evaluation not available for this question.")
        
        if st.button("Start New Test"):
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            st.rerun()
    else:
        st.warning("Evaluation pending or failed.")
