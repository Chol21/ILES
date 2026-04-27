import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [placement, setPlacement] = useState(null);
  const [logs, setLogs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      const [placementRes, logsRes] = await Promise.all([
        api.get('/placements/'),
        api.get('/weekly-logs/'),
      ]);
      setPlacement(placementRes.data[0] || null);
      setLogs(logsRes.data);
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
      await api.post('/weekly-logs/', { ...form, placement: placement.id });
      toast.success('Weekly log saved as draft!');
      setShowForm(false);
      setForm({ week_number: '', week_ending_date: '', activities: '', key_learnings: '', challenges: '' });
      fetchData();
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        Object.values(errors).forEach((msg) => toast.error(String(msg)));
      } else {
        toast.error('Failed to save log.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForReview = async (logId) => {
    try {
      await api.post(`/weekly-logs/${logId}/submit/`);
      toast.success('Log submitted for review!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit log.');
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-600',
      submitted: 'bg-blue-100 text-blue-600',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-600',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status] || 'bg-gray-100'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

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
          <h2 className="text-2xl font-bold text-gray-800">
            Welcome, {user?.first_name}!
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage your internship logs and track your progress.
          </p>
        </div>

        {/* Placement Card */}
        <div className={`rounded-xl p-5 mb-6 shadow-sm border ${placement ? 'bg-white border-gray-200' : 'bg-yellow-50 border-yellow-200'}`}>
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
                  <span className={`font-medium ${placement.is_active ? 'text-green-600' : 'text-red-500'}`}>
                    {placement.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-yellow-700 text-sm font-medium">
              ⚠️ No active placement found. Please contact your administrator.
            </p>
          )}
        </div>

        {/* Weekly Logs Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Weekly Logs</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {showForm ? 'Cancel' : '+ New Log'}
          </button>
        </div>

        {/* New Log Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h4 className="font-semibold text-gray-700 mb-4">New Weekly Log</h4>
            <form onSubmit={handleSubmitLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Week Number</label>
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
                  <label className="block text-sm font-medium text-gray-600 mb-1">Week Ending Date</label>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">Key Learnings</label>
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
                <label className="block text-sm font-medium text-gray-600 mb-1">Challenges</label>
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
                  {submitting ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
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
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">Week {log.week_number}</td>
                    <td className="px-4 py-3 text-gray-600">{log.week_ending_date}</td>
                    <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {log.supervisor_feedback || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {(log.status === 'draft' || log.status === 'rejected') && (
                        <button
                          onClick={() => handleSubmitForReview(log.id)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1 rounded-lg text-xs font-medium transition"
                        >
                          Submit for Review
                        </button>
                      )}
                      {log.status === 'submitted' && (
                        <span className="text-gray-400 text-xs">Awaiting review</span>
                      )}
                      {log.status === 'approved' && (
                        <span className="text-green-500 text-xs">✓ Approved</span>
                      )}
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
};

export default StudentDashboard;