import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import {
  getMyPlacement,
  getMyLogs,
  createLog,
  updateLog,
  submitLogForReview,
} from '../../services/studentService';
import StatusBadge from '../../components/statusbadge';
import ProgressTracker from '../../components/ProgressTracker';
import ProfileCard from '../../components/ProfileCard';

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
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
<<<<<<< HEAD
    if (!placementId) { setLoading(false); return; }
    Promise.all([api.get('/overall-evaluations/'), api.get(`/evaluations/?placement=${placementId}`)])
      .then(([o, e]) => {
        setOverall(o.data.find(x => x.placement === placementId) || null);
        setEvaluations(e.data);
      }).catch(() => {}).finally(() => setLoading(false));
  }, [placementId]);

  const gradeColor = { A: '#10b981', B: '#6366f1', C: '#f59e0b', D: '#f97316', F: '#ef4444' };
  const gradeLabel = { A: 'Distinction', B: 'Merit', C: 'Pass', D: 'Borderline', F: 'Fail' };
=======
    if (!placementId) {
      setLoading(false);
      return;
    }
    fetchResults();
  }, [placementId]);

  const fetchResults = async () => {
    try {
      const [overallRes, evalsRes] = await Promise.all([
        api.get('/overall-evaluations/'),
        api.get(`/evaluations/?placement=${placementId}`),
      ]);
      setOverall(overallRes.data.find((o) => o.placement === placementId) || null);
      setEvaluations(evalsRes.data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (logId) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId));
  };

  const getGradeStyle = (grade) => {
    const styles = {
      A: 'bg-green-100 text-green-700 border-green-200',
      B: 'bg-blue-100 text-blue-700 border-blue-200',
      C: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      D: 'bg-orange-100 text-orange-700 border-orange-200',
      F: 'bg-red-100 text-red-700 border-red-200',
    };
    return styles[grade] || 'bg-gray-100 text-gray-700 border-gray-200';
  };
>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011

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
<<<<<<< HEAD
        <div style={{ padding: '16px 28px', borderRadius: '12px', border: `2px solid ${gradeColor[overall.grade] || '#6366f1'}`, textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: gradeColor[overall.grade] || '#6366f1' }}>{overall.grade}</div>
          <div style={{ fontSize: '12px', color: theme.muted, marginTop: '2px' }}>{gradeLabel[overall.grade]}</div>
=======
        <div
          className={`px-6 py-3 rounded-xl border text-center font-bold text-3xl ${getGradeStyle(
            overall.grade
          )}`}
        >
          {overall.grade}
          <p className="text-sm font-normal mt-0.5">
            {overall.grade === 'A'
              ? 'Distinction'
              : overall.grade === 'B'
              ? 'Merit'
              : overall.grade === 'C'
              ? 'Pass'
              : overall.grade === 'D'
              ? 'Borderline'
              : 'Fail'}
          </p>
>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011
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
<<<<<<< HEAD
  const [form, setForm] = useState({ week_number: '', week_ending_date: '', activities: '', key_learnings: '', challenges: '' });
=======
  const [editingLog, setEditingLog] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [form, setForm] = useState({
    week_number: '',
    week_ending_date: '',
    activities: '',
    key_learnings: '',
    challenges: '',
  });
>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
<<<<<<< HEAD
      const [p, l] = await Promise.all([api.get('/placements/'), api.get('/weekly-logs/')]);
      setPlacement(p.data[0] || null);
      setLogs(l.data);
    } catch { toast.error('Failed to load dashboard.'); }
    finally { setLoading(false); }
