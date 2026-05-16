import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/PrepViewLogoNavbarCropped.jpeg';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Don't show navbar on auth pages
  if (!user) return null;

  return (
    <nav style={styles.nav}>
      <div style={styles.container}>
        {/* Logo */}  
        <Link to="/home" style={styles.logo}>
          <img
            src={logo}
            alt="PrepView Logo"
            style={styles.logoImage}
          />
        </Link>

        {/* Links */}
        <div style={styles.links}>
          <Link to="/home"      style={styles.link}>Feed</Link>
          <Link to="/cv-upload" style={styles.link}>Upload CV</Link>
        </div>

        {/* User & Logout */}
        <div style={styles.right}>

  <Link to="/profile" style={styles.profileSection}>
    <div style={styles.avatar}>
      {user.avatar ? (
        <img
          src={user.avatar}
          alt={user.name}
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div style={styles.initials}>
          {user.name?.charAt(0).toUpperCase()}
        </div>
      )}
    </div>

    <span style={{ fontSize: 14, color: '#fff' }}>
      {user.name}
    </span>
  </Link>

  <button onClick={handleLogout} style={styles.logoutBtn}>
    Logout
  </button>

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
    color:'#e5e5e5',
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
  logoImage: {
  width: 100,
  height: 100,
  objectFit: 'contain',
  },  
  links: {
    display: 'flex',
    gap: 24,
  },
  link: {
    fontSize: 14,
    color: '#ffffff',
    textDecoration: 'none',
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  profileSection: {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  textDecoration: 'none',
  cursor: 'pointer',
},
  avatar: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    overflow: 'hidden',
  },
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