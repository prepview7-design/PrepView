import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { uploadCV } from '../services/api';
import { useAuth } from '../context/AuthContext';

const CVUpload = () => {
  const { user, setUser } = useAuth();
  const navigate          = useNavigate();
  const [file, setFile]       = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFile = (f) => {
    if (f && f.type === 'application/pdf') {
      if (f.size > 5 * 1024 * 1024) {
        return toast.error('File too large — maximum 5 MB');
      }
      setFile(f);
    } else {
      toast.error('Please select a PDF file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return toast.error('Please select your CV first');
    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('cv', file);

    // Simulate progress
    const interval = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 10 : p));
    }, 200);

    try {
      const res = await uploadCV(formData);
      clearInterval(interval);
      setProgress(100);

      // Update user in context
      setUser((prev) => ({ ...prev, skills: res.data.skills }));
      toast.success('CV scanned! Skills extracted successfully.');
      setTimeout(() => navigate('/home'), 1000);
    } catch (err) {
      clearInterval(interval);
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>📄</div>
          <h1 style={s.title}>Upload Your CV</h1>
          <p style={s.subtitle}>
            We'll extract your skills, projects, and experience to build
            your personalised company feed and generate practice questions.
          </p>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('cv-input').click()}
          style={{
            ...s.dropZone,
            borderColor: dragging ? '#1a1a2e' : '#ddd',
            background:  dragging ? '#f0f0ff' : '#fafafa',
          }}
        >
          <input
            id="cv-input"
            type="file"
            accept=".pdf"
            hidden
            onChange={(e) => handleFile(e.target.files[0])}
          />
          {file ? (
            <div>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <p style={{ fontWeight: 600, color: '#1a1a2e' }}>{file.name}</p>
              <p style={{ fontSize: 13, color: '#888' }}>
                {(file.size / 1024).toFixed(1)} KB — Click to change
              </p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: 40, marginBottom: 8 }}>☁️</div>
              <p style={{ fontWeight: 500, color: '#333' }}>
                Drag & drop your CV here
              </p>
              <p style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                or click to browse — PDF only, max 5 MB
              </p>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {loading && (
          <div style={s.progressWrap}>
            <div style={{ ...s.progressBar, width: `${progress}%` }} />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || !file}
          style={{
            ...s.uploadBtn,
            background: loading || !file ? '#ccc' : '#1a1a2e',
            cursor:     loading || !file ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? `Uploading... ${progress}%` : 'Upload & Scan CV'}
        </button>

        {user?.cvPath && (
          <p style={{ textAlign: 'center', fontSize: 13, color: '#888', marginTop: 12 }}>
            You already have a CV uploaded. Uploading again will replace it.
          </p>
        )}
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
    background: '#f5f5f5',
    padding: '24px 16px',
  },
  card: {
    width: '100%',
    maxWidth: 500,
    background: '#fff',
    borderRadius: 16,
    padding: '36px 32px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  title:    { fontSize: 22, fontWeight: 700, color: '#1a1a2e', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#666', lineHeight: 1.6 },
  dropZone: {
    border: '2px dashed #ddd',
    borderRadius: 12,
    padding: '40px 20px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: 24,
    marginBottom: 16,
  },
  progressWrap: {
    height: 6,
    background: '#eee',
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    background: '#1a1a2e',
    borderRadius: 99,
    transition: 'width 0.2s',
  },
  uploadBtn: {
    width: '100%',
    padding: 13,
    borderRadius: 8,
    border: 'none',
    color: '#fff',
    fontSize: 15,
    fontWeight: 600,
  },
};

export default CVUpload;