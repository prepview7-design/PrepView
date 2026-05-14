import streamlit as st
import requests
import base64
from audio_recorder_streamlit import audio_recorder
import os

st.set_page_config(page_title="AI Avatar Interviewer", layout="centered", page_icon="🤖")

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

st.title("🤖 AI Avatar Interviewer")

# Show avatar
import os
avatar_path = os.path.join(os.path.dirname(__file__), "ai_avatar.png")
if os.path.exists(avatar_path):
    st.image(avatar_path, use_container_width=True)

if not st.session_state.interview_active and st.session_state.evaluation is None:
    role = st.selectbox("Select Role for Interview", ["On-Campus", "Senior Developer", "ML Engineer"])
    if st.button("Start Interview", type="primary"):
        with st.spinner("Initializing AI Interviewer..."):
            try:
                res = requests.post(f"{API_URL}/start", json={"role": role}).json()
                st.session_state.session_id = res["session_id"]
                st.session_state.chat_history.append({"role": "AI", "content": res["text"]})
                st.session_state.audio_to_play = res["audio_b64"]
                st.session_state.interview_active = True
                st.rerun()
            except Exception as e:
                st.error(f"Failed to connect to backend. Make sure FastAPI is running. Error: {e}")

if st.session_state.interview_active:
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
    
    col1, col2 = st.columns(2)
    with col1:
        if audio_bytes:
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
    prob = eval_data.get("probability", 0)
    
    st.metric(label="Probability of Selection", value=f"{prob}%")
    st.progress(prob / 100.0)
    st.write("**Feedback:**")
    st.info(eval_data.get("feedback", "No feedback available."))
    
    if st.button("Start New Interview"):
        st.session_state.clear()
        st.rerun()
