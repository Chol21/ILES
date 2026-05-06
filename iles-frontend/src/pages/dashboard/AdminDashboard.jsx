import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const theme = {
  bg: '#0f1117', surface: '#1a1f2e', border: '#2a2f3e',
  text: '#f1f5f9', muted: '#64748b', subtle: '#94a3b8',
  primary: '#6366f1', success: '#10b981', danger: '#ef4444', warning: '#f59e0b',
  font: "'Georgia', serif",
};
const card = { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '24px' };
const inputStyle = { width: '100%', padding: '11px 14px', borderRadius: '8px', background: '#0f1117', border: `1px solid ${theme.border}`, color: theme.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: theme.font };
const labelStyle = { display: 'block', color: theme.muted, fontSize: '11px', fontWeight: '600', letterSpacing: '0.5px', marginBottom: '6px' };

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ student: '', company_name: '', start_date: '', end_date: '', workplace_supervisor: '', academic_supervisor: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [s, u, p] = await Promise.all([api.get('/students/'), api.get('/users/'), api.get('/placements/')]);
      setStudents(s.data);
      setSupervisors(u.data.filter(x => x.role === 'workplace' || x.role === 'academic'));
      setPlacements(p.data);
    } catch { toast.error('Failed to load data.'); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.post('/placements/', { ...form, workplace_supervisor: form.workplace_supervisor || null, academic_supervisor: form.academic_supervisor || null });
      toast.success('Placement created!');
      setShowForm(false);
      setForm({ student: '', company_name: '', start_date: '', end_date: '', workplace_supervisor: '', academic_supervisor: '' });
      fetchData();
    } catch (err) {
      const errors = err.response?.data;
      if (errors) Object.values(errors).forEach(msg => toast.error(String(msg)));
      else toast.error('Failed to create placement.');
    } finally { setSubmitting(false); }
  };

  const handleToggle = async (p) => {
    try { await api.patch(`/placements/${p.id}/`, { is_active: !p.is_active }); toast.success(`Placement ${p.is_active ? 'deactivated' : 'activated'}.`); fetchData(); }
    catch { toast.error('Failed to update.'); }
  };

  const workplaceS = supervisors.filter(s => s.role === 'workplace');
  const academicS = supervisors.filter(s => s.role === 'academic');
  const filtered = placements.filter(p =>
    p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.company_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: theme.font }}>
      <div style={{ color: theme.muted }}>Loading...</div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: theme.bg, fontFamily: theme.font }}>

      {/* Navbar */}
      <nav style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}`, padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900', color: 'white' }}>I</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: theme.text }}>ILES</div>
            <div style={{ fontSize: '10px', color: theme.muted, letterSpacing: '1px' }}>ADMIN PORTAL</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/evaluation')} style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: theme.success, fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: theme.font }}>
            Evaluations
          </button>
          <div style={{ width: '1px', height: '24px', background: theme.border }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: '11px', color: theme.muted }}>Administrator</div>
          </div>
          <button onClick={logout} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.muted, fontSize: '13px', cursor: 'pointer', fontFamily: theme.font }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: theme.text, marginBottom: '6px' }}>Admin Dashboard</h1>
          <p style={{ color: theme.muted, fontSize: '14px' }}>Manage internship placements and assign supervisors to students.</p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '2rem' }}>
          {[
            { label: 'Total Students', value: students.length, color: theme.primary },
            { label: 'Active Placements', value: placements.filter(p => p.is_active).length, color: theme.success },
            { label: 'Total Supervisors', value: supervisors.length, color: '#60a5fa' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...card, padding: '20px' }}>
              <div style={{ fontSize: '11px', color: theme.muted, letterSpacing: '0.8px', marginBottom: '8px' }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Placements Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: theme.text, marginBottom: '2px' }}>Internship Placements</h2>
            <p style={{ fontSize: '13px', color: theme.muted }}>{placements.length} placement{placements.length !== 1 ? 's' : ''} total</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', background: showForm ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: showForm ? `1px solid ${theme.border}` : 'none', borderRadius: '8px', color: showForm ? theme.muted : 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: theme.font }}>
            {showForm ? '✕ Cancel' : '+ New Placement'}
          </button>
        </div>

        {/* New Placement Form */}
        {showForm && (
          <div style={{ ...card, marginBottom: '20px' }}>
            <h3 style={{ color: theme.text, fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Create New Placement</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>STUDENT *</label>
                  <select name="student" value={form.student} onChange={e => setForm({...form, student: e.target.value})} required style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">Select student...</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_number || s.username})</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>COMPANY NAME *</label>
                  <input type="text" value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} required placeholder="e.g. Acme Corporation" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={labelStyle}>START DATE *</label>
                  <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>END DATE *</label>
                  <input type="date" value={form.end_date} onChange={e => setForm({...form, end_date: e.target.value})} required style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={labelStyle}>WORKPLACE SUPERVISOR</label>
                  <select value={form.workplace_supervisor} onChange={e => setForm({...form, workplace_supervisor: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">None</option>
                    {workplaceS.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>ACADEMIC SUPERVISOR</label>
                  <select value={form.academic_supervisor} onChange={e => setForm({...form, academic_supervisor: e.target.value})} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">None</option>
                    {academicS.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" disabled={submitting} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: theme.font, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Creating...' : 'Create Placement'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.muted, fontSize: '14px', cursor: 'pointer', fontFamily: theme.font }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search */}
        <div style={{ marginBottom: '16px' }}>
          <input type="text" placeholder="Search by student or company..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '10px 14px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.text, fontSize: '14px', outline: 'none', fontFamily: theme.font, minWidth: '280px' }} />
        </div>

        {/* Placements Table */}
        {filtered.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '48px', color: theme.muted, fontSize: '14px' }}>
            {search ? `No placements found for "${search}".` : 'No placements yet. Click + New Placement to get started.'}
          </div>
        ) : (
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Student', 'Company', 'Start', 'End', 'Supervisor', 'Status', 'Action'].map(h => (
                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: theme.muted, fontSize: '11px', fontWeight: '600', letterSpacing: '0.8px' }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                    <td style={{ padding: '14px 16px', color: theme.text, fontWeight: '600' }}>{p.student_name}</td>
                    <td style={{ padding: '14px 16px', color: theme.subtle }}>{p.company_name}</td>
                    <td style={{ padding: '14px 16px', color: theme.muted }}>{p.start_date}</td>
                    <td style={{ padding: '14px 16px', color: theme.muted }}>{p.end_date}</td>
                    <td style={{ padding: '14px 16px', color: theme.muted }}>{p.workplace_supervisor_name || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color: p.is_active ? theme.success : theme.muted, background: p.is_active ? 'rgba(16,185,129,0.1)' : '#2a2f3e' }}>
                        {p.is_active ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => handleToggle(p)} style={{ padding: '5px 12px', background: p.is_active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${p.is_active ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: '6px', color: p.is_active ? theme.danger : theme.success, fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: theme.font }}>
                        {p.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
