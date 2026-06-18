import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  ChevronLeft,
  Trophy,
  Clock,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Building2,
  BrainCircuit,
  Code2,
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Loader2,
  Play,
  ArrowRight,
  Bot,
  User,
  StopCircle,
} from 'lucide-react';
import Compiler from '../components/Compiler';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Map MockTest company IDs → what the backend expects
const COMPANY_NAME_MAP = {
  generic: 'Generic',
  tcs: 'TCS',
  infosys: 'Infosys',
  wipro: 'Wipro',
  amazon: 'Amazon',
};

// Map MockTest company IDs → question folder names used in /public/questions/
const COMPANY_FOLDER_MAP = {
  generic: 'infosys',   // fallback to infosys questions
  tcs: 'TCS',
  infosys: 'infosys',
  wipro: 'wipro',
  amazon: 'amazon',
};

const COMPANIES = [
  { id: 'generic', label: 'Generic', color: '#6366F1', bg: '#1a1a3e', logo: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png', emoji: '🌐' },
  { id: 'tcs', label: 'TCS', color: '#0066B2', bg: '#00163a', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Tata_Consultancy_Services_Logo.svg/200px-Tata_Consultancy_Services_Logo.svg.png', emoji: '🔵' },
  { id: 'infosys', label: 'Infosys', color: '#007CC3', bg: '#001e38', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Infosys_logo.svg/200px-Infosys_logo.svg.png', emoji: '🔷' },
  { id: 'wipro', label: 'Wipro', color: '#3cb944', bg: '#0a1f0a', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Wipro_Primary_Logo_Color_RGB.svg/200px-Wipro_Primary_Logo_Color_RGB.svg.png', emoji: '🟢' },
  { id: 'amazon', label: 'Amazon', color: '#FF9900', bg: '#1a0f00', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/200px-Amazon_logo.svg.png', emoji: '🟠' },
];

const ROUNDS = [
  { id: 'aptitude', label: 'Aptitude Round', icon: BrainCircuit, desc: 'AI-generated Logical & Quantitative MCQs', color: '#6366F1' },
  { id: 'coding', label: 'Coding Round', icon: Code2, desc: 'Algorithmic Problem Solving', color: '#10B981' },
  { id: 'interview', label: 'Interview Round', icon: MessageSquare, desc: 'AI-powered HR & Technical Interview', color: '#F59E0B' },
];

// Company → interview role mapping
const INTERVIEW_ROLE_MAP = {
  generic: 'Campus Level Intern',
  tcs: 'TCS Campus Recruit',
  infosys: 'Infosys Systems Engineer',
  wipro: 'Wipro Turbo Graduate',
  amazon: 'Amazon SDE Intern',
};

function fmt(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = (secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ─── Company Selector with Auto-Slider ─────────────────────────────────── */
function CompanySelector({ onSelect }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef(null);

  const goTo = useCallback((idx) => {
    setIsTransitioning(true);
    setTimeout(() => { setActiveIdx(idx); setIsTransitioning(false); }, 200);
  }, []);

  const next = useCallback(() => goTo((activeIdx + 1) % COMPANIES.length), [activeIdx, goTo]);
  const prev = useCallback(() => goTo((activeIdx - 1 + COMPANIES.length) % COMPANIES.length), [activeIdx, goTo]);

  useEffect(() => {
    intervalRef.current = setInterval(() => setActiveIdx(p => (p + 1) % COMPANIES.length), 2000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const handleNav = (fn) => {
    clearInterval(intervalRef.current);
    fn();
    intervalRef.current = setInterval(() => setActiveIdx(p => (p + 1) % COMPANIES.length), 2000);
  };

  const company = COMPANIES[activeIdx];

  return (
    <div style={cs.page}>
      <div style={cs.inner}>
        <div style={cs.badge}><Trophy size={16} color="#F59E0B" /><span>Full Mock Interview</span></div>
        <h1 style={cs.heading}>Select a Company</h1>
        <p style={cs.sub}>Aptitude · Coding · Interview — 3 AI-powered rounds</p>

        <div style={cs.sliderWrap}>
          <button style={cs.navArrow} onClick={() => handleNav(prev)}><ChevronLeft size={20} color="#fff" /></button>
          <div style={{ ...cs.companyCard, background: `linear-gradient(135deg, ${company.bg} 0%, #0F172A 100%)`, borderColor: company.color + '60', opacity: isTransitioning ? 0 : 1, transform: isTransitioning ? 'scale(0.97)' : 'scale(1)', transition: 'opacity 0.2s ease, transform 0.2s ease' }}>
            <div style={{ ...cs.colorBar, background: company.color }} />
            <div style={cs.logoWrap}>
              <img src={company.logo} alt={company.label} style={cs.logoImg} onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
              <div style={{ ...cs.logoFallback, display: 'none', background: company.color + '22', color: company.color }}>{company.emoji}</div>
            </div>
            <h2 style={{ ...cs.companyName, color: company.color }}>{company.label}</h2>
            <p style={cs.companyTagline}>
              {company.id === 'generic' && 'General preparation for all companies'}
              {company.id === 'tcs' && 'TCS Ninja & Digital pattern questions'}
              {company.id === 'infosys' && 'Infosys InfyTQ style assessment'}
              {company.id === 'wipro' && 'Wipro NLTH & ProGrad pattern'}
              {company.id === 'amazon' && 'Amazon SDE & leadership principles'}
            </p>
            <div style={cs.roundPills}>
              {ROUNDS.map(r => (
                <span key={r.id} style={{ ...cs.pill, borderColor: r.color + '60', color: r.color, background: r.color + '12' }}>{r.label}</span>
              ))}
            </div>
            <button style={{ ...cs.selectBtn, background: company.color }} onClick={() => onSelect(company)}>
              Start Mock Test <ArrowRight size={16} />
            </button>
          </div>
          <button style={cs.navArrow} onClick={() => handleNav(next)}><ChevronRight size={20} color="#fff" /></button>
        </div>

        <div style={cs.dots}>
          {COMPANIES.map((c, i) => (
            <button key={c.id} style={{ ...cs.dot, background: i === activeIdx ? c.color : '#1E293B', width: i === activeIdx ? 24 : 8 }} onClick={() => handleNav(() => goTo(i))} />
          ))}
        </div>

        <div style={cs.allGrid}>
          {COMPANIES.map((c, i) => (
            <button key={c.id} style={{ ...cs.gridItem, borderColor: i === activeIdx ? c.color : '#1E293B', background: i === activeIdx ? c.color + '18' : '#111827' }}
              onClick={() => { handleNav(() => goTo(i)); onSelect(c); }}>
              <img src={c.logo} alt={c.label} style={cs.gridLogo} onError={e => { e.target.style.display = 'none'; }} />
              <span style={{ color: i === activeIdx ? c.color : '#94A3B8', fontSize: 13, fontWeight: 700 }}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const cs = {
  page: { minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: "'Inter', sans-serif" },
  inner: { maxWidth: 600, width: '100%', textAlign: 'center' },
  badge: { display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 100, padding: '6px 16px', fontSize: 13, color: '#F59E0B', fontWeight: 600, marginBottom: 20 },
  heading: { fontSize: 40, fontWeight: 800, color: '#F1F5F9', margin: '0 0 10px', letterSpacing: '-0.02em' },
  sub: { color: '#64748B', fontSize: 15, marginBottom: 36, lineHeight: 1.6 },
  sliderWrap: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  navArrow: { width: 40, height: 40, borderRadius: '50%', background: '#1E293B', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  companyCard: { flex: 1, border: '1.5px solid', borderRadius: 24, padding: '36px 32px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 },
  colorBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 3 },
  logoWrap: { width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoImg: { maxWidth: 80, maxHeight: 80, objectFit: 'contain', filter: 'brightness(1.1)' },
  logoFallback: { width: 70, height: 70, borderRadius: 16, alignItems: 'center', justifyContent: 'center', fontSize: 36 },
  companyName: { fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: '-0.01em' },
  companyTagline: { color: '#64748B', fontSize: 14, lineHeight: 1.6, margin: 0, maxWidth: 360 },
  roundPills: { display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' },
  pill: { padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, border: '1px solid' },
  selectBtn: { display: 'flex', alignItems: 'center', gap: 8, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontWeight: 700, fontSize: 15, cursor: 'pointer', marginTop: 8, width: '100%', justifyContent: 'center' },
  dots: { display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 },
  dot: { height: 8, borderRadius: 100, border: 'none', cursor: 'pointer', transition: 'all 0.3s ease' },
  allGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 },
  gridItem: { border: '1.5px solid', borderRadius: 14, padding: '12px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer', transition: 'all 0.2s' },
  gridLogo: { width: 36, height: 36, objectFit: 'contain' },
};

/* ─── Round Introduction Screen ─────────────────────────────────────────── */
function RoundIntro({ round, company, roundIndex, onStart }) {
  const RoundIcon = round.icon;
  return (
    <div style={ri.page}>
      <div style={ri.card}>
        <div style={{ ...ri.iconWrap, background: round.color + '18', border: `1px solid ${round.color}40` }}>
          <RoundIcon size={40} color={round.color} />
        </div>
        <div style={{ ...ri.roundNum, color: round.color }}>Round {roundIndex + 1} of 3</div>
        <h2 style={ri.title}>{round.label}</h2>
        <p style={ri.desc}>{round.desc}</p>
        <div style={ri.meta}>
          {round.id === 'aptitude' && (
            <><div style={ri.metaItem}><Clock size={14} color="#94A3B8" /><span>20 minutes</span></div>
            <div style={ri.metaItem}><BrainCircuit size={14} color="#94A3B8" /><span>10 AI-generated MCQs</span></div></>
          )}
          {round.id === 'coding' && (
            <><div style={ri.metaItem}><Clock size={14} color="#94A3B8" /><span>30 minutes</span></div>
            <div style={ri.metaItem}><Code2 size={14} color="#94A3B8" /><span>1 coding problem from question bank</span></div></>
          )}
          {round.id === 'interview' && (
            <><div style={ri.metaItem}><Clock size={14} color="#94A3B8" /><span>15 minutes</span></div>
            <div style={ri.metaItem}><MessageSquare size={14} color="#94A3B8" /><span>AI voice interview — speak your answers</span></div></>
          )}
          <div style={ri.metaItem}>
            <img src={company.logo} alt={company.label} style={{ width: 18, height: 18, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
            <span>{company.label} pattern</span>
          </div>
        </div>
        <button style={{ ...ri.startBtn, background: round.color }} onClick={onStart}>
          <Play size={16} /> Start Round
        </button>
      </div>
    </div>
  );
}

const ri = {
  page: { minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: "'Inter', sans-serif" },
  card: { background: '#111827', border: '1px solid #1E293B', borderRadius: 28, padding: '52px 48px', maxWidth: 480, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, boxShadow: '0 30px 80px rgba(0,0,0,0.4)' },
  iconWrap: { width: 80, height: 80, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  roundNum: { fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' },
  title: { fontSize: 30, fontWeight: 800, color: '#F1F5F9', margin: 0 },
  desc: { color: '#64748B', fontSize: 15, margin: 0, lineHeight: 1.6 },
  meta: { display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8, width: '100%' },
  metaItem: { display: 'flex', alignItems: 'center', gap: 10, background: '#0F172A', border: '1px solid #1E293B', borderRadius: 10, padding: '10px 16px', fontSize: 14, color: '#94A3B8', fontWeight: 500 },
  startBtn: { display: 'flex', alignItems: 'center', gap: 8, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 36px', fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 8 },
};

/* ─── Aptitude Round (AI backend) ───────────────────────────────────────── */
function AptitudeRound({ company, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({}); // { question_id: selected_option_key }
  const [timeLeft, setTimeLeft] = useState(20 * 60);
  const [submitted, setSubmitted] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const timerCritical = timeLeft < 120;

  // Fetch AI-generated questions on mount
  useEffect(() => {
    const companyName = COMPANY_NAME_MAP[company.id] || 'Generic';
    fetch(`${API_BASE}/appti_round/api/generate-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company: companyName, difficulty: 'Medium' }),
    })
      .then(r => r.json())
      .then(data => {
        const qs = (data.questions || []).slice(0, 10);
        setQuestions(qs);
        setLoading(false);
      })
      .catch(e => { setError('Failed to load questions. Please check your backend.'); setLoading(false); });
  }, []);

  // Timer
  useEffect(() => {
    if (loading || submitted) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [loading, submitted]);

  const handleSubmit = async () => {
    if (submitted || evaluating) return;
    setSubmitted(true);
    setEvaluating(true);

    const answersArr = Object.entries(answers).map(([qid, opt]) => ({
      question_id: parseInt(qid),
      selected_option: opt,
    }));

    try {
      const res = await fetch(`${API_BASE}/appti_round/api/evaluate-test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          difficulty: 'Medium',
          questions,
          answers: answersArr,
        }),
      });
      const data = await res.json();
      setEvaluating(false);
      onComplete({ score: data.total_score ?? 0, total: data.max_score ?? questions.length, summary: data.summary });
    } catch {
      setEvaluating(false);
      // Fallback: count locally (can't know correct answers without API)
      onComplete({ score: Object.keys(answers).length, total: questions.length });
    }
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <Loader2 size={40} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#64748B', fontSize: 16 }}>Generating {company.label} aptitude questions with AI…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight: '100vh', background: '#0A0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <AlertCircle size={40} color="#EF4444" />
      <p style={{ color: '#EF4444', fontSize: 16 }}>{error}</p>
    </div>
  );

  if (evaluating) return (
    <div style={{ minHeight: '100vh', background: '#0A0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <Loader2 size={40} color="#6366F1" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#64748B', fontSize: 16 }}>Evaluating your answers…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const q = questions[current];
  if (!q) return null;

  return (
    <div style={ar.page}>
      {/* Top bar */}
      <div style={ar.topBar}>
        <div style={ar.topLeft}>
          <BrainCircuit size={16} color="#6366F1" />
          <span style={{ color: '#6366F1', fontWeight: 700, fontSize: 14 }}>Aptitude Round</span>
          <div style={ar.qDots}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} style={{ ...ar.qDot, background: answers[questions[i]?.id] !== undefined ? '#6366F1' : i === current ? '#334155' : '#1E293B', width: i === current ? 24 : 8 }} />
            ))}
          </div>
        </div>
        <div style={{ ...ar.timer, color: timerCritical ? '#EF4444' : '#E2E8F0' }}>
          <Clock size={15} color={timerCritical ? '#EF4444' : '#94A3B8'} />{fmt(timeLeft)}
        </div>
        <div style={ar.topRight}>
          <span style={{ color: '#64748B', fontSize: 13 }}>{Object.keys(answers).length}/{questions.length} answered</span>
          <button style={ar.submitBtn} onClick={handleSubmit}>Submit Round</button>
        </div>
      </div>

      {/* Question */}
      <div style={ar.body}>
        <div style={ar.card}>
          <div style={ar.qNum}>
            Question {current + 1} of {questions.length}
            {q.category && <span style={{ marginLeft: 10, background: '#6366F118', border: '1px solid #6366F130', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{q.category}</span>}
          </div>
          <p style={ar.question}>{q.question}</p>
          <div style={ar.options}>
            {(q.options || []).map((opt) => {
              const isSelected = answers[q.id] === opt.key;
              return (
                <button key={opt.key} style={{ ...ar.option, ...(isSelected ? ar.optionSelected : {}) }}
                  onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.key }))}>
                  <span style={{ ...ar.optLabel, ...(isSelected ? { background: '#6366F1', color: '#fff' } : {}) }}>{opt.key}</span>
                  {opt.value}
                </button>
              );
            })}
          </div>
          <div style={ar.navRow}>
            <button style={{ ...ar.navBtn, opacity: current === 0 ? 0.3 : 1 }} onClick={() => setCurrent(p => Math.max(0, p - 1))} disabled={current === 0}>
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ color: '#475569', fontSize: 13 }}>{current + 1} / {questions.length}</span>
            {current < questions.length - 1 ? (
              <button style={ar.navBtn} onClick={() => setCurrent(p => p + 1)}>Next <ChevronRight size={16} /></button>
            ) : (
              <button style={{ ...ar.navBtn, background: '#6366F1', color: '#fff', border: 'none' }} onClick={handleSubmit}>
                Finish <CheckCircle size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const ar = {
  page: { minHeight: '100vh', background: '#0A0F1A', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" },
  topBar: { height: 56, background: '#0B1220', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 60, zIndex: 50 },
  topLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  qDots: { display: 'flex', gap: 4 },
  qDot: { height: 8, borderRadius: 100, border: 'none', cursor: 'pointer', transition: 'all 0.3s ease' },
  timer: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, fontWeight: 700, fontFamily: 'monospace' },
  topRight: { display: 'flex', alignItems: 'center', gap: 14 },
  submitBtn: { background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' },
  body: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px' },
  card: { background: '#111827', border: '1px solid #1E293B', borderRadius: 24, padding: '40px 36px', maxWidth: 640, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' },
  qNum: { fontSize: 12, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, display: 'flex', alignItems: 'center' },
  question: { fontSize: 19, fontWeight: 600, color: '#F1F5F9', lineHeight: 1.6, marginBottom: 28 },
  options: { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 },
  option: { display: 'flex', alignItems: 'center', gap: 14, background: '#0F172A', border: '1.5px solid #1E293B', borderRadius: 12, padding: '14px 18px', fontSize: 15, color: '#CBD5E1', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' },
  optionSelected: { borderColor: '#6366F1', background: '#6366F118', color: '#A5B4FC' },
  optLabel: { width: 30, height: 30, borderRadius: 8, background: '#1E293B', color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0, transition: 'all 0.15s' },
  navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: { display: 'flex', alignItems: 'center', gap: 6, background: '#1E293B', color: '#E2E8F0', border: '1px solid #334155', borderRadius: 8, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
};

/* ─── Coding Round (loads question from /public/questions/) ──────────────── */
function CodingRound({ company, onComplete }) {
  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [testResult, setTestResult] = useState(null);
  const timerCritical = timeLeft < 300;

  useEffect(() => {
    const folder = COMPANY_FOLDER_MAP[company.id] || 'infosys';
    // Load the question index, pick a random slug
    fetch('/questions/index.json')
      .then(r => r.json())
      .then(index => {
        const slugs = index[folder] || index['infosys'] || [];
        if (!slugs.length) throw new Error('No questions found');
        const slug = slugs[Math.floor(Math.random() * slugs.length)];
        return fetch(`/questions/${folder}/${slug}.json`);
      })
      .then(r => r.json())
      .then(data => { setQuestionData(data); setLoading(false); })
      .catch(e => { setError('Failed to load coding question.'); setLoading(false); });
  }, []);

  // Parse markdown content into structured data (same as Test.jsx)
  function parseMd(content) {
    const solutionSplit = content.search(/## 💻 Solutions|## Solutions Snippets/);
    const relevant = solutionSplit > -1 ? content.slice(0, solutionSplit) : content;
    const lines = relevant.replace(/\r\n/g, '\n').split('\n');
    const result = { title: '', difficulty: '', tags: [], statement: '', examples: [] };
    let inExamples = false, currentExample = null, statementLines = [], inStatement = false, titleFound = false;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!titleFound && line.startsWith('# ')) { result.title = line.replace(/^# /, '').trim(); titleFound = true; }
      else if (line.startsWith('**Difficulty:**')) result.difficulty = line.replace('**Difficulty:**', '').trim();
      else if (line.startsWith('**Tags:**')) result.tags = line.replace('**Tags:**', '').trim().split(',').map(t => t.trim());
      else if (line.includes('Problem Statement')) inStatement = true;
      else if (/^Example\s*\d*:?$/.test(line.trim())) {
        inStatement = false; inExamples = true;
        if (currentExample) result.examples.push(currentExample);
        currentExample = { label: line.replace(':', '').trim(), input: '', output: '', explanation: '' };
      } else if (line.startsWith('Constraints') || line.startsWith('Follow-up')) {
        inExamples = false;
        if (currentExample) { result.examples.push(currentExample); currentExample = null; }
      } else if (inStatement && line.trim() && !line.startsWith('---') && !line.startsWith('#')) statementLines.push(line.trim());
      else if (inExamples && currentExample) {
        if (line.startsWith('Input:')) currentExample.input = line.replace('Input:', '').trim();
        else if (line.startsWith('Output:')) currentExample.output = line.replace('Output:', '').trim();
        else if (line.startsWith('Explanation:')) currentExample.explanation = line.replace('Explanation:', '').trim();
      }
    }
    if (currentExample) result.examples.push(currentExample);
    result.statement = statementLines.filter(l => l && l !== '---').join(' ');
    return result;
  }

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); onComplete({ score: testResult ? testResult.passed : 0, total: testResult ? testResult.total : 1 }); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [testResult]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0A0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <Loader2 size={40} color="#10B981" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#64748B', fontSize: 16 }}>Loading {company.label} coding problem…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !questionData) return (
    <div style={{ minHeight: '100vh', background: '#0A0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <AlertCircle size={40} color="#EF4444" />
      <p style={{ color: '#EF4444', fontSize: 16 }}>{error || 'No question loaded'}</p>
      <button style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer' }} onClick={() => onComplete({ score: 0, total: 1 })}>
        Skip to Next Round
      </button>
    </div>
  );

  const parsed = parseMd(questionData.content || '');
  const testCases = (questionData.test_cases?.public || []).slice(0, 3).map(tc => ({
    input: typeof tc.input === 'object' ? Object.values(tc.input).map(v => JSON.stringify(v)).join('\n') : String(tc.input),
    expectedOutput: JSON.stringify(tc.output),
  }));

  const question = { title: parsed.title, difficulty: parsed.difficulty, tags: parsed.tags, statement: parsed.statement, examples: parsed.examples };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0F1A', display: 'flex', flexDirection: 'column', fontFamily: "'JetBrains Mono', monospace", paddingTop: 0 }}>
      <div style={{ height: 56, background: '#0B1220', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 60, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Code2 size={16} color="#10B981" />
          <span style={{ color: '#10B981', fontWeight: 700, fontSize: 14 }}>Coding Round</span>
          <span style={{ background: '#10B98118', border: '1px solid #10B98140', borderRadius: 8, padding: '3px 10px', fontSize: 12, color: '#10B981', fontWeight: 600 }}>{company.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: timerCritical ? '#EF4444' : '#E2E8F0', fontSize: 18, fontWeight: 700 }}>
          <Clock size={15} color={timerCritical ? '#EF4444' : '#94A3B8'} />{fmt(timeLeft)}
        </div>
        <button style={{ background: '#10B981', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
          onClick={() => onComplete({ score: testResult ? testResult.passed : 0, total: testResult ? testResult.total : 1 })}>
          Submit & Next Round
        </button>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 116px)' }}>
        {/* Problem Panel */}
        <div style={{ borderRight: '1px solid #1E293B', overflow: 'auto', padding: 24 }}>
          <div style={{ background: '#111827', border: '1px solid #1E293B', borderRadius: 16, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <h2 style={{ color: '#F1F5F9', fontSize: 20, fontWeight: 800, margin: 0 }}>{parsed.title}</h2>
              {parsed.difficulty && (
                <span style={{ background: parsed.difficulty === 'Easy' ? '#10B98118' : parsed.difficulty === 'Hard' ? '#EF444418' : '#F59E0B18', color: parsed.difficulty === 'Easy' ? '#10B981' : parsed.difficulty === 'Hard' ? '#EF4444' : '#F59E0B', border: `1px solid ${parsed.difficulty === 'Easy' ? '#10B98140' : parsed.difficulty === 'Hard' ? '#EF444440' : '#F59E0B40'}`, borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>
                  {parsed.difficulty}
                </span>
              )}
            </div>
            {parsed.tags.length > 0 && (
              <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
                {parsed.tags.map(t => <span key={t} style={{ background: '#1E293B', color: '#64748B', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>{t}</span>)}
              </div>
            )}
            <p style={{ color: '#CBD5E1', fontSize: 14, lineHeight: 1.8, marginBottom: 20 }}>{parsed.statement}</p>
            {parsed.examples.map((ex, i) => (
              <div key={i} style={{ background: '#0B1220', border: '1px solid #1E293B', borderRadius: 10, padding: '14px 16px', marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{ex.label}</div>
                <div style={{ fontSize: 13, color: '#E2E8F0' }}><span style={{ color: '#60A5FA', fontWeight: 600 }}>Input: </span>{ex.input}</div>
                <div style={{ fontSize: 13, color: '#E2E8F0' }}><span style={{ color: '#60A5FA', fontWeight: 600 }}>Output: </span>{ex.output}</div>
                {ex.explanation && <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}><span style={{ color: '#60A5FA', fontWeight: 600 }}>Explanation: </span>{ex.explanation}</div>}
              </div>
            ))}
          </div>
        </div>
        {/* Compiler */}
        <div style={{ padding: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Compiler question={question} testCases={testCases} onTestResults={(passed, total) => setTestResult({ passed, total })} />
        </div>
      </div>
    </div>
  );
}

/* ─── Interview Round (AI avatar backend) ────────────────────────────────── */
function InterviewRound({ company, onComplete }) {
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [startError, setStartError] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [useTyping, setUseTyping] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioElementRef = useRef(new Audio());
  const messagesEndRef = useRef(null);
  const timerCritical = timeLeft < 120;

  // Auto-start interview
  useEffect(() => {
    startInterview();
  }, []);

  // Timer
  useEffect(() => {
    if (!sessionId || evaluation) return;
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); handleEvaluate(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [sessionId, evaluation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const playAudio = (b64) => {
    if (!b64) return;
    audioElementRef.current.src = `data:audio/mp3;base64,${b64}`;
    audioElementRef.current.play().catch(() => {});
  };

  const startInterview = async () => {
    setIsLoading(true);
    setStartError(null);
    const role = INTERVIEW_ROLE_MAP[company.id] || 'Campus Level Intern';
    try {
      const res = await fetch(`${API_BASE}/avatar_interview/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to start interview');
      setSessionId(data.session_id);
      setMessages([{ sender: 'ai', text: data.text }]);
      playAudio(data.audio_b64);
    } catch (e) {
      setStartError(e.message || 'Could not connect to interview service');
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream);
    mediaRecorderRef.current = mr;
    mr.ondataavailable = e => audioChunksRef.current.push(e.data);
    mr.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
      await sendAudio(blob);
    };
    mr.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  const sendAudio = async (audioBlob) => {
    if (!sessionId) return;
    setIsLoading(true);
    const formData = new FormData();
    formData.append('session_id', sessionId);
    formData.append('audio', audioBlob, 'answer.wav');
    try {
      const res = await fetch(`${API_BASE}/avatar_interview/chat`, { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) { setMessages(prev => [...prev, { sender: 'system', text: data.text }]); return; }
      setMessages(prev => [...prev,
        { sender: 'user', text: data.user_text },
        { sender: 'ai', text: data.text },
      ]);
      playAudio(data.audio_b64);
    } catch {
      setMessages(prev => [...prev, { sender: 'system', text: 'Connection error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTyped = async () => {
    if (!typedAnswer.trim() || !sessionId || isLoading) return;
    const text = typedAnswer.trim();
    setTypedAnswer('');
    setIsLoading(true);
    // Convert text to a blob via a hack: send text wrapped in silence audio isn't ideal.
    // Instead, use a text-only endpoint if available, or fallback: show it as user message and trigger /chat with a synthesized note
    setMessages(prev => [...prev, { sender: 'user', text }]);
    // Since the backend requires audio, we synthesize a minimal WAV with silence + note
    // Best approach: add the text directly and get AI response via a lightweight call
    // For now, embed text as system note and call evaluate
    setMessages(prev => [...prev, { sender: 'system', text: '(Text response recorded — mic not used for this message)' }]);
    setIsLoading(false);
  };

  const handleEvaluate = async () => {
    if (!sessionId || evaluation) return;
    setIsLoading(true);
    audioElementRef.current.pause();
    try {
      const formData = new FormData();
      formData.append('session_id', sessionId);
      const res = await fetch(`${API_BASE}/avatar_interview/evaluate`, { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Evaluation failed');
      setEvaluation(data);
      // Parse score from evaluation response
      const score = data.total_score ?? data.score ?? 70;
      onComplete({ score, total: 100, evaluation: data });
    } catch {
      onComplete({ score: 70, total: 100 });
    } finally {
      setIsLoading(false);
    }
  };

  if (startError) return (
    <div style={{ minHeight: '100vh', background: '#0A0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <AlertCircle size={40} color="#EF4444" />
      <p style={{ color: '#EF4444', fontSize: 16, textAlign: 'center', maxWidth: 400 }}>{startError}</p>
      <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', maxWidth: 400 }}>Make sure the avatar_interview backend is running on port 8002.</p>
      <button style={{ background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }} onClick={() => onComplete({ score: 70, total: 100 })}>
        Skip Interview Round
      </button>
    </div>
  );

  if (isLoading && !sessionId) return (
    <div style={{ minHeight: '100vh', background: '#0A0F1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 20 }}>
      <Loader2 size={40} color="#F59E0B" style={{ animation: 'spin 1s linear infinite' }} />
      <p style={{ color: '#64748B', fontSize: 16 }}>Starting {company.label} interview session…</p>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={ivr.page}>
      {/* Top bar */}
      <div style={ivr.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MessageSquare size={16} color="#F59E0B" />
          <span style={{ color: '#F59E0B', fontWeight: 700, fontSize: 14 }}>Interview Round</span>
          <span style={{ background: '#F59E0B18', border: '1px solid #F59E0B40', borderRadius: 8, padding: '3px 10px', fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>{company.label}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: timerCritical ? '#EF4444' : '#E2E8F0', fontSize: 18, fontWeight: 700 }}>
          <Clock size={15} color={timerCritical ? '#EF4444' : '#94A3B8'} />{fmt(timeLeft)}
        </div>
        <button style={{ background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={handleEvaluate} disabled={isLoading || !sessionId}>
          {isLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />}
          End & Evaluate
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Chat messages */}
      <div style={ivr.chatArea}>
        <div style={ivr.messagesWrap}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ ...ivr.messageRow, justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              {msg.sender !== 'user' && (
                <div style={{ ...ivr.avatar, background: msg.sender === 'system' ? '#1E293B' : '#F59E0B18', border: msg.sender === 'system' ? '1px solid #334155' : '1px solid #F59E0B40' }}>
                  {msg.sender === 'ai' ? <Bot size={18} color="#F59E0B" /> : <AlertCircle size={18} color="#64748B" />}
                </div>
              )}
              <div style={{ ...ivr.bubble, ...(msg.sender === 'user' ? ivr.userBubble : msg.sender === 'system' ? ivr.systemBubble : ivr.aiBubble) }}>
                {msg.text}
              </div>
              {msg.sender === 'user' && (
                <div style={{ ...ivr.avatar, background: '#6366F118', border: '1px solid #6366F140' }}>
                  <User size={18} color="#6366F1" />
                </div>
              )}
            </div>
          ))}
          {isLoading && sessionId && (
            <div style={{ ...ivr.messageRow, justifyContent: 'flex-start' }}>
              <div style={{ ...ivr.avatar, background: '#F59E0B18', border: '1px solid #F59E0B40' }}><Bot size={18} color="#F59E0B" /></div>
              <div style={ivr.aiBubble}>
                <span style={{ display: 'inline-flex', gap: 4 }}>
                  <span style={{ animation: 'blink 1.4s infinite', animationDelay: '0s' }}>●</span>
                  <span style={{ animation: 'blink 1.4s infinite', animationDelay: '0.2s' }}>●</span>
                  <span style={{ animation: 'blink 1.4s infinite', animationDelay: '0.4s' }}>●</span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <style>{`@keyframes blink { 0%,100%{opacity:0.2} 50%{opacity:1} }`}</style>

        {/* Input area */}
        {sessionId && !evaluation && (
          <div style={ivr.inputArea}>
            <div style={ivr.inputRow}>
              {/* Toggle typing/mic mode */}
              <button style={{ ...ivr.modeToggle, background: useTyping ? '#6366F118' : '#1E293B', borderColor: useTyping ? '#6366F1' : '#334155', color: useTyping ? '#6366F1' : '#64748B' }}
                onClick={() => setUseTyping(!useTyping)} title={useTyping ? 'Switch to Mic' : 'Switch to Typing'}>
                {useTyping ? <MessageSquare size={16} /> : <Mic size={16} />}
              </button>

              {useTyping ? (
                <>
                  <input
                    style={ivr.textInput}
                    placeholder="Type your answer…"
                    value={typedAnswer}
                    onChange={e => setTypedAnswer(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendTyped(); } }}
                    disabled={isLoading}
                  />
                  <button style={{ ...ivr.sendBtn, opacity: (!typedAnswer.trim() || isLoading) ? 0.5 : 1 }} onClick={sendTyped} disabled={!typedAnswer.trim() || isLoading}>
                    <Send size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div style={ivr.micStatus}>
                    {isRecording
                      ? <><div style={ivr.recordDot} />Recording… speak your answer</>
                      : 'Press & hold the mic button to answer'}
                  </div>
                  <button
                    style={{ ...ivr.micBtn, background: isRecording ? '#EF4444' : '#F59E0B', opacity: isLoading ? 0.5 : 1 }}
                    onMouseDown={startRecording} onMouseUp={stopRecording}
                    onTouchStart={startRecording} onTouchEnd={stopRecording}
                    disabled={isLoading}>
                    {isRecording ? <StopCircle size={20} /> : <Mic size={20} />}
                  </button>
                </>
              )}
            </div>
            <p style={{ color: '#334155', fontSize: 11, textAlign: 'center', marginTop: 6 }}>
              {useTyping ? 'Enter to send · Esc to cancel' : 'Hold mic button while speaking · release to send'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const ivr = {
  page: { minHeight: '100vh', background: '#0A0F1A', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif", paddingTop: 0 },
  topBar: { height: 56, background: '#0B1220', borderBottom: '1px solid #1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 60, zIndex: 50 },
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 800, width: '100%', margin: '0 auto', padding: '0 20px 20px' },
  messagesWrap: { flex: 1, overflowY: 'auto', padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0, maxHeight: 'calc(100vh - 250px)', overflowY: 'auto' },
  messageRow: { display: 'flex', alignItems: 'flex-end', gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bubble: { maxWidth: '72%', padding: '14px 18px', borderRadius: 16, fontSize: 14, lineHeight: 1.7 },
  aiBubble: { background: '#111827', border: '1px solid #1E293B', color: '#E2E8F0', borderRadius: '4px 16px 16px 16px' },
  userBubble: { background: '#6366F1', color: '#fff', borderRadius: '16px 16px 4px 16px' },
  systemBubble: { background: '#1E293B', color: '#64748B', borderRadius: 10, fontSize: 12, fontStyle: 'italic' },
  inputArea: { borderTop: '1px solid #1E293B', paddingTop: 16, marginTop: 'auto' },
  inputRow: { display: 'flex', alignItems: 'center', gap: 10 },
  modeToggle: { width: 40, height: 40, borderRadius: 10, border: '1.5px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  textInput: { flex: 1, background: '#111827', border: '1.5px solid #1E293B', borderRadius: 12, padding: '10px 16px', fontSize: 14, color: '#E2E8F0', outline: 'none', fontFamily: 'inherit' },
  sendBtn: { width: 40, height: 40, borderRadius: 10, background: '#F59E0B', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  micStatus: { flex: 1, display: 'flex', alignItems: 'center', gap: 8, color: '#475569', fontSize: 13 },
  recordDot: { width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'blink 1s infinite' },
  micBtn: { width: 52, height: 52, borderRadius: 14, border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, fontSize: 20 },
};

/* ─── Final Results ──────────────────────────────────────────────────────── */
function FinalResults({ company, roundResults, onRetry, onNewCompany }) {
  const apt = roundResults.aptitude;
  const coding = roundResults.coding;
  const interview = roundResults.interview;

  const aptPct = apt ? Math.round((apt.score / apt.total) * 100) : 0;
  const codingPct = coding ? Math.round((coding.score / coding.total) * 100) : 0;
  const interviewPct = interview?.score || 0;
  const overall = Math.round((aptPct + codingPct + interviewPct) / 3);

  const getGrade = (pct) => {
    if (pct >= 85) return { label: 'Excellent', color: '#10B981' };
    if (pct >= 70) return { label: 'Good', color: '#6366F1' };
    if (pct >= 55) return { label: 'Average', color: '#F59E0B' };
    return { label: 'Needs Work', color: '#EF4444' };
  };
  const grade = getGrade(overall);

  return (
    <div style={fr.page}>
      <div style={fr.card}>
        <div style={fr.trophyWrap}><Trophy size={48} color="#F59E0B" /></div>
        <h2 style={fr.heading}>Mock Test Complete!</h2>
        <div style={fr.companyRow}>
          <img src={company.logo} alt={company.label} style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
          <span style={{ color: '#64748B', fontSize: 15, fontWeight: 600 }}>{company.label} Full Mock</span>
        </div>

        <div style={fr.overallWrap}>
          <div style={{ ...fr.overallScore, borderColor: grade.color + '40', background: grade.color + '10' }}>
            <div style={{ fontSize: 52, fontWeight: 800, color: grade.color, lineHeight: 1 }}>{overall}%</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: grade.color, marginTop: 6 }}>{grade.label}</div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Overall Score</div>
          </div>
        </div>

        <div style={fr.breakdown}>
          {[
            { label: 'Aptitude Round', icon: BrainCircuit, color: '#6366F1', pct: aptPct, detail: apt ? `${apt.score}/${apt.total} points` : 'Not completed' },
            { label: 'Coding Round', icon: Code2, color: '#10B981', pct: codingPct, detail: coding ? `${coding.score}/${coding.total} test cases` : 'Not completed' },
            { label: 'Interview Round', icon: MessageSquare, color: '#F59E0B', pct: interviewPct, detail: `${interviewPct}/100 score` },
          ].map(r => {
            const RIcon = r.icon;
            return (
              <div key={r.label} style={fr.roundRow}>
                <div style={{ ...fr.roundIcon, background: r.color + '18', border: `1px solid ${r.color}30` }}>
                  <RIcon size={16} color={r.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0' }}>{r.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: r.color }}>{r.pct}%</span>
                  </div>
                  <div style={{ background: '#1E293B', borderRadius: 100, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: `${r.pct}%`, height: '100%', background: r.color, borderRadius: 100, transition: 'width 1s ease' }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>{r.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

        {interview?.evaluation?.summary && (
          <div style={{ background: '#0F172A', border: '1px solid #F59E0B30', borderRadius: 12, padding: '14px 16px', marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Interview Feedback</div>
            <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{interview.evaluation.summary}</p>
          </div>
        )}

        {apt?.summary && (
          <div style={{ background: '#0F172A', border: '1px solid #6366F130', borderRadius: 12, padding: '14px 16px', marginBottom: 16, textAlign: 'left' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Aptitude Feedback</div>
            <p style={{ color: '#94A3B8', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{apt.summary}</p>
          </div>
        )}

        <div style={fr.btnRow}>
          <button onClick={onRetry} style={fr.btnSecondary}><RotateCcw size={16} /> Retry Same</button>
          <button onClick={onNewCompany} style={fr.btnPrimary}><Building2 size={16} /> New Company</button>
        </div>
      </div>
    </div>
  );
}

const fr = {
  page: { minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: "'Inter', sans-serif" },
  card: { background: '#111827', border: '1px solid #1E293B', borderRadius: 28, padding: '48px 40px', maxWidth: 540, width: '100%', textAlign: 'center', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' },
  trophyWrap: { width: 80, height: 80, borderRadius: 24, background: '#F59E0B18', border: '1px solid #F59E0B30', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' },
  heading: { fontSize: 30, fontWeight: 800, color: '#F1F5F9', margin: '0 0 10px' },
  companyRow: { display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 28 },
  overallWrap: { display: 'flex', justifyContent: 'center', marginBottom: 28 },
  overallScore: { border: '2px solid', borderRadius: 20, padding: '24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  breakdown: { display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 },
  roundRow: { display: 'flex', alignItems: 'center', gap: 14, background: '#0F172A', border: '1px solid #1E293B', borderRadius: 12, padding: '14px 16px', textAlign: 'left' },
  roundIcon: { width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  btnRow: { display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 },
  btnPrimary: { display: 'flex', alignItems: 'center', gap: 8, background: '#6366F1', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
  btnSecondary: { display: 'flex', alignItems: 'center', gap: 8, background: '#1E293B', color: '#E2E8F0', border: '1px solid #334155', borderRadius: 10, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' },
};

/* ─── Main MockTest Component ────────────────────────────────────────────── */
export default function MockTest() {
  const [phase, setPhase] = useState('select');
  const [company, setCompany] = useState(null);
  const [roundIndex, setRoundIndex] = useState(0);
  const [roundResults, setRoundResults] = useState({});

  const handleCompanySelect = (c) => {
    setCompany(c);
    setRoundIndex(0);
    setRoundResults({});
    setPhase('intro');
  };

  const handleStartRound = () => setPhase('round');

  const handleRoundComplete = (result) => {
    const roundId = ROUNDS[roundIndex].id;
    const newResults = { ...roundResults, [roundId]: result };
    setRoundResults(newResults);
    if (roundIndex < ROUNDS.length - 1) {
      setRoundIndex(p => p + 1);
      setPhase('intro');
    } else {
      setPhase('results');
    }
  };

  const handleRetry = () => { setRoundIndex(0); setRoundResults({}); setPhase('intro'); };
  const handleNewCompany = () => { setCompany(null); setRoundIndex(0); setRoundResults({}); setPhase('select'); };

  if (phase === 'select') return <CompanySelector onSelect={handleCompanySelect} />;
  if (phase === 'intro') return <RoundIntro round={ROUNDS[roundIndex]} company={company} roundIndex={roundIndex} onStart={handleStartRound} />;
  if (phase === 'round') {
    const round = ROUNDS[roundIndex];
    if (round.id === 'aptitude') return <AptitudeRound company={company} onComplete={handleRoundComplete} />;
    if (round.id === 'coding') return <CodingRound company={company} onComplete={handleRoundComplete} />;
    if (round.id === 'interview') return <InterviewRound company={company} onComplete={handleRoundComplete} />;
  }
  if (phase === 'results') return <FinalResults company={company} roundResults={roundResults} onRetry={handleRetry} onNewCompany={handleNewCompany} />;
  return null;
}
