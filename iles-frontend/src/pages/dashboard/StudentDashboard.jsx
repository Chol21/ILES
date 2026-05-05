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

// ─── Evaluation Results Component ─────────────────────────────────────────────

const EvaluationResults = ({ placementId }) => {
  const [overall, setOverall] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
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

  if (loading) return null;

  if (!overall) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
        No evaluation results yet. Your supervisor will evaluate you at the end of your internship.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {/* Overall Score */}
      <div className="flex items-center gap-6 mb-6 p-4 bg-gray-50 rounded-xl">
        <div className="text-center">
          <p className="text-4xl font-bold text-indigo-700">{overall.total_score}</p>
          <p className="text-xs text-gray-400 mt-1">Total Score / 100</p>
        </div>
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
        </div>
        <div className="flex-1 text-sm text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Evaluated on:</p>
          <p>{new Date(overall.evaluated_at).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Score Breakdown */}
      {evaluations.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-700 mb-3 text-sm">Score Breakdown</h4>
          <div className="space-y-3">
            {evaluations.map((ev) => (
              <div key={ev.id} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-40">{ev.criteria_name}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-indigo-500 h-2.5 rounded-full"
                    style={{ width: `${ev.score}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-12 text-right">
                  {ev.score}/100
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Student Dashboard ────────────────────────────────────────────────────────

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [placement, setPlacement] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editingLog, setEditingLog] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [form, setForm] = useState({
    week_number: '',
    week_ending_date: '',
    activities: '',
    key_learnings: '',
    challenges: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
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
  };

  const handleSubmitLog = async (e) => {
    e.preventDefault();

    if (!placement) {
      toast.error('You have no active placement. Contact your administrator.');
      return;
    }

    setSubmitting(true);

    try {
      if (editingLog) {
        await updateLog(editingLog.id, form);
        toast.success('Weekly log updated!');
      } else {
        await createLog(placement.id, form);
        toast.success('Weekly log saved as draft!');
      }

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
      if (errors) {
        Object.values(errors).forEach((msg) => toast.error(String(msg)));
      } else {
        toast.error(editingLog ? 'Failed to update log.' : 'Failed to save log.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async (logId) => {
    try {
      await submitLogForReview(logId);
      toast.success('Log submitted for review!');
      fetchData();
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      if (errorMsg?.includes('deadline')) {
        toast.error('Submission deadline has passed — your placement has ended.');
      } else {
        toast.error(errorMsg || 'Failed to submit log.');
      }
    }
  };

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
      {/* Navbar */}
      <nav className="bg-indigo-700 text-white px-6 py-4 flex justify-between items-center shadow">
        <div>
          <h1 className="text-xl font-bold">ILES</h1>
          <p className="text-indigo-200 text-xs">Student Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {user?.first_name} {user?.last_name}
          </span>
          <button
            onClick={logout}
            className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-sm transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Welcome, {user?.first_name}!</h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage your internship logs and track your progress.
          </p>
        </div>

        {/* Placement Card */}
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
                </div>
              </div>
              {isDeadlinePassed && (
                <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-600 font-medium">
                  ⚠️ Your internship placement has ended. Log submission is closed.
                </div>
              )}
            </div>
          ) : (
            <p className="text-yellow-700 text-sm font-medium">
              ⚠️ No active placement found. Please contact your administrator.
            </p>
          )}
        </div>

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
            </button>
          )}
        </div>

        {/* Log Form */}
        {showForm && (
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
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Logs Table */}
        {logs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            No weekly logs yet. Click <strong>+ New Log</strong> to get started.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Week</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Week Ending</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Feedback</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
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
              </tbody>
            </table>
          </div>
        )}

        {/* Evaluation Results */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4">My Evaluation Results</h3>
          <EvaluationResults placementId={placement?.id} />
        </div>

        <ProfileCard user={user} />
      </div>
    </div>
  );
};

export default StudentDashboard;
