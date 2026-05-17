import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ChevronRight,
  ChevronLeft,
  Building2,
  BookOpen,
  AlertCircle,
  CheckCircle,
  Trophy,
  RotateCcw,
  Tag,
  BarChart2,
} from 'lucide-react';
import Compiler from '../components/Compiler';
import { useAntiCheat } from '../hooks/useAntiCheat';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

const COMPANIES = ['infosys', 'amazon', 'TCS', 'wipro'];
const COMPANY_LABELS = { infosys: 'Infosys', amazon: 'Amazon', TCS: 'TCS', wipro: 'Wipro' };
const COMPANY_COLORS = {
  infosys: { bg: '#0A2E5C', accent: '#006BB6', text: '#60A5FA' },
  amazon: { bg: '#2D1600', accent: '#FF9900', text: '#FBB040' },
  TCS: { bg: '#001A4D', accent: '#1E40AF', text: '#93C5FD' },
  wipro: { bg: '#0A2D0A', accent: '#16A34A', text: '#4ADE80' },
};

const TOTAL_SECONDS = 30 * 60; // 30 minutes

function parseMd(content) {
  // Only parse up to the Solutions section — everything after is code templates
  const solutionSplit = content.search(/## 💻 Solutions|## Solutions Snippets/);
  const relevant = solutionSplit > -1 ? content.slice(0, solutionSplit) : content;

  const lines = relevant.replace(/\r\n/g, '\n').split('\n');
  const result = { title: '', difficulty: '', tags: [], statement: '', examples: [] };
  let inExamples = false;
  let currentExample = null;
  let statementLines = [];
  let inStatement = false;
  let titleFound = false; // only grab first H1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!titleFound && line.startsWith('# ')) {
      result.title = line.replace(/^# /, '').trim();
      titleFound = true;
    } else if (line.startsWith('**Difficulty:**')) {
      result.difficulty = line.replace('**Difficulty:**', '').trim();
    } else if (line.startsWith('**Tags:**')) {
      result.tags = line.replace('**Tags:**', '').trim().split(',').map(t => t.trim());
    } else if (line.includes('Problem Statement')) {
      inStatement = true;
    } else if (/^Example\s*\d*:?$/.test(line.trim())) {
      inStatement = false;
      inExamples = true;
      if (currentExample) result.examples.push(currentExample);
      currentExample = { label: line.replace(':', '').trim(), input: '', output: '', explanation: '' };
    } else if (line.startsWith('Constraints') || line.startsWith('Follow-up')) {
      inExamples = false;
      if (currentExample) { result.examples.push(currentExample); currentExample = null; }
    } else if (inStatement && line.trim() && !line.startsWith('---') && !line.startsWith('#')) {
      statementLines.push(line.trim());
    } else if (inExamples && currentExample) {
      if (line.startsWith('Input:')) currentExample.input = line.replace('Input:', '').trim();
      else if (line.startsWith('Output:')) currentExample.output = line.replace('Output:', '').trim();
      else if (line.startsWith('Explanation:')) currentExample.explanation = line.replace('Explanation:', '').trim();
    }
  }
  if (currentExample) result.examples.push(currentExample);
  result.statement = statementLines.filter(l => l && l !== '---').join(' ');
  return result;
}

