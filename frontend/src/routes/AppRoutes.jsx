import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar    from '../components/Navbar';
import Login     from '../pages/Login';
import Register  from '../pages/Register';
import Home      from '../pages/Home';
import CVUpload  from '../pages/CVUpload';
import Profile   from '../pages/Profile';
import ApptiRound from '../pages/ApptiRound';
import AvatarInterview from '../pages/AvatarInterview';
import Compiler  from '../pages/Compiler';

// ── Private Route Guard ────────────────────────────────────
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

// ── Public Route — redirect if already logged in ──────────
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/home" replace />;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Navbar />
    <Routes>
      {/* Default */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* Public routes */}
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />

      {/* Protected routes */}
      <Route path="/home" element={
        <PrivateRoute><Home /></PrivateRoute>
      } />
      <Route path="/cv-upload" element={
        <PrivateRoute><CVUpload /></PrivateRoute>
      } />
      <Route path="/profile" element={
        <PrivateRoute><Profile /></PrivateRoute>
      } />
      <Route path="/appti-round" element={
        <PrivateRoute><ApptiRound /></PrivateRoute>
      } />
      <Route path="/avatar-interview" element={
        <PrivateRoute><AvatarInterview /></PrivateRoute>
      } />
      <Route path="/compiler" element={
        <PrivateRoute><Compiler /></PrivateRoute>
      } />

      {/* 404 fallback */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;