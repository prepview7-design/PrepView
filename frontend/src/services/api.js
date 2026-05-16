import axios from 'axios';

const api = axios.create({
  baseURL:         import.meta.env.VITE_API_URL,
  withCredentials: true, // sends the HttpOnly cookie on every request
});

// ── Auth ──────────────────────────────────────────────────
export const registerUser = (data) => api.post('/auth/register', data);
export const loginUser    = (data) => api.post('/auth/login', data);
export const phoneLogin   = (data) => api.post('/auth/phone-login', data);
export const logoutUser   = ()     => api.post('/auth/logout');
export const getMe        = ()     => api.get('/auth/me');

// ── CV ────────────────────────────────────────────────────
export const uploadCV   = (formData) =>
  api.post('/cv/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
export const downloadCV = () => api.get('/cv/download', { responseType: 'blob' });

export default api;