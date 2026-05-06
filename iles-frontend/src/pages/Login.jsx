import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      toast.success(`Welcome back, ${user.first_name || user.username}!`);
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'workplace' || user.role === 'academic') navigate('/supervisor');
      else if (user.role === 'admin' || user.is_staff) navigate('/admin');
      else navigate('/');
    } catch {
      toast.error('Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Georgia', serif", background: '#0f1117' }}>
      
      {/* Left Panel */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '4rem', background: 'linear-gradient(145deg, #0f1117 0%, #1a1f2e 100%)',
        borderRight: '1px solid #2a2f3e', position: 'relative', overflow: 'hidden'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: '-100px', left: '-100px',
          width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-80px', right: '-80px',
          width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '22px', fontWeight: '900', color: 'white', letterSpacing: '-1px'
              }}>I</div>
              <span style={{ fontSize: '28px', fontWeight: '700', color: '#f1f5f9', letterSpacing: '-0.5px' }}>ILES</span>
            </div>
            <p style={{ color: '#64748b', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Internship Log & Evaluation System
            </p>
          </div>

          <h1 style={{ fontSize: '2.8rem', fontWeight: '700', color: '#f1f5f9', lineHeight: '1.15', marginBottom: '1rem' }}>
            Manage your<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              internship journey
            </span>
          </h1>
          <p style={{ color: '#64748b', fontSize: '16px', lineHeight: '1.7', maxWidth: '380px', marginBottom: '3rem' }}>
            A unified platform for students, supervisors, and administrators to track, evaluate, and manage internship experiences.
          </p>

          {/* Feature badges */}
          {[
            { icon: '📋', label: 'Weekly Log Tracking' },
            { icon: '✅', label: 'Supervisor Reviews' },
            { icon: '📊', label: 'Weighted Evaluations' },
            { icon: '📧', label: 'Email Notifications' },
          ].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px' }}>{icon}</span>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div style={{
        width: '480px', display: 'flex', flexDirection: 'column',
        justifyContent: 'center', padding: '4rem',
        background: '#0f1117'
      }}>
        <div style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>
            Sign in
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>
              Register here
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.5px' }}>
              USERNAME
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="Enter your username"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '10px',
                background: '#1a1f2e', border: '1px solid #2a2f3e',
                color: '#f1f5f9', fontSize: '15px', outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#2a2f3e'}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '28px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: '600', marginBottom: '8px', letterSpacing: '0.5px' }}>
              PASSWORD
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: '10px',
                background: '#1a1f2e', border: '1px solid #2a2f3e',
                color: '#f1f5f9', fontSize: '15px', outline: 'none',
                boxSizing: 'border-box', transition: 'border-color 0.2s',
                fontFamily: 'inherit'
              }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = '#2a2f3e'}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '15px',
              background: loading ? '#4b4f6b' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px', transition: 'opacity 0.2s', fontFamily: 'inherit'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        {/* Test credentials hint */}
        <div style={{
          marginTop: '2rem', padding: '16px', borderRadius: '10px',
          background: '#1a1f2e', border: '1px solid #2a2f3e'
        }}>
          <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '8px', fontWeight: '600', letterSpacing: '0.5px' }}>
            TEST CREDENTIALS
          </p>
          {[
            ['Admin', 'admin', 'admin123'],
            ['Supervisor', 'supervisor1', 'supervisor123'],
            ['Student', 'student1', 'student123'],
          ].map(([role, user, pass]) => (
            <div key={role} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ color: '#6366f1', fontSize: '12px', fontWeight: '600' }}>{role}</span>
              <span style={{ color: '#64748b', fontSize: '12px' }}>{user} / {pass}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
