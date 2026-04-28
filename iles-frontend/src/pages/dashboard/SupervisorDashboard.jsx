import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const SupervisorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/weekly-logs/');
      setLogs(res.data);
    } catch {
      toast.error('Failed to load weekly logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (logId) => {
    setSubmitting(true);
    try {
      await api.post(`/weekly-logs/${logId}/approve/`, { feedback });
      toast.success('Log approved successfully!');
      setSelectedLog(null);
      setFeedback('');
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve log.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (logId) => {
    if (!feedback.trim()) {
      toast.error('Feedback is required when rejecting a log.');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`/weekly-logs/${logId}/reject/`, { feedback });
      toast.success('Log rejected with feedback.');
      setSelectedLog(null);
      setFeedback('');
      fetchLogs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject log.');
    } finally {
      setSubmitting(false);
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

  const filteredLogs = filter === 'all' ? logs : logs.filter(l => l.status === filter);
  const counts = {
    all: logs.length,
    submitted: logs.filter(l => l.status === 'submitted').length,
    approved: logs.filter(l => l.status === 'approved').length,
    rejected: logs.filter(l => l.status === 'rejected').length,
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
          <p className="text-indigo-200 text-xs">Supervisor Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.first_name} {user?.last_name}</span>
          <span className="text-indigo-200 text-xs bg-indigo-600 px-2 py-1 rounded-full">
            {user?.role === 'workplace' ? 'Workplace Supervisor' : 'Academic Supervisor'}
          </span>
          <button
            onClick={() => navigate('/evaluation')}
            className="bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg text-sm transition"
          >
            Evaluate Students
          </button>
          <button
            onClick={logout}
            className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-sm transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Welcome, {user?.first_name}!</h2>
          <p className="text-gray-500 text-sm mt-1">Review and provide feedback on student weekly logs.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Logs', count: counts.all, color: 'bg-white', text: 'text-gray-800' },
            { label: 'Pending Review', count: counts.submitted, color: 'bg-blue-50', text: 'text-blue-700' },
            { label: 'Approved', count: counts.approved, color: 'bg-green-50', text: 'text-green-700' },
            { label: 'Rejected', count: counts.rejected, color: 'bg-red-50', text: 'text-red-700' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-xl border border-gray-200 p-4 shadow-sm`}>
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.text}`}>{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4">
          {['all', 'submitted', 'approved', 'rejected'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${
                filter === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'submitted' && counts.submitted > 0 && (
                <span className="ml-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {counts.submitted}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Logs Table */}
        {filteredLogs.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            No logs found for this filter.
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Week</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Week Ending</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Submitted At</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{log.student_name}</td>
                    <td className="px-4 py-3">Week {log.week_number}</td>
                    <td className="px-4 py-3 text-gray-600">{log.week_ending_date}</td>
                    <td className="px-4 py-3">{getStatusBadge(log.status)}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {log.submitted_at ? new Date(log.submitted_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {log.status === 'submitted' && (
                        <button
                          onClick={() => { setSelectedLog(log); setFeedback(''); }}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1 rounded-lg text-xs font-medium transition"
                        >
                          Review
                        </button>
                      )}
                      {log.status !== 'submitted' && (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Review — Week {selectedLog.week_number}
            </h3>
            <p className="text-sm text-gray-500 mb-4">Student: {selectedLog.student_name}</p>
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3 text-sm">
              <div>
                <p className="font-medium text-gray-600">Activities</p>
                <p className="text-gray-800 mt-1">{selectedLog.activities}</p>
              </div>
              {selectedLog.key_learnings && (
                <div>
                  <p className="font-medium text-gray-600">Key Learnings</p>
                  <p className="text-gray-800 mt-1">{selectedLog.key_learnings}</p>
                </div>
              )}
              {selectedLog.challenges && (
                <div>
                  <p className="font-medium text-gray-600">Challenges</p>
                  <p className="text-gray-800 mt-1">{selectedLog.challenges}</p>
                </div>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Feedback <span className="text-red-400">(required for rejection)</span>
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
                placeholder="Write your feedback here..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(selectedLog.id)}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                ✓ Approve
              </button>
              <button
                onClick={() => handleReject(selectedLog.id)}
                disabled={submitting}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
              >
                ✗ Reject
              </button>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm font-medium transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupervisorDashboard;