import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { registerUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import prepviewLogo from '../assets/PrepViewLogo.png';


const Register = () => {
  const { setUser } = useAuth();
  const navigate    = useNavigate();
  const [form, setForm]     = useState({
    name: '', email: '', password: '', confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      const res = await registerUser({
        name:     form.name,
        email:    form.email,
        password: form.password,
      });
      setUser(res.data);
      toast.success('Account created! Upload your CV to get started.');
      navigate('/cv-upload');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { name: 'name',            label: 'Full Name',        type: 'text' },
    { name: 'email',           label: 'College Email',    type: 'email' },
    { name: 'password',        label: 'Password',         type: 'password' },
    { name: 'confirmPassword', label: 'Confirm Password', type: 'password' },
  ];

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
                    src={prepviewLogo}
                    alt="PrepView Logo"
                    style={s.logo}
                  />
          <h1 style={s.title}>Create your account</h1>
          <p style={s.subtitle}>Start your placement preparation journey</p>
        </div>

        <form onSubmit={handleSubmit}>
          {fields.map((f) => (
            <input
              key={f.name}
              name={f.name}
              type={f.type}
              placeholder={f.label}
              required
              value={form[f.name]}
              onChange={handleChange}
              style={s.input}
            />
          ))}
          <button type="submit" disabled={loading} style={s.submitBtn}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={s.footer}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#1a1a2e', fontWeight: 600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
};

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FBF7F2',
    padding: '24px 16px',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    background: '#F4ECE0',
    borderRadius: 16,
    padding: '36px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    border:'0.5px solid black',
  },
  logo: {
  width: 90,
  height: 90,
  objectFit: 'contain',
  marginBottom: 12,
},
  title:  { fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#888' },
  input: {
    width: '100%',
    padding: '11px 14px',
    borderRadius: 8,
    border: '1px solid #ddd',
    fontSize: 14,
    marginBottom: 12,
    outline: 'none',
    boxSizing: 'border-box',
    display: 'block',
  },
  submitBtn: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    border: 'none',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
  footer: { textAlign: 'center', marginTop: 20, fontSize: 14, color: '#666' },
};

export default Register;