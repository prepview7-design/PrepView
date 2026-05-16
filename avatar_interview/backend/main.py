import os
import uuid
import base64
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
try:
    from backend.ai_service import (
        generate_system_prompt,
        get_next_response,
        transcribe_audio,
        generate_speech,
        evaluate_interview
    )
except ModuleNotFoundError:
    from ai_service import (
        generate_system_prompt,
        get_next_response,
        transcribe_audio,
        generate_speech,
        evaluate_interview
    )

app = FastAPI(title="AI Avatar Interview API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory session store (Use a proper DB for production)
sessions = {}

class StartRequest(BaseModel):
    role: str

def encode_audio(file_path: str) -> str:
    if not os.path.exists(file_path):
        return ""
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode('utf-8')

@app.post("/start")
async def start_interview(req: StartRequest):
    session_id = str(uuid.uuid4())
    system_prompt = generate_system_prompt(req.role)
    
    messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    ai_response_text = get_next_response(messages)
    messages.append({"role": "assistant", "content": ai_response_text})
    sessions[session_id] = messages
    
    # Generate audio
    audio_path = f"temp_{session_id}.mp3"
    generate_speech(ai_response_text, audio_path)
    
    audio_b64 = encode_audio(audio_path)
    if os.path.exists(audio_path):
        os.remove(audio_path)
        
    return {
        "session_id": session_id,
        "text": ai_response_text,
        "audio_b64": audio_b64
    }

@app.post("/chat")
async def chat(session_id: str = Form(...), audio: UploadFile = File(...)):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = sessions[session_id]
    
    # Save uploaded user audio
    user_audio_path = f"user_{session_id}.wav"
    with open(user_audio_path, "wb") as f:
        f.write(await audio.read())
        
    # Transcribe
    user_text = transcribe_audio(user_audio_path)
    if os.path.exists(user_audio_path):
        os.remove(user_audio_path)
        
    if not user_text.strip():
        return {"error": "Could not understand audio.", "text": "Could not understand audio. Please try again."}
        
    messages.append({"role": "user", "content": user_text})
    
    # Get AI Response
    ai_response_text = get_next_response(messages)
    messages.append({"role": "assistant", "content": ai_response_text})
    
    # Generate audio
    ai_audio_path = f"ai_{session_id}.mp3"
    generate_speech(ai_response_text, ai_audio_path)
    
    audio_b64 = encode_audio(ai_audio_path)
    if os.path.exists(ai_audio_path):
        os.remove(ai_audio_path)
        
    return {
        "user_text": user_text,
        "text": ai_response_text,
        "audio_b64": audio_b64
    }

@app.post("/evaluate")
async def evaluate(session_id: str = Form(...)):
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
        
    messages = sessions[session_id]
    result = evaluate_interview(messages)
    
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8002, reload=True)
