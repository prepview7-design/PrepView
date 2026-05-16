import React, { useState, useRef } from 'react';

import {
  Mic,
  Play,
  Loader2,
  Award,
  User,
  Bot,
  StopCircle,
  BrainCircuit,
  Volume2,
  Sparkles,
  Clock3,
  CheckCircle2,
} from 'lucide-react';

import toast from 'react-hot-toast';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

export default function AvatarInterview() {
  const [role, setRole] = useState(
    'Campus Level Intern'
  );

  const [sessionId, setSessionId] =
    useState(null);

  const [messages, setMessages] = useState(
    []
  );

  const [isRecording, setIsRecording] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  const [evaluation, setEvaluation] =
    useState(null);

  const mediaRecorderRef = useRef(null);

  const audioChunksRef = useRef([]);

  const audioElementRef = useRef(
    new Audio()
  );

  const playAudio = (base64String) => {
    if (!base64String) return;

    const audioSrc = `data:audio/mp3;base64,${base64String}`;

    audioElementRef.current.src = audioSrc;

    audioElementRef.current
      .play()
      .catch((e) =>
        console.error(
          'Error playing audio',
          e
        )
      );
  };

  const handleStart = async () => {
    setIsLoading(true);

    setMessages([]);

    setEvaluation(null);

    try {
      const response = await fetch(
        `${API_URL}/api/avatar_interview/start`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({ role }),
        }
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(
          data.detail ||
            'Failed to start interview'
        );

      setSessionId(data.session_id);

      setMessages([
        {
          sender: 'ai',
          text: data.text,
        },
      ]);

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
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      mediaRecorderRef.current =
        new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable =
        (e) => {
          if (e.data.size > 0)
            audioChunksRef.current.push(
              e.data
            );
        };

      mediaRecorderRef.current.onstop =
        handleAudioSubmit;

      mediaRecorderRef.current.start();

      setIsRecording(true);
    } catch (err) {
      toast.error(
        'Microphone access denied or unavailable.'
      );
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      isRecording
    ) {
      mediaRecorderRef.current.stop();

      setIsRecording(false);

      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  const handleAudioSubmit = async () => {
    if (!sessionId) return;

    const audioBlob = new Blob(
      audioChunksRef.current,
      {
        type: 'audio/wav',
      }
    );

    const formData = new FormData();

    formData.append(
      'session_id',
      sessionId
    );

    formData.append(
      'audio',
      audioBlob,
      'user_audio.wav'
    );

    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/avatar_interview/chat`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(
          data.detail ||
            'Failed to send message'
        );

      if (data.error) {
        toast.error(data.error);

        return;
      }

      setMessages((prev) => [
        ...prev,

        {
          sender: 'user',
          text: data.user_text,
        },

        {
          sender: 'ai',
          text: data.text,
        },
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

    audioElementRef.current.pause();

    try {
      const response = await fetch(
        `${API_URL}/api/evaluations/interview`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          credentials: 'include',

          body: JSON.stringify({
            session_id: sessionId,
            role: role,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(
          data.detail ||
            'Failed to evaluate interview'
        );

      setEvaluation(data);

      toast.success(
        'Interview evaluation complete!'
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HERO */}
        <div style={styles.hero}>

          <div style={styles.heroLeft}>

            <div style={styles.logoBox}>
              <BrainCircuit
                size={34}
                color="#60A5FA"
              />
            </div>

            <div>
              <h1 style={styles.title}>
                AI Voice Interview
              </h1>

              <p style={styles.subtitle}>
                Practice realistic AI-powered
                mock interviews with voice
                interaction and instant
                evaluation.
              </p>
            </div>
          </div>

          <div style={styles.heroBadge}>
            <Sparkles size={18} />

            AI Powered
          </div>
        </div>

        {/* START SCREEN */}
        {!sessionId && !evaluation && (
          <div style={styles.startWrapper}>

            <div style={styles.startCard}>

              <div style={styles.startTop}>
                <Bot
                  size={50}
                  color="#60A5FA"
                />

                <h2 style={styles.startTitle}>
                  Start Your Interview
                </h2>

                <p
                  style={
                    styles.startSubtitle
                  }
                >
                  Choose a role and begin your
                  AI mock interview session.
                </p>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>
                  Select Role
                </label>

                <select
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value)
                  }
                  style={styles.select}
                >
                  <option value="Campus Level Intern">
                    Campus Level Intern
                  </option>

                  <option value="Senior Developer">
                    Senior Developer
                  </option>

                  <option value="ML Engineer">
                    ML Engineer
                  </option>

                  <option value="Data Scientist">
                    Data Scientist
                  </option>
                </select>
              </div>

              <button
                onClick={handleStart}
                disabled={isLoading}
                style={styles.startButton}
              >
                {isLoading ? (
                  <Loader2
                    size={20}
                    className="spin"
                  />
                ) : (
                  <Play size={20} />
                )}

                {isLoading
                  ? 'Starting...'
                  : 'Start Interview'}
              </button>
            </div>
          </div>
        )}

        {/* INTERVIEW */}
        {sessionId && !evaluation && (
          <div style={styles.interviewGrid}>

            {/* LEFT PANEL */}
            <div style={styles.avatarPanel}>

              <div style={styles.avatarWrapper}>

                <div
                  style={{
                    ...styles.avatarGlow,

                    animation:
                      isLoading ||
                      isRecording
                        ? 'pulse 2s infinite'
                        : 'none',
                  }}
                ></div>

                <div style={styles.avatarCircle}>
                  <Bot
                    size={100}
                    color="#60A5FA"
                  />
                </div>
              </div>

              <h2 style={styles.aiName}>
                AI Interviewer
              </h2>

              <p style={styles.aiRole}>
                {role}
              </p>

              {/* STATUS */}
              <div style={styles.statusBox}>

                {isLoading ? (
                  <>
                    <Loader2
                      size={18}
                      className="spin"
                    />

                    AI Processing...
                  </>
                ) : isRecording ? (
                  <>
                    <Mic size={18} />

                    Listening...
                  </>
                ) : (
                  <>
                    <Volume2 size={18} />

                    Ready
                  </>
                )}
              </div>

              {/* BUTTONS */}
              <div style={styles.actionButtons}>

                {!isRecording ? (
                  <button
                    onClick={startRecording}
                    disabled={isLoading}
                    style={
                      styles.recordButton
                    }
                  >
                    <Mic size={20} />

                    Talk
                  </button>
                ) : (
                  <button
                    onClick={stopRecording}
                    style={
                      styles.stopButton
                    }
                  >
                    <StopCircle
                      size={20}
                    />

                    Stop & Send
                  </button>
                )}

                <button
                  onClick={handleEvaluate}
                  disabled={
                    isLoading ||
                    isRecording
                  }
                  style={
                    styles.evaluateButton
                  }
                >
                  <CheckCircle2
                    size={20}
                  />

                  End & Evaluate
                </button>
              </div>
            </div>

            {/* CHAT PANEL */}
            <div style={styles.chatPanel}>

              <div style={styles.chatHeader}>

                <div>
                  <h3 style={styles.chatTitle}>
                    Conversation Transcript
                  </h3>

                  <p
                    style={
                      styles.chatSubtitle
                    }
                  >
                    Real-time AI interview
                    interaction
                  </p>
                </div>

                <div style={styles.liveBox}>
                  <Clock3 size={16} />

                  Live Session
                </div>
              </div>

              {/* CHAT */}
              <div style={styles.messagesWrapper}>

                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.messageRow,

                      justifyContent:
                        msg.sender ===
                        'user'
                          ? 'flex-end'
                          : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        ...styles.messageBubble,

                        background:
                          msg.sender ===
                          'user'
                            ? '#2563EB'
                            : '#111827',

                        border:
                          msg.sender ===
                          'user'
                            ? 'none'
                            : '1px solid #1E293B',
                      }}
                    >
                      <div
                        style={
                          styles.messageTop
                        }
                      >
                        {msg.sender ===
                        'user' ? (
                          <User
                            size={16}
                          />
                        ) : (
                          <Bot
                            size={16}
                          />
                        )}

                        <span>
                          {msg.sender ===
                          'user'
                            ? 'You'
                            : 'AI'}
                        </span>
                      </div>

                      <div
                        style={
                          styles.messageText
                        }
                      >
                        {msg.text}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div
                    style={
                      styles.loadingBubble
                    }
                  >
                    <div
                      style={
                        styles.loadingDot
                      }
                    ></div>

                    <div
                      style={
                        styles.loadingDot
                      }
                    ></div>

                    <div
                      style={
                        styles.loadingDot
                      }
                    ></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* RESULTS */}
        {evaluation && (
          <div style={styles.resultCard}>

            <div style={styles.resultTop}>

              <div style={styles.resultIcon}>
                <Award
                  size={36}
                  color="#2563EB"
                />
              </div>

              <div>
                <h2 style={styles.resultTitle}>
                  Interview Evaluation
                </h2>

                <p
                  style={
                    styles.resultSubtitle
                  }
                >
                  AI-generated performance
                  review
                </p>
              </div>
            </div>

            <div style={styles.scoreCard}>

              <div
                style={styles.scoreLabel}
              >
                Probability of Selection
              </div>

              <div style={styles.score}>
                {
                  evaluation.probability_of_selection
                }
              </div>
            </div>

            <div style={styles.feedbackBox}>

              <h3
                style={styles.feedbackTitle}
              >
                AI Feedback
              </h3>

              <p style={styles.feedback}>
                {evaluation.feedback}
              </p>
            </div>

            <button
              onClick={() => {
                setSessionId(null);

                setEvaluation(null);

                setMessages([]);
              }}
              style={styles.retryButton}
            >
              Start New Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',

    background:
      'linear-gradient(180deg, #081028 0%, #0F172A 100%)',

    padding: '110px 28px 40px',

    fontFamily: 'Inter, sans-serif',
  },

  container: {
    maxWidth: '1500px',

    margin: '0 auto',
  },

  hero: {
    display: 'flex',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: '34px',

    flexWrap: 'wrap',

    gap: '20px',
  },

  heroLeft: {
    display: 'flex',

    alignItems: 'center',

    gap: '18px',
  },

  logoBox: {
    width: '72px',

    height: '72px',

    borderRadius: '24px',

    background:
      'rgba(37,99,235,0.12)',

    border:
      '1px solid rgba(37,99,235,0.2)',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',
  },

  title: {
    fontSize: '48px',

    color: '#FFFFFF',

    margin: 0,

    fontWeight: 800,
  },

  subtitle: {
    color: '#94A3B8',

    marginTop: '8px',

    fontSize: '15px',

    lineHeight: 1.7,
  },

  heroBadge: {
    display: 'flex',

    alignItems: 'center',

    gap: '10px',

    background: '#111827',

    border: '1px solid #1E293B',

    padding: '14px 18px',

    borderRadius: '18px',

    color: '#FFFFFF',

    fontWeight: 600,
  },

  startWrapper: {
    display: 'flex',

    justifyContent: 'center',

    alignItems: 'center',

    paddingTop: '40px',
  },

  startCard: {
    width: '500px',

    background: '#111827',

    border: '1px solid #1E293B',

    borderRadius: '34px',

    padding: '40px',

    boxShadow:
      '0 20px 60px rgba(0,0,0,0.35)',
  },

  startTop: {
    textAlign: 'center',

    marginBottom: '34px',
  },

  startTitle: {
    color: '#FFFFFF',

    fontSize: '34px',

    marginTop: '18px',

    marginBottom: '10px',
  },

  startSubtitle: {
    color: '#94A3B8',

    lineHeight: 1.7,
  },

  inputGroup: {
    marginBottom: '24px',
  },

  label: {
    display: 'block',

    marginBottom: '10px',

    color: '#CBD5E1',

    fontWeight: 600,
  },

  select: {
    width: '100%',

    padding: '16px',

    borderRadius: '18px',

    background: '#0F172A',

    border: '1px solid #334155',

    color: '#FFFFFF',

    outline: 'none',

    fontSize: '15px',
  },

  startButton: {
    width: '100%',

    padding: '16px',

    borderRadius: '18px',

    border: 'none',

    background: '#2563EB',

    color: '#FFFFFF',

    fontWeight: 700,

    fontSize: '16px',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    gap: '12px',

    cursor: 'pointer',

    boxShadow:
      '0 10px 30px rgba(37,99,235,0.3)',
  },

  interviewGrid: {
    display: 'grid',

    gridTemplateColumns: '420px 1fr',

    gap: '28px',
  },

  avatarPanel: {
    background: '#111827',

    border: '1px solid #1E293B',

    borderRadius: '34px',

    padding: '36px',

    display: 'flex',

    flexDirection: 'column',

    alignItems: 'center',

    boxShadow:
      '0 20px 60px rgba(0,0,0,0.35)',
  },

  avatarWrapper: {
    position: 'relative',

    marginBottom: '28px',
  },

  avatarGlow: {
    position: 'absolute',

    inset: '-20px',

    borderRadius: '50%',

    background:
      'radial-gradient(circle, rgba(37,99,235,0.25) 0%, transparent 70%)',
  },

  avatarCircle: {
    width: '220px',

    height: '220px',

    borderRadius: '50%',

    background:
      'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    position: 'relative',

    zIndex: 2,

    boxShadow:
      '0 20px 50px rgba(37,99,235,0.35)',
  },

  aiName: {
    color: '#FFFFFF',

    fontSize: '28px',

    fontWeight: 700,

    marginBottom: '8px',
  },

  aiRole: {
    color: '#94A3B8',

    marginBottom: '24px',
  },

  statusBox: {
    display: 'flex',

    alignItems: 'center',

    gap: '10px',

    background: '#0F172A',

    border: '1px solid #1E293B',

    padding: '14px 18px',

    borderRadius: '18px',

    color: '#FFFFFF',

    marginBottom: '30px',
  },

  actionButtons: {
    width: '100%',

    display: 'flex',

    flexDirection: 'column',

    gap: '16px',
  },

  recordButton: {
    width: '100%',

    padding: '18px',

    borderRadius: '18px',

    border: 'none',

    background: '#2563EB',

    color: '#FFFFFF',

    fontWeight: 700,

    fontSize: '16px',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    gap: '12px',

    cursor: 'pointer',
  },

  stopButton: {
    width: '100%',

    padding: '18px',

    borderRadius: '18px',

    border: 'none',

    background: '#EF4444',

    color: '#FFFFFF',

    fontWeight: 700,

    fontSize: '16px',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    gap: '12px',

    cursor: 'pointer',
  },

  evaluateButton: {
    width: '100%',

    padding: '16px',

    borderRadius: '18px',

    border: 'none',

    background: '#111827',

    color: '#FFFFFF',

    fontWeight: 700,

    border: '1px solid #334155',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    gap: '12px',

    cursor: 'pointer',
  },

  chatPanel: {
    background: '#111827',

    border: '1px solid #1E293B',

    borderRadius: '34px',

    overflow: 'hidden',

    display: 'flex',

    flexDirection: 'column',

    boxShadow:
      '0 20px 60px rgba(0,0,0,0.35)',
  },

  chatHeader: {
    padding: '24px 28px',

    borderBottom: '1px solid #1E293B',

    display: 'flex',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

  chatTitle: {
    color: '#FFFFFF',

    fontSize: '24px',

    marginBottom: '6px',
  },

  chatSubtitle: {
    color: '#94A3B8',
  },

  liveBox: {
    display: 'flex',

    alignItems: 'center',

    gap: '8px',

    background:
      'rgba(34,197,94,0.1)',

    border:
      '1px solid rgba(34,197,94,0.2)',

    color: '#4ADE80',

    padding: '10px 14px',

    borderRadius: '14px',

    fontSize: '14px',

    fontWeight: 600,
  },

  messagesWrapper: {
    flex: 1,

    overflowY: 'auto',

    padding: '28px',

    display: 'flex',

    flexDirection: 'column',

    gap: '20px',

    minHeight: '700px',
  },

  messageRow: {
    display: 'flex',
  },

  messageBubble: {
    maxWidth: '75%',

    padding: '18px',

    borderRadius: '22px',
  },

  messageTop: {
    display: 'flex',

    alignItems: 'center',

    gap: '8px',

    marginBottom: '10px',

    color: '#CBD5E1',

    fontSize: '13px',

    fontWeight: 700,
  },

  messageText: {
    color: '#FFFFFF',

    lineHeight: 1.8,

    fontSize: '15px',

    whiteSpace: 'pre-wrap',
  },

  loadingBubble: {
    display: 'flex',

    alignItems: 'center',

    gap: '8px',

    padding: '16px',

    width: 'fit-content',

    borderRadius: '999px',

    background: '#1E293B',
  },

  loadingDot: {
    width: '10px',

    height: '10px',

    borderRadius: '50%',

    background: '#94A3B8',
  },

  resultCard: {
    maxWidth: '900px',

    margin: '0 auto',

    background: '#111827',

    border: '1px solid #1E293B',

    borderRadius: '36px',

    padding: '40px',

    boxShadow:
      '0 20px 60px rgba(0,0,0,0.35)',
  },

  resultTop: {
    display: 'flex',

    alignItems: 'center',

    gap: '18px',

    marginBottom: '34px',
  },

  resultIcon: {
    width: '80px',

    height: '80px',

    borderRadius: '24px',

    background:
      'rgba(37,99,235,0.12)',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',
  },

  resultTitle: {
    color: '#FFFFFF',

    fontSize: '34px',

    marginBottom: '6px',
  },

  resultSubtitle: {
    color: '#94A3B8',
  },

  scoreCard: {
    background:
      'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',

    borderRadius: '28px',

    padding: '36px',

    textAlign: 'center',

    marginBottom: '28px',
  },

  scoreLabel: {
    color: '#E0E7FF',

    marginBottom: '14px',

    fontWeight: 600,
  },

  score: {
    fontSize: '72px',

    fontWeight: 800,

    color: '#FFFFFF',
  },

  feedbackBox: {
    background: '#0F172A',

    border: '1px solid #1E293B',

    borderRadius: '24px',

    padding: '28px',

    marginBottom: '28px',
  },

  feedbackTitle: {
    color: '#FFFFFF',

    marginBottom: '14px',

    fontSize: '22px',
  },

  feedback: {
    color: '#CBD5E1',

    lineHeight: 1.9,

    whiteSpace: 'pre-wrap',
  },

  retryButton: {
    width: '100%',

    padding: '18px',

    borderRadius: '18px',

    border: 'none',

    background: '#2563EB',

    color: '#FFFFFF',

    fontWeight: 700,

    fontSize: '16px',

    cursor: 'pointer',
  },
};