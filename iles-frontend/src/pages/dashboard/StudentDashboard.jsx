import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

// ─── Shared Styles ────────────────────────────────────────────────────────────
const theme = {
  bg: '#0f1117', surface: '#1a1f2e', border: '#2a2f3e',
  text: '#f1f5f9', muted: '#64748b', subtle: '#94a3b8',
  primary: '#6366f1', primaryLight: '#818cf8',
  success: '#10b981', warning: '#f59e0b', danger: '#ef4444',
  font: "'Georgia', serif",
};

const card = { background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '14px', padding: '24px' };
const pill = (color, bg) => ({ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', color, background: bg });

// ─── Evaluation Results ───────────────────────────────────────────────────────
const EvaluationResults = ({ placementId }) => {
  const [overall, setOverall] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!placementId) { setLoading(false); return; }
    Promise.all([api.get('/overall-evaluations/'), api.get(`/evaluations/?placement=${placementId}`)])
      .then(([o, e]) => {
        setOverall(o.data.find(x => x.placement === placementId) || null);
        setEvaluations(e.data);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [placementId]);

  const gradeColor = { A: '#10b981', B: '#6366f1', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
  const gradeLabel = { A: 'Distinction', B: 'Merit', C: 'Pass', D: 'Borderline', F: 'Fail' };

  if (loading) return null;
  if (!overall) return (
    <div style={{ ...card, textAlign: 'center', color: theme.muted, fontSize: '14px', padding: '32px' }}>
      No evaluation results yet. Your supervisor will evaluate you at the end of your internship.
    </div>
  );

  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '24px', padding: '20px', background: '#0f1117', borderRadius: '10px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', fontWeight: '800', color: theme.primary }}>{overall.total_score}</div>
          <div style={{ fontSize: '11px', color: theme.muted, letterSpacing: '1px', marginTop: '2px' }}>TOTAL / 100</div>
        </div>
        <div style={{ padding: '16px 28px', borderRadius: '12px', border: `2px solid ${gradeColor[overall.grade] || '#6366f1'}`, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: gradeColor[overall.grade] || '#6366f1' }}>{overall.grade}</div>
          <div style={{ fontSize: '12px', color: theme.muted, marginTop: '2px' }}>{gradeLabel[overall.grade]}</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', color: theme.muted, letterSpacing: '0.5px', marginBottom: '4px' }}>EVALUATED ON</div>
          <div style={{ color: theme.subtle, fontSize: '14px' }}>{new Date(overall.evaluated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      {evaluations.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', color: theme.muted, letterSpacing: '1px', marginBottom: '16px' }}>SCORE BREAKDOWN</div>
          {evaluations.map(ev => (
            <div key={ev.id} style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ color: theme.subtle, fontSize: '13px' }}>{ev.criteria_name}</span>
                <span style={{ color: theme.text, fontSize: '13px', fontWeight: '600' }}>{ev.score}/100</span>
              </div>
              <div style={{ height: '6px', background: '#0f1117', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${ev.score}%`, background: `linear-gradient(90deg, ${theme.primary}, ${theme.primaryLight})`, borderRadius: '10px', transition: 'width 0.8s ease' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Student Dashboard ────────────────────────────────────────────────────────
export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const [placement, setPlacement] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ week_number: '', week_ending_date: '', activities: '', key_learnings: '', challenges: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [p, l] = await Promise.all([api.get('/placements/'), api.get('/weekly-logs/')]);
      setPlacement(p.data[0] || null);
      setLogs(l.data);
    } catch { toast.error('Failed to load dashboard.'); }
    finally { setLoading(false); }
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
    if (!placement) { toast.error('No active placement found.'); return; }
    setSubmitting(true);
    try {
      await api.post('/weekly-logs/', { ...form, placement: placement.id });
      toast.success('Log saved as draft!');
      setShowForm(false);
      setForm({ week_number: '', week_ending_date: '', activities: '', key_learnings: '', challenges: '' });
      fetchData();
    } catch (err) {
      const errors = err.response?.data;
      if (errors) Object.values(errors).forEach(msg => toast.error(String(msg)));
      else toast.error('Failed to save log.');
    } finally { setSubmitting(false); }
  };

  const handleSubmitForReview = async (logId) => {
    try {
      await api.post(`/weekly-logs/${logId}/submit/`);
      toast.success('Log submitted for review!');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error;
      toast.error(msg?.includes('deadline') ? 'Submission deadline has passed.' : msg || 'Failed to submit.');
    }
  };

  const isDeadlinePassed = placement && new Date(placement.end_date) < new Date();

  const statusConfig = {
    draft: { label: 'Draft', color: theme.muted, bg: '#2a2f3e' },
    submitted: { label: 'Submitted', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)' },
    approved: { label: 'Approved', color: theme.success, bg: 'rgba(16,185,129,0.1)' },
    rejected: { label: 'Rejected', color: theme.danger, bg: 'rgba(239,68,68,0.1)' },
  };

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: '8px',
    background: '#0f1117', border: `1px solid ${theme.border}`,
    color: theme.text, fontSize: '14px', outline: 'none',
    boxSizing: 'border-box', fontFamily: theme.font, resize: 'vertical'
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: theme.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: theme.muted, fontFamily: theme.font }}>Loading dashboard...</div>
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
            <div style={{ fontSize: '10px', color: theme.muted, letterSpacing: '1px' }}>STUDENT PORTAL</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: '11px', color: theme.muted }}>Student</div>
          </div>
          <button onClick={logout} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.muted, fontSize: '13px', cursor: 'pointer', fontFamily: theme.font }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: theme.text, marginBottom: '6px' }}>
            Good day, {user?.first_name}
          </h1>
          <p style={{ color: theme.muted, fontSize: '14px' }}>Track your internship progress and submit your weekly logs.</p>
        </div>

        {/* Placement Card */}
        {placement ? (
          <div style={{ ...card, marginBottom: '2rem', borderLeft: `4px solid ${theme.primary}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: theme.muted, letterSpacing: '1px', marginBottom: '4px' }}>CURRENT PLACEMENT</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '700', color: theme.text }}>{placement.company_name}</div>
              </div>
              <span style={pill(placement.is_active ? theme.success : theme.danger, placement.is_active ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)')}>
                {placement.is_active ? '● Active' : '● Inactive'}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '11px', color: theme.muted, letterSpacing: '0.5px', marginBottom: '4px' }}>START DATE</div>
                <div style={{ color: theme.subtle, fontSize: '14px' }}>{placement.start_date}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: theme.muted, letterSpacing: '0.5px', marginBottom: '4px' }}>END DATE</div>
                <div style={{ color: isDeadlinePassed ? theme.danger : theme.subtle, fontSize: '14px', fontWeight: isDeadlinePassed ? '600' : 'normal' }}>
                  {placement.end_date} {isDeadlinePassed && '— Deadline passed'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...card, marginBottom: '2rem', borderLeft: `4px solid ${theme.warning}`, color: theme.warning, fontSize: '14px' }}>
            ⚠ No active placement found. Contact your administrator.
          </div>
        )}

        {/* Weekly Logs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: theme.text, marginBottom: '2px' }}>Weekly Logs</h2>
            <p style={{ fontSize: '13px', color: theme.muted }}>{logs.length} log{logs.length !== 1 ? 's' : ''} total</p>
          </div>
          {!isDeadlinePassed && placement && (
            <button onClick={() => setShowForm(!showForm)} style={{
              padding: '10px 20px', background: showForm ? 'transparent' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              border: showForm ? `1px solid ${theme.border}` : 'none',
              borderRadius: '8px', color: showForm ? theme.muted : 'white',
              fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: theme.font
            }}>
              {showForm ? '✕ Cancel' : '+ New Log'}
            </button>
          )}
        </div>

        {/* New Log Form */}
        {showForm && (
          <div style={{ ...card, marginBottom: '20px' }}>
            <h3 style={{ color: theme.text, fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>New Weekly Log</h3>
            <form onSubmit={handleSubmitLog}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', color: theme.muted, fontSize: '12px', letterSpacing: '0.5px', marginBottom: '6px' }}>WEEK NUMBER</label>
                  <input type="number" name="week_number" value={form.week_number} onChange={e => setForm({...form, week_number: e.target.value})} required min="1" placeholder="e.g. 1" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', color: theme.muted, fontSize: '12px', letterSpacing: '0.5px', marginBottom: '6px' }}>WEEK ENDING DATE</label>
                  <input type="date" name="week_ending_date" value={form.week_ending_date} onChange={e => setForm({...form, week_ending_date: e.target.value})} required style={inputStyle} />
                </div>
              </div>
              {[
                { name: 'activities', label: 'ACTIVITIES *', placeholder: 'Describe your activities this week...', required: true },
                { name: 'key_learnings', label: 'KEY LEARNINGS', placeholder: 'What did you learn?', required: false },
                { name: 'challenges', label: 'CHALLENGES', placeholder: 'Any challenges faced?', required: false },
              ].map(({ name, label, placeholder, required }) => (
                <div key={name} style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', color: theme.muted, fontSize: '12px', letterSpacing: '0.5px', marginBottom: '6px' }}>{label}</label>
                  <textarea name={name} value={form[name]} onChange={e => setForm({...form, [name]: e.target.value})} required={required} rows={3} placeholder={placeholder} style={inputStyle} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="submit" disabled={submitting} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '8px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: theme.font, opacity: submitting ? 0.6 : 1 }}>
                  {submitting ? 'Saving...' : 'Save as Draft'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '10px 20px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.muted, fontSize: '14px', cursor: 'pointer', fontFamily: theme.font }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Logs Table */}
        {logs.length === 0 ? (
          <div style={{ ...card, textAlign: 'center', padding: '48px', color: theme.muted, fontSize: '14px' }}>
            No weekly logs yet. Click <strong style={{ color: theme.text }}>+ New Log</strong> to get started.
          </div>
        ) : (
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${theme.border}` }}>
                  {['Week', 'Week Ending', 'Status', 'Feedback', 'Action'].map(h => (
                    <th key={h} style={{ padding: '14px 20px', textAlign: 'left', color: theme.muted, fontSize: '11px', fontWeight: '600', letterSpacing: '0.8px' }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const sc = statusConfig[log.status] || statusConfig.draft;
                  return (
                    <tr key={log.id} style={{ borderBottom: i < logs.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                      <td style={{ padding: '16px 20px', color: theme.text, fontWeight: '600' }}>Week {log.week_number}</td>
                      <td style={{ padding: '16px 20px', color: theme.subtle }}>{log.week_ending_date}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={pill(sc.color, sc.bg)}>{sc.label}</span>
                      </td>
                      <td style={{ padding: '16px 20px', color: theme.muted, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.supervisor_feedback || '—'}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {(log.status === 'draft' || log.status === 'rejected') && (
                          isDeadlinePassed
                            ? <span style={{ color: theme.danger, fontSize: '12px' }}>Deadline passed</span>
                            : <button onClick={() => handleSubmitForReview(log.id)} style={{ padding: '6px 14px', background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '6px', color: '#60a5fa', fontSize: '12px', fontWeight: '600', cursor: 'pointer', fontFamily: theme.font }}>
                                Submit →
                              </button>
                        )}
                        {log.status === 'submitted' && <span style={{ color: theme.muted, fontSize: '12px' }}>Awaiting review</span>}
                        {log.status === 'approved' && <span style={{ color: theme.success, fontSize: '12px' }}>✓ Approved</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Evaluation */}
        <div style={{ marginTop: '2.5rem' }}>
          <div style={{ marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: theme.text, marginBottom: '2px' }}>Evaluation Results</h2>
            <p style={{ fontSize: '13px', color: theme.muted }}>Your final internship grade and score breakdown.</p>
          </div>
          <EvaluationResults placementId={placement?.id} />
        </div>

      </div>
    </div>
  );
}
