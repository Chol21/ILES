import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({
    student: '',
    company_name: '',
    start_date: '',
    end_date: '',
    workplace_supervisor: '',
    academic_supervisor: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [studentsRes, usersRes, placementsRes] = await Promise.all([
        api.get('/students/'),
        api.get('/users/'),
        api.get('/placements/'),
      ]);
      setStudents(studentsRes.data);
      setSupervisors(usersRes.data.filter(u => u.role === 'workplace' || u.role === 'academic'));
      setPlacements(placementsRes.data);
    } catch {
      toast.error('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreatePlacement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/placements/', {
        ...form,
        workplace_supervisor: form.workplace_supervisor || null,
        academic_supervisor: form.academic_supervisor || null,
      });
      toast.success('Placement created successfully!');
      setShowForm(false);
      setForm({ student: '', company_name: '', start_date: '', end_date: '', workplace_supervisor: '', academic_supervisor: '' });
      fetchData();
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        Object.values(errors).forEach((msg) => toast.error(String(msg)));
      } else {
        toast.error('Failed to create placement.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (placement) => {
    try {
      await api.patch(`/placements/${placement.id}/`, { is_active: !placement.is_active });
      toast.success(`Placement ${placement.is_active ? 'deactivated' : 'activated'}.`);
      fetchData();
    } catch {
      toast.error('Failed to update placement.');
    }
  };

  const workplaceSupervisors = supervisors.filter(s => s.role === 'workplace');
  const academicSupervisors = supervisors.filter(s => s.role === 'academic');

  const filteredPlacements = placements.filter(p =>
    p.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    p.company_name?.toLowerCase().includes(search.toLowerCase())
  );

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
          <p className="text-indigo-200 text-xs">Admin Portal</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm">{user?.first_name} {user?.last_name}</span>
          <span className="text-indigo-200 text-xs bg-indigo-600 px-2 py-1 rounded-full">
            Administrator
          </span>
          <button
            onClick={() => navigate('/evaluation')}
            className="bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-lg text-sm transition"
          >
            Evaluations
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
          <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
          <p className="text-gray-500 text-sm mt-1">
            Manage internship placements and assign supervisors to students.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Total Students', count: students.length, color: 'bg-white', text: 'text-gray-800' },
            { label: 'Active Placements', count: placements.filter(p => p.is_active).length, color: 'bg-green-50', text: 'text-green-700' },
            { label: 'Total Supervisors', count: supervisors.length, color: 'bg-blue-50', text: 'text-blue-700' },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.color} rounded-xl border border-gray-200 p-4 shadow-sm`}>
              <p className="text-gray-400 text-xs mb-1">{stat.label}</p>
              <p className={`text-3xl font-bold ${stat.text}`}>{stat.count}</p>
            </div>
          ))}
        </div>

        {/* Placements Section */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">Internship Placements</h3>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            {showForm ? 'Cancel' : '+ New Placement'}
          </button>
        </div>

        {/* New Placement Form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h4 className="font-semibold text-gray-700 mb-4">Create New Placement</h4>
            <form onSubmit={handleCreatePlacement} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Student <span className="text-red-400">*</span>
                  </label>
                  <select
                    name="student"
                    value={form.student}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">Select student...</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.student_number || s.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Company Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    value={form.company_name}
                    onChange={handleChange}
                    required
                    placeholder="e.g. Acme Corporation"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    Start Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">
                    End Date <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Workplace Supervisor</label>
                  <select
                    name="workplace_supervisor"
                    value={form.workplace_supervisor}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">None</option>
                    {workplaceSupervisors.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.staff_number || s.username})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Academic Supervisor</label>
                  <select
                    name="academic_supervisor"
                    value={form.academic_supervisor}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  >
                    <option value="">None</option>
                    {academicSupervisors.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name} ({s.staff_number || s.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Placement'}
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

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by student or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        {/* Placements Table */}
        {filteredPlacements.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-10 text-center text-gray-400">
            {search ? `No placements found for "${search}".` : 'No placements yet. Click + New Placement to assign a student.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Company</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Start</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">End</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Workplace Supervisor</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlacements.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{p.student_name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.company_name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.start_date}</td>
                    <td className="px-4 py-3 text-gray-600">{p.end_date}</td>
                    <td className="px-4 py-3 text-gray-600">{p.workplace_supervisor_name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          p.is_active
                            ? 'bg-red-50 hover:bg-red-100 text-red-600'
                            : 'bg-green-50 hover:bg-green-100 text-green-600'
                        }`}
                      >
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
};

export default AdminDashboard;