function pickRandom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function fmt(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ─── Company Selector Screen ──────────────────────────────────────────────── */
function CompanySelector({ onSelect }) {
  return (
    <div style={selStyles.page}>
      <div style={selStyles.inner}>
        <div style={selStyles.badge}>
          <Building2 size={18} color="#60A5FA" />
          <span>Company-Wise Test</span>
        </div>
        <h1 style={selStyles.heading}>Select a Company</h1>
        <p style={selStyles.sub}>
          3 random questions · 30-minute timer · Auto-graded test cases
        </p>
        <div style={selStyles.grid}>
          {COMPANIES.map(c => {
            const col = COMPANY_COLORS[c];
            return (
              <button key={c} style={{ ...selStyles.card, background: col.bg, borderColor: col.accent + '55' }} onClick={() => onSelect(c)}>
                <div style={{ ...selStyles.cardAccent, background: col.accent }} />
                <Building2 size={32} color={col.text} />
                <span style={{ ...selStyles.cardName, color: col.text }}>{COMPANY_LABELS[c]}</span>
                <ChevronRight size={18} color={col.text} style={{ marginLeft: 'auto' }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const selStyles = {
  page: {
    minHeight: '100vh',
    background: '#0F172A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  inner: { maxWidth: '560px', width: '100%', textAlign: 'center' },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    background: 'rgba(37,99,235,0.12)',
    border: '1px solid rgba(37,99,235,0.25)',
    borderRadius: '100px',
    padding: '6px 16px',
    fontSize: '13px',
    color: '#60A5FA',
    fontWeight: 600,
    marginBottom: '24px',
  },
  heading: {
    fontSize: '38px',
    fontWeight: 800,
    color: '#F1F5F9',
    margin: '0 0 10px',
    letterSpacing: '-0.02em',
  },
  sub: {
    color: '#475569',
    fontSize: '14px',
    marginBottom: '40px',
    lineHeight: 1.6,
  },
  grid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px 24px',
    border: '1px solid',
    borderRadius: '16px',
    cursor: 'pointer',
    position: 'relative',
    overflow: 'hidden',
    transition: 'transform 0.15s, box-shadow 0.15s',
    textAlign: 'left',
  },
  cardAccent: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: '4px',
  },
  cardName: {
    fontSize: '18px',
    fontWeight: 700,
    letterSpacing: '0.02em',
  },
};

/* ─── Result Screen ────────────────────────────────────────────────────────── */
function ResultScreen({ results, company, onRetry, onNewCompany }) {
  const totalPassed = results.reduce((a, r) => a + (r.passed || 0), 0);
  const totalTests = results.reduce((a, r) => a + (r.total || 0), 0);
  const pct = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

  return (
    <div style={resStyles.page}>
      <div style={resStyles.card}>
        <Trophy size={48} color="#F59E0B" style={{ marginBottom: '12px' }} />
        <h2 style={resStyles.heading}>Test Complete!</h2>
        <p style={resStyles.company}>{COMPANY_LABELS[company]} — 3 Questions</p>
        <div style={resStyles.scoreRow}>
          <div style={resStyles.scoreBox}>
            <span style={resStyles.scoreNum}>{pct}%</span>
            <span style={resStyles.scoreLabel}>Score</span>
          </div>
          <div style={resStyles.scoreBox}>
            <span style={resStyles.scoreNum}>{totalPassed}/{totalTests}</span>
            <span style={resStyles.scoreLabel}>Test Cases</span>
          </div>
        </div>
        <div style={resStyles.breakdown}>
          {results.map((r, i) => (
            <div key={i} style={resStyles.bRow}>
              <span style={resStyles.bQ}>Q{i + 1}: {r.title}</span>
              <span style={{ color: r.passed === r.total ? '#4ADE80' : r.passed > 0 ? '#F59E0B' : '#EF4444', fontWeight: 700 }}>
                {r.passed}/{r.total}
              </span>
            </div>
          ))}
        </div>
        <div style={resStyles.btnRow}>
          <button onClick={onRetry} style={resStyles.btnSecondary}>
            <RotateCcw size={16} /> Retry Same
          </button>
          <button onClick={onNewCompany} style={resStyles.btnPrimary}>
            <Building2 size={16} /> New Company
          </button>
        </div>
      </div>
    </div>
  );
}

const resStyles = {
  page: {
    minHeight: '100vh',
    background: '#0F172A',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  card: {
    background: '#111827',
    border: '1px solid #1E293B',
    borderRadius: '24px',
    padding: '48px 40px',
    maxWidth: '480px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  heading: { fontSize: '28px', fontWeight: 800, color: '#F1F5F9', margin: '0 0 6px' },
  company: { color: '#475569', fontSize: '14px', marginBottom: '32px' },
  scoreRow: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    marginBottom: '32px',
  },
  scoreBox: {
    background: '#0F172A',
    border: '1px solid #1E293B',
    borderRadius: '14px',
    padding: '20px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  scoreNum: { fontSize: '36px', fontWeight: 800, color: '#F1F5F9' },
  scoreLabel: { fontSize: '12px', color: '#475569', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' },
  breakdown: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '32px',
  },
  bRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: '#0B1220',
    border: '1px solid #1E293B',
    borderRadius: '10px',
    padding: '12px 16px',
    fontSize: '13px',
  },
  bQ: { color: '#94A3B8', textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '260px' },
  btnRow: { display: 'flex', gap: '12px', justifyContent: 'center' },
  btnPrimary: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#2563EB', color: '#fff', border: 'none',
    borderRadius: '10px', padding: '12px 24px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
  },
  btnSecondary: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#1E293B', color: '#E2E8F0', border: '1px solid #334155',
    borderRadius: '10px', padding: '12px 24px', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
  },
};

/* ─── Main Test Page ───────────────────────────────────────────────────────── */
export default function Test() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState('select'); // select | loading | test | result
  const [company, setCompany] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [questionResults, setQuestionResults] = useState([]);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const compilerRef = useRef(null);

  // Timer
  useEffect(() => {
    if (phase !== 'test') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase('result');
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const loadQuestions = async (selectedCompany) => {
    setPhase('loading');
    setError(null);
    try {
      // Load index
      const indexRes = await fetch('/questions/index.json');
      const index = await indexRes.json();
      const slugs = index[selectedCompany] || [];
      if (slugs.length === 0) throw new Error('No questions found for this company');

      const chosen = pickRandom(slugs, Math.min(3, slugs.length));
      const loaded = [];

      for (const slug of chosen) {
        const res = await fetch(`/questions/${selectedCompany}/${slug}.json`);
        if (!res.ok) continue;
        const data = await res.json();
        const parsed = parseMd(data.content || '');
        loaded.push({
          slug,
          ...parsed,
          testCases: data.test_cases?.public || [],
        });
      }

      if (loaded.length === 0) throw new Error('Could not load any questions');

      setQuestions(loaded);
      setQuestionResults(loaded.map(() => ({ passed: 0, total: 0, submitted: false })));
      setCompany(selectedCompany);
      setCurrentQ(0);
      setTimeLeft(TOTAL_SECONDS);
      setPhase('test');
    } catch (e) {
      setError(e.message);
      setPhase('select');
    }
  };

  const handleCompanySelect = (c) => loadQuestions(c);

  const handleTestResults = useCallback((passed, total) => {
    setQuestionResults(prev => {
      const copy = [...prev];
      copy[currentQ] = {
        passed,
        total,
        submitted: true,
        title: questions[currentQ]?.title || `Q${currentQ + 1}`,
      };
      return copy;
    });
  }, [currentQ, questions]);

  const handleFinish = useCallback(() => {
    clearInterval(timerRef.current);
    setPhase('result');
  }, []);

  const isTestActive = phase === 'test';
  useAntiCheat(isTestActive, handleFinish);

  if (phase === 'select' || phase === 'loading') {
    return (
      <>
        {error && (
          <div style={ts.errorBanner}>
            <AlertCircle size={16} /> {error}
          </div>
        )}
        {phase === 'loading'
          ? <div style={ts.loadingPage}><div style={ts.spinner} /><p style={{ color: '#475569', marginTop: '16px', fontFamily: 'monospace' }}>Loading questions...</p></div>
          : <CompanySelector onSelect={handleCompanySelect} />
        }
      </>
    );
  }

  if (phase === 'result') {
    const finalResults = questionResults.map((r, i) => ({
      ...r,
      title: questions[i]?.title || `Question ${i + 1}`,
    }));
    return (
      <ResultScreen
        results={finalResults}
        company={company}
        onRetry={() => loadQuestions(company)}
        onNewCompany={() => { setPhase('select'); setCompany(null); setQuestions([]); }}
      />
    );
  }

  // ── MAIN TEST UI ──
  const q = questions[currentQ];
  const colorsSet = COMPANY_COLORS[company];
  const timerCritical = timeLeft < 300;
  const diffColor = q?.difficulty === 'Easy' ? '#4ADE80' : q?.difficulty === 'Medium' ? '#F59E0B' : '#EF4444';
  const allSubmitted = questionResults.every(r => r.submitted);

  return (
    <div style={ts.page}>
      {/* ── Top bar ── */}
      <div style={ts.topBar}>
        <div style={ts.topLeft}>
          <div style={{ ...ts.companyBadge, background: colorsSet.bg, borderColor: colorsSet.accent + '88', color: colorsSet.text }}>
            <Building2 size={14} />
            {COMPANY_LABELS[company]}
          </div>
          <div style={ts.qTabs}>
            {questions.map((_, i) => {
              const r = questionResults[i];
              return (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  style={{
                    ...ts.qTab,
                    ...(i === currentQ ? ts.qTabActive : {}),
                    ...(r?.submitted ? { borderColor: r.passed === r.total ? '#22C55E' : r.passed > 0 ? '#F59E0B' : '#EF4444' } : {}),
                  }}
                >
                  {r?.submitted
                    ? r.passed === r.total
                      ? <CheckCircle size={12} color="#4ADE80" />
                      : <AlertCircle size={12} color={r.passed > 0 ? '#F59E0B' : '#EF4444'} />
                    : null}
                  Q{i + 1}
                </button>
              );
            })}
          </div>
        </div>

        <div style={ts.timer}>
          <Clock size={16} color={timerCritical ? '#EF4444' : '#94A3B8'} />
          <span style={{ ...ts.timerText, color: timerCritical ? '#EF4444' : '#E2E8F0' }}>
            {fmt(timeLeft)}
          </span>
        </div>

        <div style={ts.topRight}>
          <button onClick={handleFinish} style={ts.finishBtn}>
            <Trophy size={14} /> Finish Test
          </button>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={ts.layout}>
        {/* LEFT — Problem */}
        <div style={ts.leftPanel}>
          <div style={ts.problemCard}>
            {/* Problem header */}
            <div style={ts.problemHeader}>
              <div style={ts.pHeaderTop}>
                <h2 style={ts.qTitle}>{q?.title || 'Loading...'}</h2>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ ...ts.diffBadge, background: diffColor + '18', color: diffColor, borderColor: diffColor + '44' }}>
                    <BarChart2 size={11} /> {q?.difficulty || '—'}
                  </span>
                </div>
              </div>
              {q?.tags?.length > 0 && (
                <div style={ts.tags}>
                  <Tag size={12} color="#475569" />
                  {q.tags.map(t => (
                    <span key={t} style={ts.tag}>{t}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Problem body */}
            <div style={ts.problemBody}>
              <div style={ts.section}>
                <h3 style={ts.sectionHead}>
                  <BookOpen size={14} color="#60A5FA" /> Problem Statement
                </h3>
                <p style={ts.statement}>{q?.statement || 'Loading problem statement...'}</p>
              </div>

              {q?.examples?.length > 0 && (
                <div style={ts.section}>
                  <h3 style={ts.sectionHead}>Examples</h3>
                  {q.examples.map((ex, i) => (
                    <div key={i} style={ts.exampleBox}>
                      <div style={ts.exLabel}>{ex.label || `Example ${i + 1}`}</div>
                      {ex.input && (
                        <div style={ts.exRow}>
                          <span style={ts.exKey}>Input:</span>
                          <code style={ts.exCode}>{ex.input}</code>
                        </div>
                      )}
                      {ex.output && (
                        <div style={ts.exRow}>
                          <span style={ts.exKey}>Output:</span>
                          <code style={ts.exCode}>{ex.output}</code>
                        </div>
                      )}
                      {ex.explanation && (
                        <div style={ts.exRow}>
                          <span style={ts.exKey}>Explanation:</span>
                          <span style={{ ...ts.exCode, fontFamily: 'inherit', color: '#94A3B8' }}>{ex.explanation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Nav arrows */}
          <div style={ts.navRow}>
            <button
              onClick={() => setCurrentQ(i => Math.max(0, i - 1))}
              disabled={currentQ === 0}
              style={{ ...ts.navBtn, opacity: currentQ === 0 ? 0.3 : 1 }}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ color: '#475569', fontSize: '13px' }}>
              {currentQ + 1} / {questions.length}
            </span>
            <button
              onClick={() => setCurrentQ(i => Math.min(questions.length - 1, i + 1))}
              disabled={currentQ === questions.length - 1}
              style={{ ...ts.navBtn, opacity: currentQ === questions.length - 1 ? 0.3 : 1 }}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* RIGHT — Compiler */}
        <div style={ts.rightPanel}>
          <Compiler
            key={`${company}-${currentQ}`}
            question={q}
            testCases={q?.testCases || []}
            onTestResults={handleTestResults}
          />
        </div>
      </div>

      {allSubmitted && (
        <div style={ts.allDoneBanner}>
          <CheckCircle size={16} color="#4ADE80" />
          All questions submitted! &nbsp;
          <button onClick={handleFinish} style={ts.bannerBtn}>View Results →</button>
        </div>
      )}
    </div>
  );
}

const ts = {
  page: {
    minHeight: '100vh',
    background: '#0A0F1A',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    paddingTop: '60px', // for navbar
  },
  topBar: {
    height: '56px',
    background: '#0B1220',
    borderBottom: '1px solid #1E293B',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    position: 'sticky',
    top: '60px',
    zIndex: 50,
  },
  topLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  companyBadge: {
    display: 'flex', alignItems: 'center', gap: '6px',
    border: '1px solid', borderRadius: '8px',
    padding: '4px 12px', fontSize: '12px', fontWeight: 700,
  },
  qTabs: { display: 'flex', gap: '6px' },
  qTab: {
    display: 'flex', alignItems: 'center', gap: '4px',
    padding: '5px 14px', borderRadius: '8px',
    background: '#111827', border: '1px solid #1E293B',
    color: '#475569', fontSize: '12px', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.15s',
  },
  qTabActive: {
    background: '#1E3A5F', border: '1px solid #2563EB',
    color: '#60A5FA',
  },
  timer: { display: 'flex', alignItems: 'center', gap: '8px' },
  timerText: { fontSize: '18px', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.05em' },
  topRight: { display: 'flex', alignItems: 'center', gap: '10px' },
  finishBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: '#7C3AED', color: '#fff', border: 'none',
    borderRadius: '8px', padding: '7px 16px',
    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },
  layout: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0',
    minHeight: 0,
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #1E293B',
    overflow: 'hidden',
  },
  problemCard: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  problemHeader: {
    padding: '20px 24px 16px',
    borderBottom: '1px solid #1E293B',
    background: '#0B1220',
    flexShrink: 0,
  },
  pHeaderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '10px',
  },
  qTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#F1F5F9',
    margin: 0,
    lineHeight: 1.3,
    letterSpacing: '-0.01em',
  },
  diffBadge: {
    display: 'inline-flex', alignItems: 'center', gap: '4px',
    padding: '3px 10px', borderRadius: '6px',
    fontSize: '11px', fontWeight: 700,
    border: '1px solid', textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' },
  tag: {
    background: '#1E293B', color: '#64748B',
    borderRadius: '6px', padding: '2px 8px',
    fontSize: '11px', fontWeight: 600,
  },
  problemBody: {
    flex: 1,
    overflow: 'auto',
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  section: {},
  sectionHead: {
    display: 'flex', alignItems: 'center', gap: '8px',
    fontSize: '13px', fontWeight: 700, color: '#94A3B8',
    textTransform: 'uppercase', letterSpacing: '0.06em',
    marginBottom: '10px',
  },
  statement: {
    color: '#CBD5E1',
    fontSize: '14px',
    lineHeight: 1.75,
    margin: 0,
  },
  exampleBox: {
    background: '#0B1220',
    border: '1px solid #1E293B',
    borderRadius: '10px',
    padding: '14px 16px',
    marginBottom: '10px',
  },
  exLabel: {
    fontSize: '12px', fontWeight: 700, color: '#475569',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  exRow: { display: 'flex', gap: '10px', marginBottom: '4px', alignItems: 'flex-start' },
  exKey: { color: '#60A5FA', fontSize: '13px', fontWeight: 600, minWidth: '80px', flexShrink: 0 },
  exCode: { color: '#E2E8F0', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' },
  navRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 24px',
    borderTop: '1px solid #1E293B',
    background: '#0B1220',
    flexShrink: 0,
  },
  navBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: '#1E293B', color: '#E2E8F0',
    border: '1px solid #334155', borderRadius: '8px',
    padding: '7px 16px', fontSize: '13px', fontWeight: 600,
    cursor: 'pointer', transition: 'opacity 0.2s',
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    overflow: 'hidden',
  },
  errorBanner: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#3A1A1A', color: '#F87171',
    padding: '10px 20px', fontSize: '14px', fontWeight: 600,
    borderBottom: '1px solid #5A2020',
  },
  loadingPage: {
    minHeight: '100vh', background: '#0F172A',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    fontFamily: 'monospace',
  },
  spinner: {
    width: '36px', height: '36px',
    border: '3px solid #1E293B',
    borderTop: '3px solid #2563EB',
    borderRadius: '50%',
    animation: 'spin 0.9s linear infinite',
  },
  allDoneBanner: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    background: '#0A2D1A', color: '#4ADE80',
    padding: '10px 20px', fontSize: '14px', fontWeight: 600,
    borderTop: '1px solid #14532D',
  },
  bannerBtn: {
    background: '#16A34A', color: '#fff', border: 'none',
    borderRadius: '6px', padding: '4px 12px',
    fontSize: '13px', fontWeight: 700, cursor: 'pointer',
  },
};