=======
      const [placementData, logsData] = await Promise.all([
        getMyPlacement(),
        getMyLogs(),
      ]);
      setPlacement(placementData);
      setLogs(logsData);
    } catch {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();
<<<<<<< HEAD
    if (!placement) { toast.error('No active placement found.'); return; }
=======

    if (!placement) {
      toast.error('You have no active placement. Contact your administrator.');
      return;
    }

>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011
    setSubmitting(true);

    try {
<<<<<<< HEAD
      await api.post('/weekly-logs/', { ...form, placement: placement.id });
      toast.success('Log saved as draft!');
=======
      if (editingLog) {
        await updateLog(editingLog.id, form);
        toast.success('Weekly log updated!');
      } else {
        await createLog(placement.id, form);
        toast.success('Weekly log saved as draft!');
      }

>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011
      setShowForm(false);
      setEditingLog(null);
      setForm({
        week_number: '',
        week_ending_date: '',
        activities: '',
        key_learnings: '',
        challenges: '',
      });
      fetchData();
    } catch (err) {
      const errors = err.response?.data;
<<<<<<< HEAD
      if (errors) Object.values(errors).forEach(msg => toast.error(String(msg)));
      else toast.error('Failed to save log.');
    } finally { setSubmitting(false); }
=======
      if (errors) {
        Object.values(errors).forEach((msg) => toast.error(String(msg)));
      } else {
        toast.error(editingLog ? 'Failed to update log.' : 'Failed to save log.');
      }
    } finally {
      setSubmitting(false);
    }
>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011
  };

  const handleSubmitForReview = async (logId) => {
    try {
      await submitLogForReview(logId);
      toast.success('Log submitted for review!');
      fetchData();
    } catch (err) {
      const msg = err.response?.data?.error;
      toast.error(msg?.includes('deadline') ? 'Submission deadline has passed.' : msg || 'Failed to submit.');
    }
  };

<<<<<<< HEAD
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

=======
  const handleEditClick = (log) => {
    setEditingLog(log);
    setForm({
      week_number: log.week_number,
      week_ending_date: log.week_ending_date,
      activities: log.activities,
      key_learnings: log.key_learnings || '',
      challenges: log.challenges || '',
    });
    setShowForm(true);
  };

  const toggleExpand = (logId) => {
    setExpandedLogId((prev) => (prev === logId ? null : logId));
  };

  const isDeadlinePassed = placement && new Date(placement.end_date) < new Date();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011
      {/* Navbar */}
      <nav style={{ background: theme.surface, borderBottom: `1px solid ${theme.border}`, padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: '900', color: 'white' }}>I</div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: theme.text }}>ILES</div>
            <div style={{ fontSize: '10px', color: theme.muted, letterSpacing: '1px' }}>STUDENT PORTAL</div>
          </div>
        </div>
<<<<<<< HEAD
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: theme.text }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: '11px', color: theme.muted }}>Student</div>
          </div>
          <button onClick={logout} style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${theme.border}`, borderRadius: '8px', color: theme.muted, fontSize: '13px', cursor: 'pointer', fontFamily: theme.font }}>
            Sign out
=======
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {user?.first_name} {user?.last_name}
          </span>
          <button
            onClick={logout}
            className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-sm transition"
          >
            Logout
>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011
          </button>
        </div>
      </nav>

<<<<<<< HEAD
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2.5rem 2rem' }}>

=======
      <div className="max-w-5xl mx-auto px-4 py-8">
>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011
        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '700', color: theme.text, marginBottom: '6px' }}>
            Good day, {user?.first_name}
          </h1>
          <p style={{ color: theme.muted, fontSize: '14px' }}>Track your internship progress and submit your weekly logs.</p>
        </div>

        {/* Placement Card */}
<<<<<<< HEAD
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
=======
        <div
          className={`rounded-xl p-5 mb-6 shadow-sm border ${
            placement ? 'bg-white border-gray-200' : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          {placement ? (
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Your Internship Placement</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Company</p>
                  <p className="font-medium text-gray-800">{placement.company_name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Start Date</p>
                  <p className="font-medium text-gray-800">{placement.start_date}</p>
                </div>
                <div>
                  <p className="text-gray-400">End Date</p>
                  <p className="font-medium text-gray-800">{placement.end_date}</p>
                </div>
                <div>
                  <p className="text-gray-400">Status</p>
                  <span
                    className={`font-medium ${
                      placement.is_active ? 'text-green-600' : 'text-red-500'
                    }`}
                  >
                    {placement.is_active ? 'Active' : 'Inactive'}
                  </span>
>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ ...card, marginBottom: '2rem', borderLeft: `4px solid ${theme.warning}`, color: theme.warning, fontSize: '14px' }}>
            ⚠ No active placement found. Contact your administrator.
          </div>
        )}

