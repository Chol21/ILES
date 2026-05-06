import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const theme = {
  bg: '#0f1117', surface: '#1a1f2e', border: '#2a2f3e',
  text: '#f1f5f9', muted: '#64748b', subtle: '#94a3b8',
  primary: '#6366f1', success: '#10b981', danger: '#ef4444',
  font: "'Georgia', serif",
};

const card = { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '24px' };
const pill = (color, bg) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color, background: bg });

export default function SupervisorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    try { const res = await api.get('/weekly-logs/'); setLogs(res.data); }
    catch { toast.error('Failed to load logs.'); }
    finally { setLoading(false); }
  };

  const handleApprove = async (logId) => {
    setSubmitting(true);
    try {
      await api.post(`/weekly-logs/${logId}/approve/`, { feedback });
      toast.success('Log approved!');
      setSelectedLog(null); setFeedback(''); fetchLogs();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const handleReject = async (logId) => {
    if (!feedback.trim()) { toast.error('Feedback is required when rejecting.'); return; }
    setSubmitting(true);
    try {
      await api.post(`/weekly-logs/${logId}/reject/`, { feedback });
      toast.success('Log rejected with feedback.');
      setSelectedLog(null); setFeedback(''); fetchLogs();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const statusConfig = {
    draft: { label: 'Draft', color: theme.muted, bg: '#2a2f3e' },
    submitted: { label: 'Submitted', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    approved: { label: 'Approved', color: theme.success, bg: 'rgba(16,185,129,0.1)' },
    rejected: { label: 'Rejected', color: theme.danger, bg: 'rgba(239,68,68,0.1)' },
  };

  const counts = {
    all: logs.length,
    submitted: logs.filter(l => l.status === 'submitted').length,
    approved: logs.filter(l => l.status === 'approved').length,
    rejected: logs.filter(l => l.status === 'rejected').length,
  };

  const filteredLogs = logs
    .filter(l => filter === 'all' || l.status === filter)
    .filter(l => l.student_name?.toLowerCase().includes(search.toLowerCase()));

  const statCards = [
    { label: 'Total Logs', value: counts.all, color: theme.primary },
    { label: 'Pending Review', value: counts.submitted, color: '#60a5fa' },
    { label: 'Approved', value: counts.approved, color: theme.success },
    { label: 'Rejected', value: counts.rejected, color: theme.danger },
  ];

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
            <div style={{ fontSize: '10px', color: theme.muted, letterSpacing: '1px' }}>SUPERVISOR PORTAL</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/evaluation')} style={{ padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', color: theme.success, fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: theme.font }}>
            Evaluate Students
          </button>
          <div style={{ width: '1px', height: '24px', background: theme.border }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: '11px', color: theme.muted }}>{user?.role === 'workplace' ? 'Workplace Supervisor' : 'Academic Supervisor'}</div>
          </div>
          <button onClick={logout} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.muted, fontSize: '13px', cursor: 'pointer', fontFamily: theme.font }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: theme.text, marginBottom: '6px' }}>Welcome, {user?.first_name}</h1>
          <p style={{ color: theme.muted, fontSize: '14px' }}>Review and provide feedback on student weekly logs.</p>
        </div>

        {/* Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '2rem' }}>
          {statCards.map(({ label, value, color }) => (
            <div key={label} style={{ ...card, padding: '20px' }}>
              <div style={{ fontSize: '11px', color: theme.muted, letterSpacing: '0.8px', marginBottom: '8px' }}>{label.toUpperCase()}</div>
              <div style={{ fontSize: '2.2rem', fontWeight: '800', color }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Search + Filters */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input
            type="text" placeholder="Search by student name..." value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '10px 14px', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.text, fontSize: '14px', outline: 'none', fontFamily: theme.font, minWidth: '240px' }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            {['all', 'submitted', 'approved', 'rejected'].map(tab => (
              <button key={tab} onClick={() => setFilter(tab)} style={{
                padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: theme.font, border: 'none',
                background: filter === tab ? theme.primary : theme.surface,
                color: filter === tab ? 'white' : theme.muted,
                outline: filter !== tab ? `1px solid ${theme.border}` : 'none',
                position: 'relative'
              }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === 'submitted' && counts.submitted > 0 && (
                  <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700' }}>{counts.submitted}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Logs Table */}
        {filteredLogs.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '48px', color: theme.muted, fontSize: '14px' }}>
            {search ? `No logs found for "${search}".` : 'No logs for this filter.'}
          </div>
        ) : (
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Student', 'Week', 'Week Ending', 'Status', 'Submitted At', 'Action'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: theme.muted, fontSize: '11px', fontWeight: '600', letterSpacing: '0.8px' }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, i) => {
                  const sc = statusConfig[log.status] || statusConfig.draft;
                  return (
                    <tr key={log.id} style={{ borderBottom: i < filteredLogs.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                      <td style={{ padding: '16px 20px', color: theme.text, fontWeight: '600' }}>{log.student_name}</td>
                      <td style={{ padding: '16px 20px', color: theme.subtle }}>Week {log.week_number}</td>
                      <td style={{ padding: '16px 20px', color: theme.subtle }}>{log.week_ending_date}</td>
                      <td style={{ padding: '16px 20px' }}><span style={pill(sc.color, sc.bg)}>{sc.label}</span></td>
                      <td style={{ padding: '16px 20px', color: theme.muted }}>{log.submitted_at ? new Date(log.submitted_at).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '16px 20px' }}>
                        {log.status === 'submitted' && (
                          <button onClick={() => { setSelectedLog(log); setFeedback(''); }} style={{ padding: '6px 14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '6px', color: theme.primary, fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: theme.font }}>
                            Review →
                          </button>
                        )}
                        {log.status !== 'submitted' && <span style={{ color: theme.border, fontSize: '12px' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '2rem' }}>
          <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '16px', width: '100%', maxWidth: '540px', padding: '2rem' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ color: theme.text, fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Review — Week {selectedLog.week_number}</h3>
              <p style={{ color: theme.muted, fontSize: '13px' }}>Student: {selectedLog.student_name}</p>
            </div>

            <div style={{ background: '#0f1117', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              {[
                { label: 'Activities', value: selectedLog.activities },
                selectedLog.key_learnings && { label: 'Key Learnings', value: selectedLog.key_learnings },
                selectedLog.challenges && { label: 'Challenges', value: selectedLog.challenges },
              ].filter(Boolean).map(({ label, value }) => (
                <div key={label} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', color: theme.muted, letterSpacing: '0.5px', marginBottom: '4px' }}>{label.toUpperCase()}</div>
                  <div style={{ color: theme.subtle, fontSize: '14px', lineHeight: '1.6' }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: theme.muted, letterSpacing: '0.5px', marginBottom: '8px' }}>FEEDBACK <span style={{ color: theme.danger }}>(required for rejection)</span></label>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} rows={3} placeholder="Write your feedback..." style={{ width: '100%', padding: '12px 14px', background: '#0f1117', border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.text, fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: theme.font, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => handleApprove(selectedLog.id)} disabled={submitting} style={{ flex: 1, padding: '12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', color: theme.success, fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: theme.font }}>
                ✓ Approve
              </button>
              <button onClick={() => handleReject(selectedLog.id)} disabled={submitting} style={{ flex: 1, padding: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '8px', color: theme.danger, fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: theme.font }}>
                ✕ Reject
              </button>
              <button onClick={() => setSelectedLog(null)} style={{ padding: '12px 20px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.muted, fontSize: '14px', cursor: 'pointer', fontFamily: theme.font }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
