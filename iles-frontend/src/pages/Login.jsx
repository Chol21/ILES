import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.username, form.password);
      toast.success(`Welcome back, ${user.first_name || user.username}!`);

      // Redirect based on role
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'workplace' || user.role === 'academic') navigate('/supervisor');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/');
    } catch (err) {
      toast.error('Invalid username or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">ILES</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Internship Log & Evaluation System
          </p>
        </div>

        <h2 className="text-xl font-semibold text-gray-700 mb-6">Sign in to your account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              placeholder="Enter your username"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition duration-200 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;