import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const COMPANY_CATEGORIES = [
  {
    name: 'Product Companies',
    icon: '🏢',
    desc: 'Google, Microsoft, Amazon, Flipkart',
    difficulty: 'Advanced',
    color: '#EEF2FF',
  },
  {
    name: 'Service Companies',
    icon: '🔧',
    desc: 'TCS, Infosys, Wipro, Cognizant',
    difficulty: 'Beginner',
    color: '#ECFDF3',
  },
  {
    name: 'Startups',
    icon: '🚀',
    desc: 'Zomato, Swiggy, Razorpay, CRED',
    difficulty: 'Intermediate',
    color: '#FFF7ED',
  },
  {
    name: 'Finance & BFSI',
    icon: '💹',
    desc: 'Goldman Sachs, JP Morgan, PayPal',
    difficulty: 'Advanced',
    color: '#FEF2F2',
  },
];

const QUICK_ACTIONS = [
  {
    label: 'Mock Interviews',
    icon: '🎤',
    desc: 'Practice AI-powered HR & technical interviews',
    path: '/avatar-interview',
  },

  {
    label: 'Aptitude Practice',
    icon: '📐',
    desc: 'Sharpen reasoning and quantitative aptitude',
    path: '/appti-round',
  },

  {
    label: 'Coding Compiler',
    icon: '💻',
    desc: 'Practice coding rounds in real time',
    path: '/compiler',
  },

  {
    label: 'Resume Analyzer',
    icon: '📄',
    desc: 'Improve your resume with AI insights',
    path: '/cv-upload',
  },
];