<<<<<<< HEAD
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
=======
        <ProgressTracker logs={logs} placement={placement} />

        {/* Weekly Logs Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Weekly Logs</h3>
          {!isDeadlinePassed && (
            <button
              onClick={() => {
                if (showForm) setEditingLog(null);
                setShowForm(!showForm);
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              {showForm ? 'Cancel' : '+ New Log'}
>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011
            </button>
          )}
        </div>

        {/* Log Form */}
        {showForm && (
<<<<<<< HEAD
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
=======
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h4 className="font-semibold text-gray-700 mb-4">
              {editingLog ? `Edit Week ${editingLog.week_number} Log` : 'New Weekly Log'}
            </h4>
            <form onSubmit={handleSubmitLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Week Number
                  </label>
                  <input
                    type="number"
                    name="week_number"
                    value={form.week_number}
                    onChange={handleChange}
                    required
                    min="1"
                    placeholder="e.g. 1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Week Ending Date
                  </label>
                  <input
                    type="date"
                    name="week_ending_date"
                    value={form.week_ending_date}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Activities <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="activities"
                  value={form.activities}
                  onChange={handleChange}
                  required
                  rows={3}
                  placeholder="Describe your activities this week..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Key Learnings
                </label>
                <textarea
                  name="key_learnings"
                  value={form.key_learnings}
                  onChange={handleChange}
                  rows={2}
                  placeholder="What did you learn this week?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Challenges
                </label>
                <textarea
                  name="challenges"
                  value={form.challenges}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Any challenges faced?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingLog ? 'Update Log' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingLog(null);
                  }}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2 rounded-lg text-sm font-medium transition"
                >
>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011
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
<<<<<<< HEAD
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
=======
                {logs.map((log) => (
                  <>
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {/* Week */}
                      <td className="px-4 py-3 font-medium">Week {log.week_number}</td>

                      {/* Week Ending */}
                      <td className="px-4 py-3 text-gray-600">{log.week_ending_date}</td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={log.status} />
                      </td>

                      {/* Feedback (truncated) */}
                      <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                        {log.supervisor_feedback || '—'}
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 items-center">
                          {(log.status === 'draft' || log.status === 'rejected') && (
                            isDeadlinePassed ? (
                              <span className="text-red-400 text-xs font-medium">
                                Deadline passed
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditClick(log)}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-xs font-medium transition"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleSubmitForReview(log.id)}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-xs font-medium transition"
                                >
                                  Submit for Review
                                </button>
                              </>
                            )
                          )}

                          {log.status === 'submitted' && (
                            <span className="text-gray-400 text-xs">Awaiting review</span>
                          )}

                          {log.status === 'approved' && (
                            <span className="text-green-500 text-xs">✓ Approved</span>
                          )}

                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="text-indigo-500 hover:text-indigo-700 text-xs font-medium underline"
                          >
                            {expandedLogId === log.id ? 'Hide' : 'View'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {expandedLogId === log.id && (
                      <tr className="bg-indigo-50 border-b border-indigo-100">
                        <td colSpan={5} className="px-6 py-5">
                          <div className="space-y-4 text-sm">
                            {/* Activities — always present */}
                            <div>
                              <p className="font-semibold text-gray-700 mb-1">Activities</p>
                              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                                {log.activities}
                              </p>
                            </div>

                            {/* Key Learnings — only show if not empty */}
                            {log.key_learnings && (
                              <div>
                                <p className="font-semibold text-gray-700 mb-1">Key Learnings</p>
                                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                                  {log.key_learnings}
                                </p>
                              </div>
                            )}

                            {/* Supervisor Feedback — highlighted in amber when present */}
                            {log.supervisor_feedback && (
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="font-semibold text-amber-800 mb-1">
                                  Supervisor Feedback
                                </p>
                                <p className="text-amber-700 whitespace-pre-wrap leading-relaxed">
                                  {log.supervisor_feedback}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
>>>>>>> 65b3a4874aa6fbb40a91d118bbb74036b7c4b011
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

        <ProfileCard user={user} />
      </div>
    </div>
  );
}
