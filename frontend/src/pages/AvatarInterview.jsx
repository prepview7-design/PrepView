import React, { useState, useRef } from 'react';
import { Mic, Square, Play, Loader2, Award, User, Bot, StopCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function AvatarInterview() {
  const [role, setRole] = useState('Campus Level Intern');
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioElementRef = useRef(new Audio());

  const playAudio = (base64String) => {
    if (!base64String) return;
    const audioSrc = `data:audio/mp3;base64,${base64String}`;
    audioElementRef.current.src = audioSrc;
    audioElementRef.current.play().catch(e => console.error("Error playing audio", e));
  };

  const handleStart = async () => {
    setIsLoading(true);
    setMessages([]);
    setEvaluation(null);
    try {
      const response = await fetch(`${API_URL}/api/avatar_interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to start interview');
      
      setSessionId(data.session_id);
      setMessages([{ sender: 'ai', text: data.text }]);
      playAudio(data.audio_b64);
      toast.success('Interview started!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = handleAudioSubmit;
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      toast.error('Microphone access denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleAudioSubmit = async () => {
    if (!sessionId) return;
    
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('audio', audioBlob, 'user_audio.wav');

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/avatar_interview/chat`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to send message');
      
      if (data.error) {
        toast.error(data.error);
        return;
      }

      setMessages(prev => [
        ...prev, 
        { sender: 'user', text: data.user_text },
        { sender: 'ai', text: data.text }
      ]);
      playAudio(data.audio_b64);

    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEvaluate = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    audioElementRef.current.pause(); // Stop AI speaking if evaluating
    try {
      const response = await fetch(`${API_URL}/api/evaluations/interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ session_id: sessionId, role: role }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to evaluate interview');
      
      setEvaluation(data);
      toast.success('Interview evaluation complete!');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8" style={{ marginTop: '80px' }}>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-gray-900">AI Voice Interview</h1>
        <p className="mt-2 text-gray-600">Have a real-time voice conversation with our AI Interviewer.</p>
      </div>

      {!sessionId && !evaluation && (
        <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100 max-w-md mx-auto">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Campus Level Intern">Campus Level Intern</option>
                <option value="Senior Developer">Senior Developer</option>
                <option value="ML Engineer">ML Engineer</option>
                <option value="Data Scientist">Data Scientist</option>
              </select>
            </div>
            <button
              onClick={handleStart}
              disabled={isLoading}
              className="mt-4 w-full flex justify-center items-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-semibold disabled:opacity-50 transition"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {isLoading ? 'Starting...' : 'Start Interview'}
            </button>
          </div>
        </div>
      )}

      {sessionId && !evaluation && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Avatar Area */}
          <div className="w-full lg:w-1/3 flex flex-col items-center justify-start bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="w-48 h-48 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center border-4 border-white shadow-lg mb-6 overflow-hidden relative">
              <Bot className={`w-24 h-24 text-blue-600 ${!isLoading && !isRecording ? 'animate-pulse' : ''}`} />
              {isLoading && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 text-center">AI Interviewer</h3>
            <p className="text-sm text-gray-500 text-center mb-8">{role}</p>

            <div className="flex flex-col w-full gap-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition shadow-md disabled:opacity-50"
                >
                  <Mic className="w-6 h-6" /> Talk
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition shadow-md animate-pulse"
                >
                  <StopCircle className="w-6 h-6" /> Stop & Send
                </button>
              )}

              <button
                onClick={handleEvaluate}
                disabled={isLoading || isRecording}
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gray-800 hover:bg-gray-900 text-white font-semibold transition disabled:opacity-50"
              >
                End Interview & Evaluate
              </button>
            </div>
          </div>

          {/* Chat Transcript Area */}
          <div className="w-full lg:w-2/3 bg-gray-50 rounded-2xl p-6 border border-gray-200 h-[600px] flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Conversation Transcript</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-end gap-2 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-indigo-600'}`}>
                      {msg.sender === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
                    </div>
                    <div className={`p-4 rounded-2xl ${
                      msg.sender === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-white text-gray-800 border shadow-sm rounded-bl-none'
                    }`}>
                      <p className="text-sm md:text-base whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                 <div className="flex justify-start">
                   <div className="bg-gray-200 rounded-full px-4 py-2 flex gap-1">
                     <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                     <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></span>
                     <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></span>
                   </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      {evaluation && (
         <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 max-w-3xl mx-auto animate-fade-in">
           <div className="flex items-center gap-4 mb-6 border-b pb-4">
             <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
               <Award className="w-8 h-8" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-gray-900">Evaluation Results</h2>
               <p className="text-gray-500">Based on your {role} interview</p>
             </div>
           </div>

           <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                 <h3 className="text-lg font-bold text-gray-900 mb-2">Probability of Selection</h3>
                 <div className="text-4xl font-extrabold text-blue-600">{evaluation.probability_of_selection}</div>
               </div>
             </div>

             <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
               <h3 className="text-lg font-bold text-blue-900 mb-2">Feedback</h3>
               <p className="text-blue-800 whitespace-pre-wrap">{evaluation.feedback}</p>
             </div>

             <button
               onClick={() => { setSessionId(null); setEvaluation(null); setMessages([]); }}
               className="mt-6 bg-gray-900 text-white px-6 py-3 rounded-lg font-semibold hover:bg-gray-800 transition w-full"
             >
               Start New Interview
             </button>
           </div>
         </div>
      )}

    </div>
  );
}
