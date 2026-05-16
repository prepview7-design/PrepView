import streamlit as st
import requests
import base64
from audio_recorder_streamlit import audio_recorder
import os
import time

st.set_page_config(page_title="Voice AI Interviewer", layout="centered", page_icon="🤖")

API_URL = "http://localhost:8000"

def autoplay_audio(base64_audio: str):
    audio_html = f'<audio autoplay="true" src="data:audio/mp3;base64,{base64_audio}"></audio>'
    st.markdown(audio_html, unsafe_allow_html=True)

if "session_id" not in st.session_state:
    st.session_state.session_id = None
if "chat_history" not in st.session_state:
    st.session_state.chat_history = []
if "audio_to_play" not in st.session_state:
    st.session_state.audio_to_play = None
if "interview_active" not in st.session_state:
    st.session_state.interview_active = False
if "evaluation" not in st.session_state:
    st.session_state.evaluation = None
if "start_time" not in st.session_state:
    st.session_state.start_time = None

st.title("🤖 Voice AI Interviewer")

if not st.session_state.interview_active and st.session_state.evaluation is None:
    st.write("Welcome to your Fresher Software Engineer interview.")
    if st.button("Start Interview", type="primary"):
        with st.spinner("Initializing AI Interviewer..."):
            try:
                res = requests.post(f"{API_URL}/start", json={"role": "Fresher Software Engineer"}).json()
                st.session_state.session_id = res["session_id"]
                st.session_state.chat_history.append({"role": "AI", "content": res["text"]})
                st.session_state.audio_to_play = res["audio_b64"]
                st.session_state.interview_active = True
                st.session_state.start_time = time.time()
                st.rerun()
            except Exception as e:
                st.error(f"Failed to connect to backend. Make sure FastAPI is running. Error: {e}")

if st.session_state.interview_active:
    if st.session_state.start_time is None:
        st.session_state.start_time = time.time()
        
    elapsed_time = time.time() - st.session_state.start_time
    remaining_time = max(0, 15 * 60 - elapsed_time)
    mins, secs = divmod(int(remaining_time), 60)
    
    st.markdown(f"**⏱️ Time Remaining:** `{mins:02d}:{secs:02d}` / 15:00")
    
    if remaining_time == 0:
        st.warning("Time is up! Evaluating interview...")
        st.session_state.interview_active = False
        try:
            data = {"session_id": st.session_state.session_id}
            res = requests.post(f"{API_URL}/evaluate", data=data).json()
            st.session_state.evaluation = res
            st.rerun()
        except Exception as e:
            st.error(f"Evaluation error: {e}")
            st.session_state.interview_active = True
            
    # Play current audio if any
    if st.session_state.audio_to_play:
        autoplay_audio(st.session_state.audio_to_play)
        st.session_state.audio_to_play = None

    # Display chat
    st.write("---")
    for msg in st.session_state.chat_history:
        if msg["role"] == "AI":
            st.chat_message("assistant").write(msg["content"])
        else:
            st.chat_message("user").write(msg["content"])
        
    st.write("---")
    st.write("🎤 **Your Turn** (Speak your answer)")
    audio_bytes = audio_recorder(text="Click to record", recording_color="#e83e8c", neutral_color="#6c757d")
    
    if "last_audio" not in st.session_state:
        st.session_state.last_audio = None
        
    col1, col2 = st.columns(2)
    with col1:
        if audio_bytes and audio_bytes != st.session_state.last_audio:
            st.session_state.last_audio = audio_bytes
            with st.spinner("Processing your answer..."):
                try:
                    files = {"audio": ("answer.wav", audio_bytes, "audio/wav")}
                    data = {"session_id": st.session_state.session_id}
                    res = requests.post(f"{API_URL}/chat", data=data, files=files).json()
                    
                    if "error" in res:
                        st.error(res["error"])
                    else:
                        st.session_state.chat_history.append({"role": "You", "content": res["user_text"]})
                        st.session_state.chat_history.append({"role": "AI", "content": res["text"]})
                        st.session_state.audio_to_play = res["audio_b64"]
                        st.rerun()
                except Exception as e:
                    st.error(f"Error communicating with backend: {e}")
                    
    with col2:
        if st.button("End Interview & Get Results", type="primary"):
            st.session_state.interview_active = False
            with st.spinner("Evaluating your performance..."):
                try:
                    data = {"session_id": st.session_state.session_id}
                    res = requests.post(f"{API_URL}/evaluate", data=data).json()
                    st.session_state.evaluation = res
                    st.rerun()
                except Exception as e:
                    st.error(f"Evaluation error: {e}")
                    st.session_state.interview_active = True

if st.session_state.evaluation:
    st.success("Interview Completed!")
    st.subheader("Performance Dashboard")
    eval_data = st.session_state.evaluation
    try:
        prob_val = float(eval_data.get("probability", 0))
    except ValueError:
        prob_val = 0.0
    prob_clamped = min(1.0, max(0.0, prob_val / 100.0))
    
    st.metric(label="Probability of Selection", value=f"{prob_val}%")
    st.progress(prob_clamped)
    st.write("**Feedback:**")
    st.info(eval_data.get("feedback", "No feedback available."))
    
    if st.button("Start New Interview"):
        st.session_state.clear()
        st.rerun()
