import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';

const Profile = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name:       user?.name       || '',
    college:    user?.college    || '',
    branch:     user?.branch     || '',
    year:       user?.year       || '',
    targetRole: user?.targetRole || '',
  });

  const handleSave = async () => {
    try {
      const res = await api.put('/auth/profile', form);
      setUser(res.data);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>My Profile</h1>

      {/* ── Avatar & Name ── */}
      <div style={s.card}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name}
              style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={s.avatarBig}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>{user?.name}</h2>
            <p style={{ color: '#888', fontSize: 14 }}>{user?.email || user?.phone}</p>
            <span style={s.providerBadge}>{user?.provider} account</span>
          </div>
        </div>

        {/* ── Editable Fields ── */}
        {['name', 'college', 'branch', 'year', 'targetRole'].map((field) => (
          <div key={field} style={s.fieldRow}>
            <label style={s.fieldLabel}>
              {field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
            </label>
            {editing ? (
              <input
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                style={s.fieldInput}
              />
            ) : (
              <span style={s.fieldValue}>{user?.[field] || '—'}</span>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {editing ? (
            <>
              <button onClick={handleSave}   style={s.saveBtn}>Save Changes</button>
              <button onClick={() => setEditing(false)} style={s.cancelBtn}>Cancel</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} style={s.editBtn}>Edit Profile</button>
          )}
        </div>
      </div>

      {/* ── Skills ── */}
      {user?.skills?.length > 0 && (
        <div style={s.card}>
          <h3 style={s.cardTitle}>Extracted Skills</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {user.skills.map((sk) => (
              <span key={sk} style={s.skillTag}>{sk}</span>
            ))}
          </div>
        </div>
      )}

      {/* ── Stats ── */}
      <div style={s.card}>
        <h3 style={s.cardTitle}>Your Stats</h3>
<div
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
  }}
>
  {[
    {
      label: 'Placement Score',
      value: user?.placementScore ?? 0,
      suffix: '%',
      icon: '🎯',
      color: '#EEF2FF',
    },
    {
      label: 'Day Streak',
      value: user?.streak ?? 0,
      suffix: ' days',
      icon: '🔥',
      color: '#FFF4E5',
    },
    {
      label: 'Badges',
      value: user?.badges?.length ?? 0,
      suffix: '',
      icon: '🏅',
      color: '#ECFDF3',
    },
    {
      label: 'Practice Sessions',
      value: user?.totalPractices ?? 0,
      suffix: '',
      icon: '📚',
      color: '#F3F4F6',
    },
    {
      label: 'Aptitude Tests',
      value: user?.aptitudeTestsTaken ?? 0,
      suffix: '',
      icon: '🧠',
      color: '#EEF2FF',
    },
    {
      label: 'Mock Interviews',
      value: user?.interviewsTaken ?? 0,
      suffix: '',
      icon: '🎤',
      color: '#FFF4E5',
    },
  ].map((st) => (
    <div
      key={st.label}
      style={{
        padding: 20,
        borderRadius: 16,
        background: st.color,
        border: '1px solid rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          fontSize: 28,
          marginBottom: 10,
        }}
      >
        {st.icon}
      </div>

      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: '#111827',
          marginBottom: 4,
        }}
      >
        {st.value}
        {st.suffix}
      </div>

      <div
        style={{
          fontSize: 13,
          color: '#6B7280',
          fontWeight: 500,
        }}
      >
        {st.label}
      </div>
    </div>
  ))}
</div>
      </div>

      <button onClick={handleLogout} style={s.logoutBtn}>Sign Out</button>
    </div>
  );
};

const s = {
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 24px',
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    border: '1px solid #f0f0f0',
  },
  cardTitle: { fontSize: 15, fontWeight: 600, marginBottom: 14 },
  avatarBig: {
    width: 64, height: 64, borderRadius: '50%',
    background: '#1a1a2e', color: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 24, fontWeight: 700,
  },
  providerBadge: {
    display: 'inline-block',
    padding: '2px 10px',
    background: '#eef0ff',
    color: '#1a1a2e',
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 500,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  fieldRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  fieldLabel: { fontSize: 13, color: '#888', fontWeight: 500 },
  fieldValue: { fontSize: 14, color: '#1a1a2e' },
  fieldInput: {
    padding: '6px 10px',
    borderRadius: 6,
    border: '1px solid #ddd',
    fontSize: 14,
    outline: 'none',
    width: 200,
  },
  saveBtn: {
    padding: '9px 18px', borderRadius: 8, border: 'none',
    background: '#1a1a2e', color: '#fff', fontSize: 14, cursor: 'pointer',
  },
  cancelBtn: {
    padding: '9px 18px', borderRadius: 8, border: '1px solid #ddd',
    background: '#fff', color: '#333', fontSize: 14, cursor: 'pointer',
  },
  editBtn: {
    padding: '9px 18px', borderRadius: 8, border: '1px solid #1a1a2e',
    background: '#fff', color: '#1a1a2e', fontSize: 14, cursor: 'pointer', fontWeight: 500,
  },
  skillTag: {
    padding: '5px 12px', background: '#eef0ff',
    color: '#1a1a2e', borderRadius: 20, fontSize: 13, fontWeight: 500,
  },
  logoutBtn: {
    width: '100%', padding: 12, borderRadius: 8,
    border: '1px solid #ff4d4d', background: '#fff',
    color: '#ff4d4d', fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
};

export default Profile;