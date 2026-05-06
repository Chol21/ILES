import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const inputStyle = {
  width: '100%', padding: '12px 14px', borderRadius: '10px',
  background: '#1a1f2e', border: '1px solid #2a2f3e',
  color: '#f1f5f9', fontSize: '14px', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s'
};
const labelStyle = {
  display: 'block', color: '#94a3b8', fontSize: '12px',
  fontWeight: '600', marginBottom: '6px', letterSpacing: '0.5px'
};

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '', email: '', password: '', password2: '',
    first_name: '', last_name: '', role: 'student',
    student_number: '', staff_number: '', phone_number: '', department: '',
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) { toast.error('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await api.post('/auth/register/', form);
      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      const errors = err.response?.data;
      if (errors) Object.values(errors).forEach(msg => toast.error(String(msg)));
      else toast.error('Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const focusStyle = (e) => { e.target.style.borderColor = '#6366f1'; };
  const blurStyle = (e) => { e.target.style.borderColor = '#2a2f3e'; };

  return (
    <div style={{ minHeight: '100vh', background: '#0f1117', fontFamily: "'Georgia', serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '1rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: '900', color: 'white' }}>I</div>
            <span style={{ fontSize: '22px', fontWeight: '700', color: '#f1f5f9' }}>ILES</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: '#f1f5f9', marginBottom: '8px' }}>Create your account</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#6366f1', textDecoration: 'none', fontWeight: '600' }}>Sign in</Link>
          </p>
        </div>

        {/* Form Card */}
        <div style={{ background: '#1a1f2e', borderRadius: '16px', border: '1px solid #2a2f3e', padding: '2rem' }}>
          <form onSubmit={handleSubmit}>

            {/* Name */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>FIRST NAME</label>
                <input type="text" name="first_name" value={form.first_name} onChange={handleChange} required placeholder="John" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div>
                <label style={labelStyle}>LAST NAME</label>
                <input type="text" name="last_name" value={form.last_name} onChange={handleChange} required placeholder="Doe" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            {/* Username + Email */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>USERNAME</label>
                <input type="text" name="username" value={form.username} onChange={handleChange} required placeholder="johndoe" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div>
                <label style={labelStyle}>EMAIL</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="john@example.com" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            {/* Role */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>ROLE</label>
              <select name="role" value={form.role} onChange={handleChange} style={{ ...inputStyle, cursor: 'pointer' }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="student">Student</option>
                <option value="workplace">Workplace Supervisor</option>
                <option value="academic">Academic Supervisor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            {/* Conditional number */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>{form.role === 'student' ? 'STUDENT NUMBER' : 'STAFF NUMBER'}</label>
                {form.role === 'student'
                  ? <input type="text" name="student_number" value={form.student_number} onChange={handleChange} placeholder="e.g. 2100700123" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                  : <input type="text" name="staff_number" value={form.staff_number} onChange={handleChange} placeholder="e.g. STAFF001" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
                }
              </div>
              <div>
                <label style={labelStyle}>DEPARTMENT</label>
                <input type="text" name="department" value={form.department} onChange={handleChange} placeholder="e.g. Computer Science" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>PHONE NUMBER</label>
              <input type="text" name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="+256700000000" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
            </div>

            {/* Passwords */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={labelStyle}>PASSWORD</label>
                <input type="password" name="password" value={form.password} onChange={handleChange} required placeholder="Min 8 characters" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div>
                <label style={labelStyle}>CONFIRM PASSWORD</label>
                <input type="password" name="password2" value={form.password2} onChange={handleChange} required placeholder="Repeat password" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px',
              background: loading ? '#4b4f6b' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white', border: 'none', borderRadius: '10px',
              fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', letterSpacing: '0.5px'
            }}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
