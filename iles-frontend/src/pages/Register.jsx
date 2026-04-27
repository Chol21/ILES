import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../api/axios';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
    role: 'student',
    student_number: '',
    staff_number: '',
    phone_number: '',
    department: '',
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.password2) {
      toast.error('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/register/', form);
      toast.success('Account created! Please log in.');
      navigate('/login');
    } catch (err) {
      const errors = err.response?.data;
      if (errors) {
        Object.values(errors).forEach((msg) => toast.error(msg));
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const isStudent = form.role === 'student';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg p-8">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-700">ILES</h1>
          <p className="text-gray-500 mt-1 text-sm">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">First Name</label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                required
                placeholder="John"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                required
                placeholder="Doe"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="johndoe"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="john@example.com"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Role</label>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="student">Student</option>
              <option value="workplace">Workplace Supervisor</option>
              <option value="academic">Academic Supervisor</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          {/* Conditional fields */}
          {isStudent ? (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Student Number</label>
              <input
                type="text"
                name="student_number"
                value={form.student_number}
                onChange={handleChange}
                placeholder="e.g. 2100700123"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Staff Number</label>
              <input
                type="text"
                name="staff_number"
                value={form.staff_number}
                onChange={handleChange}
                placeholder="e.g. STAFF001"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Phone Number</label>
            <input
              type="text"
              name="phone_number"
              value={form.phone_number}
              onChange={handleChange}
              placeholder="+256700000000"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Department</label>
            <input
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="e.g. Computer Science"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {/* Passwords */}
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Min 8 characters"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Confirm Password</label>
            <input
              type="password"
              name="password2"
              value={form.password2}
              onChange={handleChange}
              required
              placeholder="Repeat your password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 font-medium hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;