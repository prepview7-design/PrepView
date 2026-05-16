import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth } from '../firebase';
import { loginUser, phoneLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import prepviewLogo from '../assets/PrepViewLogo.png';

const API = import.meta.env.VITE_API_URL;

const Login = () => {
  const { setUser } = useAuth();
  const navigate    = useNavigate();

  const [tab, setTab]             = useState('email'); // 'email' | 'phone'
  const [emailForm, setEmailForm] = useState({ email: '', password: '' });
  const [phone, setPhone]         = useState('');
  const [otp, setOtp]             = useState('');
  const [otpSent, setOtpSent]     = useState(false);
  const [loading, setLoading]     = useState(false);
  const confirmationRef           = useRef(null);

  // Clean up recaptcha on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    };
  }, []);

  // ── Email / Password Login ────────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginUser(emailForm);
      setUser(res.data);
      toast.success('Welcome back!');
      navigate('/home');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Send OTP via Firebase ─────────────────────────────────
  const handleSendOtp = async () => {
    if (!phone || phone.length < 10) {
      return toast.error('Enter a valid phone number with country code');
    }
    setLoading(true);
    try {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(
          auth,
          'recaptcha-container',
          { size: 'invisible' }
        );
      }
      const confirmation = await signInWithPhoneNumber(
        auth,
        phone,
        window.recaptchaVerifier
      );
      confirmationRef.current = confirmation;
      setOtpSent(true);
      toast.success('OTP sent to ' + phone);
    } catch (err) {
      toast.error('Failed to send OTP: ' + err.message);
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP then call backend ──────────────────────────
  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      return toast.error('Enter the 6-digit OTP');
    }
    setLoading(true);
    try {
      const result      = await confirmationRef.current.confirm(otp);
      const firebaseUid = result.user.uid;
      const res = await phoneLogin({
        phone,
        firebaseUid,
        name: result.user.displayName || 'User',
      });
      setUser(res.data);
      toast.success('Logged in successfully!');
      navigate('/home');
    } catch (err) {
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth — redirect to backend ───────────────────
  const handleGoogleLogin = () => {
    window.location.href = `${API}/api/auth/google`;
  };

  // ── Twitter OAuth — redirect to backend ──────────────────
  const handleTwitterLogin = () => {
    window.location.href = `${API}/auth/twitter`;
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img
          src={prepviewLogo}
          alt="PrepView Logo"
          style={s.logo}
        />
          <h1 style={s.title}>Sign in to PrepView</h1>
          <p style={s.subtitle}>Your AI-powered placement preparation platform</p>
        </div>

        {/* ── OAuth Buttons ── */}
        <button onClick={handleGoogleLogin} style={s.oauthBtn}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#4285F4" d="M45.1 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h11.9c-.5 2.7-2 5-4.4 6.5v5.4h7.1c4.2-3.9 6.5-9.6 6.5-15.9z"/>
            <path fill="#34A853" d="M24 46c5.9 0 10.9-2 14.5-5.3l-7.1-5.4c-2 1.3-4.5 2.1-7.4 2.1-5.7 0-10.5-3.8-12.2-9H4.5v5.6C8.1 41.9 15.5 46 24 46z"/>
            <path fill="#FBBC05" d="M11.8 28.4c-.4-1.3-.7-2.7-.7-4.4s.2-3 .7-4.4v-5.6H4.5C2.9 17.2 2 20.5 2 24s.9 6.8 2.5 9.9l7.3-5.5z"/>
            <path fill="#EA4335" d="M24 9.5c3.2 0 6.1 1.1 8.4 3.2l6.3-6.3C34.9 3 29.9 1 24 1 15.5 1 8.1 5.1 4.5 11.6l7.3 5.5C13.5 11.3 18.3 9.5 24 9.5z"/>
          </svg>
          Continue with Google
        </button>

        <button onClick={handleTwitterLogin} style={{ ...s.oauthBtn, color: '#000', borderColor: '#000' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
          Continue with X (Twitter)
        </button>

        {/* ── Divider ── */}
        <div style={s.divider}>
          <hr style={s.hr} />
          <span style={s.dividerText}>or</span>
          <hr style={s.hr} />
        </div>

        {/* ── Tab Switch ── */}
        <div style={s.tabRow}>
          {[
            { key: 'email', label: 'Email & Password' },
            { key: 'phone', label: 'Phone OTP' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setOtpSent(false); }}
              style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Email Form ── */}
        {tab === 'email' && (
          <form onSubmit={handleEmailLogin} style={{ marginTop: 16 }}>
            <input
              type="email"
              placeholder="Email"
              required
              value={emailForm.email}
              onChange={(e) => setEmailForm({ ...emailForm, email: e.target.value })}
              style={s.input}
            />
            <input
              type="password"
              placeholder="Password"
              required
              value={emailForm.password}
              onChange={(e) => setEmailForm({ ...emailForm, password: e.target.value })}
              style={s.input}
            />
            <button type="submit" disabled={loading} style={s.submitBtn}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* ── Phone OTP Form ── */}
        {tab === 'phone' && (
          <div style={{ marginTop: 16 }}>
            <input
              type="tel"
              placeholder="Enter Phone number (e.g. +91 98xxxxxx10)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={s.input}
              disabled={otpSent}
            />

            {!otpSent ? (
              <button onClick={handleSendOtp} disabled={loading} style={s.submitBtn}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            ) : (
              <>
                <input
                  type="number"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  style={s.input}
                />
                <button onClick={handleVerifyOtp} disabled={loading} style={s.submitBtn}>
                  {loading ? 'Verifying...' : 'Verify & Sign In'}
                </button>
                <button
                  onClick={() => { setOtpSent(false); setOtp(''); }}
                  style={{ ...s.submitBtn, background: '#fff', color: '#333', border: '1px solid #ddd', marginTop: 8 }}
                >
                  Change Number
                </button>
              </>
            )}

            {/* Invisible reCAPTCHA container */}
            <div id="recaptcha-container" />
          </div>
        )}

        {/* ── Footer ── */}
        <p style={s.footer}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#1a1a2e', fontWeight: 600 }}>
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────
const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#FBF7F2',
  },
  
  card: {
    width: '100%',
    maxWidth: 420,
    background: '#F4ECE0',
    borderRadius: 16,
    border:'0.5px solid black',
    padding: '36px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',

  },
  logo: {
  width: 90,
  height: 90,
  objectFit: 'contain',
  marginBottom: 12,
},
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: '#1a1a2e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
  },
  oauthBtn: {
    width: '100%',
    padding: '11px 16px',
    borderRadius: 10,
    border: '1px solid #ddd',
    background: '#fff',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
    transition: 'background 0.15s',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    margin: '16px 0',
  },
  hr: { flex: 1, border: 'none', borderTop: '1px solid #e5e5e5' },
  dividerText: { fontSize: 12, color: '#aaa' },
  tabRow: {
    display: 'flex',
    gap: 8,
  },
  tab: {
    flex: 1,
    padding: '9px 8px',
    borderRadius: 8,
    border: '1px solid #ddd',
    background: '#fff',
    fontSize: 13,
    color: '#555',
    cursor: 'pointer',
  },
  tabActive: {
    background: '#1a1a2e',
    color: '#fff',
    border: '1px solid #1a1a2e',
    fontWeight: 600,
  },
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
    padding: '12px',
    borderRadius: 8,
    border: 'none',
    background: '#1a1a2e',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
    color: '#666',
  },
};

export default Login;