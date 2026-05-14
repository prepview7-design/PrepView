import os
from groq import Groq
from dotenv import load_dotenv
from gtts import gTTS
from langsmith import traceable

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

@traceable(name="Generate System Prompt")
def generate_system_prompt(role: str) -> str:
    return f"""You are an expert AI interviewer conducting a real-time interview for a {role} position.
You must assess both HR and technical skills. 
Keep your questions concise and conversational, simulating a real interview.
Do not provide answers. Wait for the candidate to answer.
Ask only ONE question at a time. The first message should be a welcoming greeting followed by the first question."""

@traceable(name="Get Next Response")
def get_next_response(messages: list) -> str:
    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=messages,
            temperature=0.7,
            max_tokens=250
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Error calling Groq: {e}")
        return "I'm having trouble connecting right now. Could you please repeat that?"

@traceable(name="Transcribe Audio")
def transcribe_audio(audio_file_path: str) -> str:
    try:
        with open(audio_file_path, "rb") as audio_file:
            transcript = client.audio.transcriptions.create(
                model="whisper-large-v3",
                file=("audio.wav", audio_file.read()),
                response_format="json"
            )
        return transcript.text
    except Exception as e:
        print(f"Transcription error: {e}")
        return ""

def generate_speech(text: str, output_path: str):
    try:
        tts = gTTS(text=text, lang='en', slow=False)
        tts.save(output_path)
    except Exception as e:
        print(f"TTS error: {e}")

@traceable(name="Evaluate Interview")
def evaluate_interview(messages: list) -> dict:
    evaluation_prompt = {
        "role": "system",
        "content": "You are an expert technical and HR recruiter. Review the following interview transcript. Based on the candidate's answers, evaluate their performance and provide a final 'probability of selection' out of 100. Also provide brief feedback. Respond ONLY in strict JSON format: {\"probability\": 85, \"feedback\": \"Good technical skills, but needs better communication.\"}"
    }
    
    eval_messages = messages + [evaluation_prompt]
    try:
        response = client.chat.completions.create(
            model="llama3-8b-8192",
            messages=eval_messages,
            response_format={ "type": "json_object" },
            temperature=0.3
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Evaluation error: {e}")
        return {"probability": 0, "feedback": "Evaluation failed due to an error."}
