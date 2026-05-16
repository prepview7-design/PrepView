import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

const COMPANY_CATEGORIES = [
  { name: 'Product Companies', icon: '🏢', desc: 'Google, Microsoft, Amazon, Flipkart' },
  { name: 'Service Companies', icon: '🔧', desc: 'TCS, Infosys, Wipro, Cognizant' },
  { name: 'Startups',          icon: '🚀', desc: 'Zomato, Swiggy, Razorpay, CRED' },
  { name: 'Finance & BFSI',    icon: '💹', desc: 'Goldman Sachs, JP Morgan, PayPal' },
];

const Home = () => {
  const { user } = useAuth();

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 20px' }}>

      {/* ── Welcome Banner ── */}
      <div style={s.banner}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: '#888', fontSize: 14 }}>
            Your AI-powered interview preparation hub
          </p>
        </div>
        {!user?.cvPath && (
          <Link to="/cv-upload" style={s.uploadPrompt}>
            📄 Upload your CV to get started
          </Link>
        )}
      </div>

      {/* ── Stats ── */}
      <div style={s.statsGrid}>
        {[
          { label: 'Placement Score', value: user?.placementScore ?? 0, icon: '🎯' },
          { label: 'Day Streak',      value: user?.streak ?? 0,         icon: '🔥' },
          { label: 'Skills Found',    value: user?.skills?.length ?? 0, icon: '⚡' },
          { label: 'Badges Earned',   value: user?.badges?.length ?? 0, icon: '🏅' },
        ].map((stat) => (
          <div key={stat.label} style={s.statCard}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1a1a2e' }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Skills ── */}
      {user?.skills?.length > 0 && (
        <div style={s.section}>
          <h2 style={s.sectionTitle}>Your Skills</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {user.skills.map((skill) => (
              <span key={skill} style={s.skillTag}>{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Company Feed ── */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Company Categories</h2>
        <div style={s.companyGrid}>
          {COMPANY_CATEGORIES.map((cat) => (
            <div key={cat.name} style={s.companyCard}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>{cat.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{cat.name}</h3>
              <p style={{ fontSize: 13, color: '#888' }}>{cat.desc}</p>
              <button style={s.practiceBtn}>Practice →</button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={s.section}>
        <h2 style={s.sectionTitle}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { label: 'Start Mock Test',   icon: '🧪', path: '#' },
            { label: 'Aptitude Practice', icon: '📐', path: '#' },
            { label: 'Coding Rounds',     icon: '💻', path: '#' },
            { label: 'HR Preparation',    icon: '🤝', path: '#' },
          ].map((a) => (
            <Link key={a.label} to={a.path} style={s.actionBtn}>
              {a.icon} {a.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const s = {
  banner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 28,
  },
  uploadPrompt: {
    padding: '10px 18px',
    background: '#1a1a2e',
    color: '#fff',
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 16px',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid #f0f0f0',
  },
  section:      { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: '#1a1a2e', marginBottom: 14 },
  skillTag: {
    padding: '5px 12px',
    background: '#eef0ff',
    color: '#1a1a2e',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
  },
  companyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  companyCard: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid #f0f0f0',
  },
  practiceBtn: {
    marginTop: 12,
    padding: '7px 14px',
    borderRadius: 6,
    border: '1px solid #1a1a2e',
    background: '#fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
  },
  actionBtn: {
    padding: '10px 16px',
    background: '#f5f5f5',
    borderRadius: 8,
    fontSize: 14,
    color: '#1a1a2e',
    fontWeight: 500,
    textDecoration: 'none',
    border: '1px solid #e5e5e5',
  },
};

export default Home;