const Home = () => {
  const { user } = useAuth();

  const stats = [
  {
    label: 'Interview Readiness',
    value: `${user?.placementScore ?? 0}%`,
    icon: '🎯',
    sub: 'AI-calculated placement readiness',
  },

  {
    label: 'Day Streak',
    value: user?.streak ?? 0,
    icon: '🔥',
    sub: 'Consistency builds success',
  },

  {
    label: 'Practice Sessions',
    value: user?.totalPractices ?? 0,
    icon: '📚',
    sub: 'Total completed activities',
  },

  {
    label: 'Mock Interviews',
    value: user?.interviewsTaken ?? 0,
    icon: '🎤',
    sub: 'AI interview sessions completed',
  },

  {
    label: 'Aptitude Tests',
    value: user?.aptitudeTestsTaken ?? 0,
    icon: '🧠',
    sub: 'Logical reasoning practice tests',
  },

  {
    label: 'Skills Found',
    value: user?.skills?.length ?? 0,
    icon: '⚡',
    sub: 'Detected from resume & activity',
  },

  {
    label: 'Badges Earned',
    value: user?.badges?.length ?? 0,
    icon: '🏅',
    sub: 'Achievements unlocked',
  },
];

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* HERO SECTION */}
        <section style={styles.heroSection}>
          <div style={styles.heroContent}>
            <div style={styles.heroBadge}>✨ AI-Powered Career Prep Platform</div>

            <h1 style={styles.heroTitle}>
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>

            <p style={styles.heroSubtitle}>
              Track your progress, practice interviews, improve your resume,
              and prepare for top companies — all in one place.
            </p>

            <div style={styles.heroButtons}>
              {!user?.cvPath && (
                <Link to="/cv-upload" style={styles.primaryBtn}>
                  📄 Upload Resume
                </Link>
              )}

              <Link to="/appti-round" style={styles.secondaryBtn}>
                🚀 Start Practice
              </Link>
            </div>
          </div>

          <div style={styles.heroCard}>
            <div style={styles.heroCircle}></div>

            <div style={styles.heroMiniCard}>
              <span style={{ fontSize: 24 }}>📈</span>
              <div>
                <div style={styles.miniCardTitle}>Interview Readiness</div>
                <div style={styles.miniCardValue}>
                  {user?.placementScore ?? 0}%
                </div>
              </div>
            </div>

            <div style={styles.heroMiniCard2}>
              <span style={{ fontSize: 24 }}>🔥</span>
              <div>
                <div style={styles.miniCardTitle}>Current Streak</div>
                <div style={styles.miniCardValue}>
                  {user?.streak ?? 0} Days
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* STATS SECTION */}
        <section style={styles.sectionSpacing}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Dashboard Overview</h2>
              <p style={styles.sectionSubtitle}>
                Track your preparation progress and achievements.
              </p>
            </div>
          </div>

          <div style={styles.statsGrid}>
            {stats.map((stat) => (
              <div key={stat.label} style={styles.statCard}>
                <div style={styles.statIcon}>{stat.icon}</div>

                <div style={styles.statValue}>{stat.value}</div>

                <div style={styles.statLabel}>{stat.label}</div>

                <div style={styles.statSub}>{stat.sub}</div>
              </div>
            ))}
          </div>
        </section>


        {/* SKILLS SECTION */}
        {user?.skills?.length > 0 && (
          <section style={styles.sectionSpacing}>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>Your Skills</h2>
                <p style={styles.sectionSubtitle}>
                  Skills identified from your resume and activities.
                </p>
              </div>
            </div>

            <div style={styles.skillsWrapper}>
              {user.skills.map((skill) => (
                <div key={skill} style={styles.skillTag}>
                  ⚡ {skill}
                </div>
              ))}
            </div>
          </section>
        )}


        {/* COMPANY TRACKS */}
        <section style={styles.sectionSpacing}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Company Preparation Tracks</h2>
              <p style={styles.sectionSubtitle}>
                Practice interview patterns based on company categories.
              </p>
            </div>
          </div>

          <div style={styles.companyGrid}>
            {COMPANY_CATEGORIES.map((cat) => (
              <div key={cat.name} style={styles.companyCard}>
                <div
                  style={{
                    ...styles.companyIconWrap,
                    background: cat.color,
                  }}
                >
                  {cat.icon}
                </div>

                <div style={styles.companyDifficulty}>
                  {cat.difficulty}
                </div>

                <h3 style={styles.companyTitle}>{cat.name}</h3>

                <p style={styles.companyDesc}>{cat.desc}</p>

                <div style={styles.progressSection}>
                  <div style={styles.progressTop}>
                    <span>Preparation Progress</span>
                    <span>
                      {Math.min(
                        user?.placementScore ?? 0,
                        100
                      )}%
                    </span>
                  </div>

                  <div style={styles.progressBarBg}>
                  <div
                    style={{
                      ...styles.progressBar,

                      width: `${Math.min(
                        user?.placementScore ?? 0,
                        100
                      )}%`,
                    }}
                  ></div>
                  </div>
                </div>

                <button style={styles.practiceBtn}>
                  Continue Practice →
                </button>
              </div>
            ))}
          </div>
        </section>



        {/* MOCK TEST SECTION */}
        <section style={styles.sectionSpacing}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>🎯 Full Mock Tests</h2>
              <p style={styles.sectionSubtitle}>
                Company-wise mock tests with Aptitude, Coding & Interview rounds.
              </p>
            </div>
          </div>

          <div style={styles.mockTestBanner}>
            {/* Left: Slider of companies */}
            <div style={styles.mockLeft}>
              <div style={styles.mockBadge}>🚀 NEW FEATURE</div>
              <h3 style={styles.mockTitle}>Take a Company-Specific Mock Test</h3>
              <p style={styles.mockDesc}>
                Simulate a complete hiring process — Aptitude MCQs, a coding problem on our compiler, 
                and an AI-scored interview. Choose from TCS, Infosys, Wipro, Amazon, or Generic.
              </p>
              <div style={styles.mockCompanies}>
                {['TCS', 'Infosys', 'Wipro', 'Amazon', 'Generic'].map((c, i) => (
                  <span key={c} style={{ ...styles.mockCompanyTag, animationDelay: `${i * 0.1}s` }}>{c}</span>
                ))}
              </div>
              <div style={styles.mockRounds}>
                <div style={styles.mockRoundItem}>
                  <div style={{ ...styles.mockRoundIcon, background: '#EEF2FF', color: '#6366F1' }}>📐</div>
                  <div>
                    <div style={styles.mockRoundTitle}>Aptitude Round</div>
                    <div style={styles.mockRoundDesc}>10 MCQs · 20 min</div>
                  </div>
                </div>
                <div style={styles.mockRoundItem}>
                  <div style={{ ...styles.mockRoundIcon, background: '#ECFDF3', color: '#10B981' }}>💻</div>
                  <div>
                    <div style={styles.mockRoundTitle}>Coding Round</div>
                    <div style={styles.mockRoundDesc}>1 problem · 30 min</div>
                  </div>
                </div>
                <div style={styles.mockRoundItem}>
                  <div style={{ ...styles.mockRoundIcon, background: '#FFFBEB', color: '#F59E0B' }}>🎤</div>
                  <div>
                    <div style={styles.mockRoundTitle}>Interview Round</div>
                    <div style={styles.mockRoundDesc}>5 questions · 15 min</div>
                  </div>
                </div>
              </div>
              <Link to="/mock-test" style={styles.mockCTA}>
                🎯 Start Mock Test →
              </Link>
            </div>

            {/* Right: Visual */}
            <div style={styles.mockRight}>
              <div style={styles.mockRightCard}>
                <div style={styles.mockProgressLabel}>Overall Readiness</div>
                {[
                  { label: 'Aptitude', color: '#6366F1', pct: 75 },
                  { label: 'Coding', color: '#10B981', pct: 60 },
                  { label: 'Interview', color: '#F59E0B', pct: 82 },
                ].map(bar => (
                  <div key={bar.label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6B7280', marginBottom: 6 }}>
                      <span>{bar.label}</span><span>{bar.pct}%</span>
                    </div>
                    <div style={{ height: 8, background: '#F3F4F6', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{ width: `${bar.pct}%`, height: '100%', background: bar.color, borderRadius: 999 }} />
                    </div>
                  </div>
                ))}
                <div style={styles.mockScore}>
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#2D336B' }}>72%</span>
                  <span style={{ fontSize: 13, color: '#6B7280' }}>Mock Score</span>
                </div>
              </div>
            </div>
          </div>
        </section>


        {/* QUICK ACTIONS */}
        <section style={styles.sectionSpacing}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>Quick Actions</h2>
              <p style={styles.sectionSubtitle}>
                Jump directly into practice and preparation.
              </p>
            </div>
          </div>

          <div style={styles.actionGrid}>
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.label} to={action.path} style={styles.actionCard}>
                <div style={styles.actionIcon}>{action.icon}</div>

                <div>
                  <div style={styles.actionTitle}>{action.label}</div>
                  <div style={styles.actionDesc}>{action.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

const styles = {
  page: {
    background: '#F5F7FB',
    minHeight: '100vh',
    padding: '32px 24px',
    fontFamily: 'Inter, sans-serif',
  },

  container: {
    maxWidth: '1300px',
    margin: '0 auto',
  },

  heroSection: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: '28px',
    background: 'linear-gradient(135deg, #2D336B 0%, #3F4AA1 100%)',
    borderRadius: '28px',
    padding: '48px',
    color: '#fff',
    overflow: 'hidden',
    position: 'relative',
    marginBottom: '40px',
  },

  heroContent: {
    position: 'relative',
    zIndex: 2,
  },

  heroBadge: {
    display: 'inline-block',
    padding: '8px 14px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.15)',
    fontSize: '13px',
    fontWeight: 600,
    marginBottom: '22px',
    backdropFilter: 'blur(10px)',
  },

  heroTitle: {
    fontSize: '46px',
    fontWeight: 800,
    lineHeight: 1.1,
    marginBottom: '16px',
    fontFamily: 'Poppins, sans-serif',
  },

  heroSubtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 1.8,
    maxWidth: '580px',
    marginBottom: '30px',
  },

  heroButtons: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap',
  },

  primaryBtn: {
    padding: '14px 22px',
    borderRadius: '14px',
    background: '#fff',
    color: '#2D336B',
    textDecoration: 'none',
    fontWeight: 700,
    fontSize: '14px',
    boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
  },

  secondaryBtn: {
    padding: '14px 22px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.25)',
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '14px',
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(12px)',
  },

  heroCard: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },

  heroCircle: {
    width: '260px',
    height: '260px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.12)',
    position: 'absolute',
    filter: 'blur(0px)',
  },

  heroMiniCard: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: '#fff',
    color: '#111827',
    borderRadius: '18px',
    padding: '18px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
  },

  heroMiniCard2: {
    position: 'absolute',
    bottom: '20px',
    left: '20px',
    background: '#fff',
    color: '#111827',
    borderRadius: '18px',
    padding: '18px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    boxShadow: '0 15px 40px rgba(0,0,0,0.12)',
  },

  miniCardTitle: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '4px',
  },

  miniCardValue: {
    fontSize: '20px',
    fontWeight: 700,
  },

  sectionSpacing: {
    marginBottom: '42px',
  },

  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '22px',
  },

  sectionTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '6px',
    fontFamily: 'Poppins, sans-serif',
  },

  sectionSubtitle: {
    fontSize: '15px',
    color: '#6B7280',
  },

  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '22px',
  },

  statCard: {
    background: '#fff',
    borderRadius: '24px',
    padding: '28px',
    border: '1px solid #EEF2F7',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
    transition: '0.3s ease',
  },

  statIcon: {
    width: '58px',
    height: '58px',
    borderRadius: '18px',
    background: '#EEF2FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    marginBottom: '18px',
  },

  statValue: {
    fontSize: '38px',
    fontWeight: 800,
    color: '#111827',
    marginBottom: '6px',
  },

  statLabel: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '4px',
  },

  statSub: {
    fontSize: '13px',
    color: '#6B7280',
  },

  skillsWrapper: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
  },

  skillTag: {
    padding: '12px 18px',
    borderRadius: '999px',
    background: '#EEF2FF',
    color: '#2D336B',
    fontSize: '14px',
    fontWeight: 600,
    border: '1px solid #DCE4FF',
  },

  companyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '24px',
  },

  companyCard: {
    background: '#fff',
    borderRadius: '24px',
    padding: '26px',
    border: '1px solid #EEF2F7',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
  },

  companyIconWrap: {
    width: '68px',
    height: '68px',
    borderRadius: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '30px',
    marginBottom: '18px',
  },

  companyDifficulty: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '999px',
    background: '#F3F4F6',
    fontSize: '12px',
    fontWeight: 700,
    color: '#374151',
    marginBottom: '16px',
  },

  companyTitle: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '10px',
    fontFamily: 'Poppins, sans-serif',
  },

  companyDesc: {
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: 1.7,
    marginBottom: '22px',
  },

  progressSection: {
    marginBottom: '22px',
  },

  progressTop: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '8px',
  },

  progressBarBg: {
    height: '10px',
    background: '#E5E7EB',
    borderRadius: '999px',
    overflow: 'hidden',
  },

  progressBar: {
  height: '100%',
  background: 'linear-gradient(90deg, #2D336B, #5B8DEF)',
  borderRadius: '999px',
  },

  practiceBtn: {
    width: '100%',
    padding: '14px',
    borderRadius: '14px',
    border: 'none',
    background: '#2D336B',
    color: '#fff',
    fontWeight: 700,
    cursor: 'pointer',
    fontSize: '14px',
  },

  actionGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '20px',
  },

  actionCard: {
    background: '#fff',
    borderRadius: '22px',
    padding: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '18px',
    textDecoration: 'none',
    border: '1px solid #EEF2F7',
    boxShadow: '0 10px 30px rgba(15, 23, 42, 0.04)',
  },

  actionIcon: {
    width: '62px',
    height: '62px',
    borderRadius: '18px',
    background: '#EEF2FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    flexShrink: 0,
  },

  actionTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '6px',
  },


  mockTestBanner: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '28px',
    background: 'linear-gradient(135deg, #1a1a3e 0%, #2D336B 100%)',
    borderRadius: '28px',
    padding: '40px',
    color: '#fff',
    overflow: 'hidden',
    position: 'relative',
  },

  mockLeft: { display: 'flex', flexDirection: 'column', gap: '16px' },

  mockBadge: {
    display: 'inline-block',
    padding: '5px 12px',
    borderRadius: '999px',
    background: 'rgba(245,158,11,0.2)',
    border: '1px solid rgba(245,158,11,0.4)',
    fontSize: '11px',
    fontWeight: 700,
    color: '#F59E0B',
    letterSpacing: '0.06em',
    width: 'fit-content',
  },

  mockTitle: {
    fontSize: '26px',
    fontWeight: 800,
    margin: 0,
    lineHeight: 1.2,
    color: '#fff',
  },

  mockDesc: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.8,
    margin: 0,
  },

  mockCompanies: { display: 'flex', gap: '8px', flexWrap: 'wrap' },

  mockCompanyTag: {
    padding: '5px 12px',
    borderRadius: '999px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.2)',
    fontSize: '12px',
    fontWeight: 600,
    color: '#fff',
  },

  mockRounds: { display: 'flex', flexDirection: 'column', gap: '10px' },

  mockRoundItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    background: 'rgba(255,255,255,0.07)',
    borderRadius: '12px',
    padding: '12px 16px',
    border: '1px solid rgba(255,255,255,0.1)',
  },

  mockRoundIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    flexShrink: 0,
  },

  mockRoundTitle: { fontSize: '14px', fontWeight: 700, color: '#fff' },

  mockRoundDesc: { fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginTop: '2px' },

  mockCTA: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '14px 24px',
    borderRadius: '14px',
    background: '#F59E0B',
    color: '#000',
    textDecoration: 'none',
    fontWeight: 800,
    fontSize: '15px',
    width: 'fit-content',
    boxShadow: '0 8px 24px rgba(245,158,11,0.3)',
  },

  mockRight: { display: 'flex', alignItems: 'center', justifyContent: 'center' },

  mockRightCard: {
    background: '#fff',
    borderRadius: '20px',
    padding: '24px',
    width: '100%',
    maxWidth: '280px',
    boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
  },

  mockProgressLabel: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#111827',
    marginBottom: '18px',
  },

  mockScore: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #F3F4F6',
    marginTop: '8px',
  },

  actionDesc: {
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: 1.7,
  },
};

export default Home;