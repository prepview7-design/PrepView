import React, { useEffect, useState } from 'react';
import {
  Play,
  CheckCircle,
  FileText,
  Loader2,
  Clock3,
  ChevronLeft,
  ChevronRight,
  BrainCircuit,
} from 'lucide-react';

import toast from 'react-hot-toast';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000';

export default function ApptiRound() {
  const [company, setCompany] =
    useState('Google');

  const [difficulty, setDifficulty] =
    useState('Medium');

  const [questions, setQuestions] = useState([]);

  const [answers, setAnswers] = useState({});

  const [evaluation, setEvaluation] =
    useState(null);

  const [isLoading, setIsLoading] =
    useState(false);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [timeLeft, setTimeLeft] = useState(1200);

  /* TIMER */
  useEffect(() => {
    if (!questions.length || evaluation) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [questions, evaluation]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);

    const secs = seconds % 60;

    return `${String(mins).padStart(
      2,
      '0'
    )}:${String(secs).padStart(2, '0')}`;
  };

  const handleGenerate = async () => {
    setIsLoading(true);

    setQuestions([]);

    setAnswers({});

    setEvaluation(null);

    setCurrentQuestion(0);

    setTimeLeft(1800);

    try {
      const response = await fetch(
        `${API_URL}/appti_round/api/generate-test`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          body: JSON.stringify({
            company,
            difficulty,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(
          data.detail ||
            'Failed to generate test'
        );

      setQuestions(data.questions);

      toast.success(
        'Test generated successfully!'
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionSelect = (
    questionId,
    optionKey
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionKey,
    }));
  };

  const handleSubmit = async () => {
    if (
      Object.keys(answers).length !==
      questions.length
    ) {
      toast.error(
        'Please answer all questions before submitting.'
      );

      return;
    }

    setIsLoading(true);

    try {
      const answersPayload =
        Object.keys(answers).map((qId) => ({
          question_id: qId,
          selected_option: answers[qId],
        }));

      const response = await fetch(
        `${API_URL}/appti_round/api/evaluate-test`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
          },

          credentials: 'include',

          body: JSON.stringify({
            difficulty,
            questions,
            answers: answersPayload,
            company,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok)
        throw new Error(
          data.detail ||
            'Failed to evaluate test'
        );

      setEvaluation(data);

      toast.success(
        'Test evaluated successfully!'
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const current =
    questions[currentQuestion];

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HEADER */}
        <div style={styles.header}>

          <div style={styles.headerLeft}>

            <div style={styles.logoBox}>
              <BrainCircuit
                size={28}
                color="#60A5FA"
              />
            </div>

            <div>
              <h1 style={styles.title}>
                Aptitude Round
              </h1>

              <p style={styles.subtitle}>
                AI-generated aptitude tests for
                company-specific preparation.
              </p>
            </div>
          </div>

          {questions.length > 0 &&
            !evaluation && (
              <div style={styles.timerBox}>

                <Clock3
                  size={20}
                  color="#FACC15"
                />

                <span style={styles.timerText}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            )}
        </div>

        {/* GENERATE SCREEN */}
        {!questions.length && !evaluation && (
          <div style={styles.generateWrapper}>

            <div style={styles.generateCard}>

              <div style={styles.generateTop}>
                <FileText
                  size={34}
                  color="#60A5FA"
                />

                <h2 style={styles.generateTitle}>
                  Generate Aptitude Test
                </h2>

                <p style={styles.generateSubtitle}>
                  Choose your target company and
                  difficulty level.
                </p>
              </div>

              {/* COMPANY */}
              <div style={styles.inputGroup}>

                <label style={styles.label}>
                  Target Company
                </label>

                <input
                  type="text"
                  value={company}
                  onChange={(e) =>
                    setCompany(e.target.value)
                  }
                  placeholder="Google, Amazon, TCS..."
                  style={styles.input}
                />
              </div>

              {/* DIFFICULTY */}
              <div style={styles.inputGroup}>

                <label style={styles.label}>
                  Difficulty
                </label>

                <select
                  value={difficulty}
                  onChange={(e) =>
                    setDifficulty(
                      e.target.value
                    )
                  }
                  style={styles.select}
                >
                  <option value="Easy">
                    Easy
                  </option>

                  <option value="Medium">
                    Medium
                  </option>

                  <option value="Hard">
                    Hard
                  </option>
                </select>
              </div>

              {/* BUTTON */}
              <button
                onClick={handleGenerate}
                disabled={
                  isLoading || !company
                }
                style={styles.generateButton}
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
                  ? 'Generating...'
                  : 'Generate Test'}
              </button>
            </div>
          </div>
        )}

        {/* TEST SCREEN */}
        {questions.length > 0 &&
          !evaluation && (
            <div style={styles.testLayout}>

              {/* LEFT SIDEBAR */}
              <div style={styles.sidebar}>

                <div style={styles.sidebarHeader}>
                  Questions
                </div>

                <div style={styles.questionNav}>
                  {questions.map((q, index) => (
                    <button
                      key={q.id}
                      onClick={() =>
                        setCurrentQuestion(
                          index
                        )
                      }
                      style={{
                        ...styles.questionButton,

                        background:
                          currentQuestion ===
                          index
                            ? '#2563EB'
                            : answers[q.id]
                            ? '#22C55E'
                            : '#111827',
                      }}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* MAIN QUESTION */}
              <div style={styles.mainPanel}>

                {/* TOP */}
                <div style={styles.questionTop}>

                  <div>
                    <div
                      style={
                        styles.questionNumber
                      }
                    >
                      Question{' '}
                      {currentQuestion + 1}
                    </div>

                    <h2
                      style={
                        styles.questionText
                      }
                    >
                      {
                        current?.question
                      }
                    </h2>
                  </div>

                  <div
                    style={styles.difficultyBadge}
                  >
                    {difficulty}
                  </div>
                </div>

                {/* OPTIONS */}
                <div style={styles.optionsWrapper}>

                 {current &&
  current.options.map((option) => (
    <div
      key={option.key}
      onClick={() =>
        handleOptionSelect(
          current.id,
          option.key
        )
      }
      style={{
        ...styles.optionCard,

        border:
          answers[current.id] === option.key
            ? '2px solid #2563EB'
            : '1px solid #1E293B',

        background:
          answers[current.id] === option.key
            ? 'rgba(37,99,235,0.12)'
            : '#111827',
      }}
    >
      <div
        style={{
          ...styles.optionCircle,

          background:
            answers[current.id] === option.key
              ? '#2563EB'
              : '#1E293B',
        }}
      >
        {option.key}
      </div>

      <div style={styles.optionText}>
        {option.value}
      </div>
    </div>
  ))}
                </div>

                {/* NAVIGATION */}
                <div style={styles.bottomNav}>

                  <button
                    disabled={
                      currentQuestion === 0
                    }
                    onClick={() =>
                      setCurrentQuestion(
                        (prev) => prev - 1
                      )
                    }
                    style={{
                      ...styles.navButton,

                      opacity:
                        currentQuestion === 0
                          ? 0.5
                          : 1,
                    }}
                  >
                    <ChevronLeft size={18} />

                    Previous
                  </button>

                  {currentQuestion <
                  questions.length - 1 ? (
                    <button
                      onClick={() =>
                        setCurrentQuestion(
                          (prev) => prev + 1
                        )
                      }
                      style={
                        styles.nextButton
                      }
                    >
                      Next

                      <ChevronRight
                        size={18}
                      />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      style={
                        styles.submitButton
                      }
                    >
                      {isLoading ? (
                        <Loader2
                          size={18}
                          className="spin"
                        />
                      ) : (
                        <CheckCircle
                          size={18}
                        />
                      )}

                      Submit Test
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

        {/* RESULT SCREEN */}
        {evaluation && (
          <div style={styles.resultsPage}>

            {/* RESULT HERO */}
            <div style={styles.resultHero}>

              <h2 style={styles.resultTitle}>
                Aptitude Round Completed
              </h2>

              <div style={styles.score}>
                {evaluation.total_score} /{' '}
                {evaluation.max_score}
              </div>

              <p style={styles.feedback}>
                {
                  evaluation.summary
                }
              </p>

              <button
                onClick={() => {
                  setQuestions([]);

                  setEvaluation(null);

                  setAnswers({});

                  setCurrentQuestion(0);
                }}
                style={styles.retryButton}
              >
                Take Another Test
              </button>
            </div>

            {/* REVIEW */}
            <div style={styles.reviewSection}>

              <h3 style={styles.reviewTitle}>
                Detailed Review
              </h3>

              {evaluation.results.map(
                (res, idx) => (
                  <div
                    key={idx}
                    style={{
                      ...styles.reviewCard,

                      borderLeft:
                        res.is_correct
                          ? '5px solid #22C55E'
                          : '5px solid #EF4444',
                    }}
                  >
                    <div
                      style={
                        styles.reviewTop
                      }
                    >
                      <h4
                        style={
                          styles.reviewQuestion
                        }
                      >
                        {idx + 1}.{' '}
                        Question {res.question_id}  
                      </h4>

                      <div
                        style={{
                          ...styles.resultBadge,

                          background:
                            res.is_correct
                              ? '#DCFCE7'
                              : '#FEE2E2',

                          color:
                            res.is_correct
                              ? '#166534'
                              : '#991B1B',
                        }}
                      >
                        {res.is_correct
                          ? 'Correct'
                          : 'Incorrect'}
                      </div>
                    </div>

                    <div
                      style={
                        styles.answerGrid
                      }
                    >
                      

                      <div
                        style={{
                          ...styles.answerBox,

                          background:
                            '#EFF6FF',

                          border:
                            '1px solid #BFDBFE',
                        }}
                      >
                        <div
                          style={
                            styles.answerLabel
                          }
                        >
                          Correct Answer
                        </div>

                        <div
                          style={
                            styles.answerValue
                          }
                        >
                          {
                            res.correct_option
                          }
                        </div>
                      </div>
                    </div>

                    <div
                      style={
                        styles.explanationBox
                      }
                    >
                      <div
                        style={
                          styles.answerLabel
                        }
                      >
                        Explanation
                      </div>

                      <div
                        style={
                          styles.explanation
                        }
                      >
                        {res.explanation}
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
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

  header: {
    display: 'flex',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginBottom: '34px',

    flexWrap: 'wrap',

    gap: '20px',
  },

  headerLeft: {
    display: 'flex',

    alignItems: 'center',

    gap: '18px',
  },

  logoBox: {
    width: '70px',

    height: '70px',

    borderRadius: '22px',

    background:
      'rgba(37,99,235,0.12)',

    border:
      '1px solid rgba(37,99,235,0.2)',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',
  },

  title: {
    fontSize: '46px',

    fontWeight: 800,

    color: '#FFFFFF',

    margin: 0,
  },

  subtitle: {
    color: '#94A3B8',

    marginTop: '8px',

    fontSize: '15px',
  },

  timerBox: {
    background: '#111827',

    border: '1px solid #1E293B',

    borderRadius: '20px',

    padding: '16px 22px',

    display: 'flex',

    alignItems: 'center',

    gap: '12px',

    boxShadow:
      '0 10px 30px rgba(0,0,0,0.3)',
  },

  timerText: {
    color: '#FFFFFF',

    fontSize: '24px',

    fontWeight: 700,
  },

  generateWrapper: {
    display: 'flex',

    justifyContent: 'center',

    alignItems: 'center',

    paddingTop: '50px',
  },

  generateCard: {
    width: '480px',

    background: '#111827',

    border: '1px solid #1E293B',

    borderRadius: '32px',

    padding: '40px',

    boxShadow:
      '0 20px 50px rgba(0,0,0,0.35)',
  },

  generateTop: {
    textAlign: 'center',

    marginBottom: '34px',
  },

  generateTitle: {
    fontSize: '32px',

    color: '#FFFFFF',

    marginTop: '16px',

    marginBottom: '10px',
  },

  generateSubtitle: {
    color: '#94A3B8',

    lineHeight: 1.7,
  },

  inputGroup: {
    marginBottom: '24px',
  },

  label: {
    display: 'block',

    color: '#CBD5E1',

    marginBottom: '10px',

    fontSize: '14px',

    fontWeight: 600,
  },

  input: {
    width: '100%',

    padding: '16px',

    borderRadius: '18px',

    border: '1px solid #334155',

    background: '#0F172A',

    color: '#FFFFFF',

    fontSize: '15px',

    outline: 'none',

    boxSizing: 'border-box',
  },

  select: {
    width: '100%',

    padding: '16px',

    borderRadius: '18px',

    border: '1px solid #334155',

    background: '#0F172A',

    color: '#FFFFFF',

    fontSize: '15px',

    outline: 'none',
  },

  generateButton: {
    width: '100%',

    padding: '16px',

    marginTop: '10px',

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
      '0 10px 30px rgba(37,99,235,0.25)',
  },

  testLayout: {
    display: 'grid',

    gridTemplateColumns: '140px 1fr',

    gap: '24px',
  },

  sidebar: {
    background: '#111827',

    border: '1px solid #1E293B',

    borderRadius: '28px',

    padding: '20px',

    height: 'fit-content',
  },

  sidebarHeader: {
    color: '#FFFFFF',

    fontWeight: 700,

    marginBottom: '20px',

    fontSize: '18px',
  },

  questionNav: {
    display: 'grid',

    gridTemplateColumns:
      'repeat(2, 1fr)',

    gap: '12px',
  },

  questionButton: {
    width: '42px',

    height: '42px',

    borderRadius: '14px',

    border: 'none',

    color: '#FFFFFF',

    fontWeight: 700,

    cursor: 'pointer',
  },

  mainPanel: {
    background: '#111827',

    border: '1px solid #1E293B',

    borderRadius: '32px',

    padding: '34px',

    boxShadow:
      '0 20px 50px rgba(0,0,0,0.35)',
  },

  questionTop: {
    display: 'flex',

    justifyContent: 'space-between',

    alignItems: 'flex-start',

    gap: '20px',

    marginBottom: '34px',
  },

  questionNumber: {
    color: '#60A5FA',

    fontWeight: 700,

    marginBottom: '16px',
  },

  questionText: {
    fontSize: '32px',

    color: '#FFFFFF',

    lineHeight: 1.5,

    margin: 0,
  },

  difficultyBadge: {
    background:
      'rgba(37,99,235,0.12)',

    color: '#60A5FA',

    padding: '10px 16px',

    borderRadius: '999px',

    fontWeight: 700,

    border:
      '1px solid rgba(37,99,235,0.2)',
  },

  optionsWrapper: {
    display: 'flex',

    flexDirection: 'column',

    gap: '18px',

    marginBottom: '40px',
  },

  optionCard: {
    display: 'flex',

    alignItems: 'center',

    gap: '18px',

    padding: '22px',

    borderRadius: '22px',

    cursor: 'pointer',

    transition: '0.2s ease',
  },

  optionCircle: {
    width: '42px',

    height: '42px',

    borderRadius: '50%',

    display: 'flex',

    alignItems: 'center',

    justifyContent: 'center',

    color: '#FFFFFF',

    fontWeight: 700,

    flexShrink: 0,
  },

  optionText: {
    color: '#E2E8F0',

    fontSize: '16px',

    lineHeight: 1.7,
  },

  bottomNav: {
    display: 'flex',

    justifyContent: 'space-between',

    alignItems: 'center',

    marginTop: '30px',
  },

  navButton: {
    background: '#1E293B',

    color: '#FFFFFF',

    border: 'none',

    borderRadius: '16px',

    padding: '14px 20px',

    display: 'flex',

    alignItems: 'center',

    gap: '10px',

    cursor: 'pointer',

    fontWeight: 600,
  },

  nextButton: {
    background: '#2563EB',

    color: '#FFFFFF',

    border: 'none',

    borderRadius: '16px',

    padding: '14px 24px',

    display: 'flex',

    alignItems: 'center',

    gap: '10px',

    cursor: 'pointer',

    fontWeight: 700,

    boxShadow:
      '0 10px 30px rgba(37,99,235,0.25)',
  },

  submitButton: {
    background: '#22C55E',

    color: '#FFFFFF',

    border: 'none',

    borderRadius: '16px',

    padding: '14px 24px',

    display: 'flex',

    alignItems: 'center',

    gap: '10px',

    cursor: 'pointer',

    fontWeight: 700,

    boxShadow:
      '0 10px 30px rgba(34,197,94,0.25)',
  },

  resultsPage: {
    display: 'flex',

    flexDirection: 'column',

    gap: '34px',
  },

  resultHero: {
    background:
      'linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)',

    borderRadius: '36px',

    padding: '50px',

    textAlign: 'center',

    color: '#FFFFFF',

    boxShadow:
      '0 20px 60px rgba(37,99,235,0.35)',
  },

  resultTitle: {
    fontSize: '36px',

    marginBottom: '20px',
  },

  score: {
    fontSize: '72px',

    fontWeight: 800,

    marginBottom: '18px',
  },

  feedback: {
    fontSize: '18px',

    opacity: 0.9,

    maxWidth: '700px',

    margin: '0 auto',
  },

  retryButton: {
    marginTop: '30px',

    padding: '16px 28px',

    borderRadius: '18px',

    border: 'none',

    background: '#FFFFFF',

    color: '#2563EB',

    fontWeight: 700,

    cursor: 'pointer',
  },

  reviewSection: {
    display: 'flex',

    flexDirection: 'column',

    gap: '24px',
  },

  reviewTitle: {
    color: '#FFFFFF',

    fontSize: '30px',

    marginBottom: '10px',
  },

  reviewCard: {
    background: '#111827',

    borderRadius: '28px',

    padding: '28px',

    boxShadow:
      '0 10px 40px rgba(0,0,0,0.35)',
  },

  reviewTop: {
    display: 'flex',

    justifyContent: 'space-between',

    gap: '20px',

    marginBottom: '24px',
  },

  reviewQuestion: {
    color: '#FFFFFF',

    margin: 0,

    lineHeight: 1.6,
  },

  resultBadge: {
    padding: '8px 14px',

    borderRadius: '999px',

    fontWeight: 700,

    fontSize: '13px',

    height: 'fit-content',
  },

  answerGrid: {
    display: 'grid',

    gridTemplateColumns:
      'repeat(auto-fit, minmax(260px, 1fr))',

    gap: '18px',

    marginBottom: '18px',
  },

  answerBox: {
    background: '#0F172A',

    border: '1px solid #1E293B',

    borderRadius: '20px',

    padding: '18px',
  },

  answerLabel: {
    color: '#94A3B8',

    fontSize: '13px',

    marginBottom: '8px',

    fontWeight: 700,
  },

  answerValue: {
    color: '#FFFFFF',

    lineHeight: 1.6,
  },

  explanationBox: {
    background: '#1E1B4B',

    border:
      '1px solid rgba(99,102,241,0.2)',

    borderRadius: '20px',

    padding: '20px',
  },

  explanation: {
    color: '#E2E8F0',

    lineHeight: 1.8,
  },
};