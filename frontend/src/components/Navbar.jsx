import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/PrepViewLogoNavbarCropped.jpeg';
import { FlaskConical, Layers } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        <Link to="/home" style={styles.logo}>
          <img src={logo} alt="PrepView Logo" style={styles.logoImage} />
        </Link>

        <div style={styles.links}>
          <Link to="/home" style={{ ...styles.link, ...(isActive('/home') ? styles.linkActive : {}) }}>Home</Link>
          <Link to="/cv-upload" style={{ ...styles.link, ...(isActive('/cv-upload') ? styles.linkActive : {}) }}>Upload CV</Link>
          <Link to="/appti-round" style={{ ...styles.link, ...(isActive('/appti-round') ? styles.linkActive : {}) }}>Aptitude Test</Link>
          <Link to="/avatar-interview" style={{ ...styles.link, ...(isActive('/avatar-interview') ? styles.linkActive : {}) }}>AI Interview</Link>
          <Link to="/compiler" style={{ ...styles.link, ...(isActive('/compiler') ? styles.linkActive : {}) }}>Compiler</Link>
          <Link to="/test" style={{ ...styles.link, ...styles.testLink, ...(isActive('/test') ? styles.testLinkActive : {}) }}>
            <FlaskConical size={14} style={{ flexShrink: 0 }} />
            Take a Test
          </Link>
          <Link to="/mock-test" style={{ ...styles.link, ...styles.mockLink, ...(isActive('/mock-test') ? styles.mockLinkActive : {}) }}>
            <Layers size={14} style={{ flexShrink: 0 }} />
            Mock Test
          </Link>
        </div>

        <div style={styles.right}>
          <Link to="/profile" style={styles.profileSection}>
            <div style={styles.avatar}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} style={{ width: 32, height: 32, borderRadius: '40%', objectFit: 'cover' }} />
              ) : (
                <div style={styles.initials}>{user.name?.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <span style={{ fontSize: 14, color: '#fff' }}>{user.name}</span>
          </Link>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

const styles = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 100,
    background: '#232E70',
    borderBottom: '1px solid #e5e5e5',
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    color: '#e5e5e5',
  },
  container: {
    width: '100%',
    margin: '0 auto',
    padding: '0 20px',
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 20,
    fontWeight: 700,
    color: '#ffffff',
    textDecoration: 'none',
  },
  logoImage: { width: 100, height: 100, objectFit: 'contain' },
  links: { display: 'flex', gap: 20, alignItems: 'center' },
  link: {
    fontSize: 14,
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 500,
    opacity: 0.85,
  },
  linkActive: {
    opacity: 1,
    borderBottom: '2px solid #60A5FA',
    paddingBottom: '2px',
  },
  testLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(37,99,235,0.25)',
    border: '1px solid rgba(96,165,250,0.4)',
    borderRadius: '8px',
    padding: '5px 12px',
    fontWeight: 700,
    opacity: 1,
  },
  testLinkActive: {
    background: 'rgba(37,99,235,0.5)',
    borderColor: '#60A5FA',
    borderBottom: 'none',
    paddingBottom: '5px',
  },
  right: { display: 'flex', alignItems: 'center', gap: 12 },
  profileSection: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', cursor: 'pointer' },
  avatar: { width: 32, height: 32, borderRadius: '50%', overflow: 'hidden' },
  initials: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#1a1a2e',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 600,
  },
  mockLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    background: 'rgba(99,102,241,0.2)',
    border: '1px solid rgba(99,102,241,0.4)',
    borderRadius: '8px',
    padding: '5px 12px',
    fontWeight: 700,
    opacity: 1,
    color: '#A5B4FC',
  },
  mockLinkActive: {
    background: 'rgba(99,102,241,0.45)',
    borderColor: '#A5B4FC',
    borderBottom: 'none',
    paddingBottom: '5px',
  },
  logoutBtn: {
    padding: '6px 14px',
    borderRadius: 8,
    border: '1px solid #ddd',
    background: '#fff',
    fontSize: 13,
    color: '#555',
    cursor: 'pointer',
  },
};

export default Navbar;
