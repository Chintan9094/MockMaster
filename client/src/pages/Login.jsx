import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowRight, BookOpen, Loader2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });

  const fromPath = location.state?.from || '/dashboard';

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const loggedInUser = await login(form);
      toast.success('Logged in successfully');
      const targetPath = loggedInUser?.role === 'admin' ? '/admin' : fromPath;
      navigate(targetPath, { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7ff] px-4 py-10">
      <div className="max-w-5xl mx-auto min-h-[80vh] grid lg:grid-cols-2 gap-6 items-stretch">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden lg:flex rounded-3xl p-10 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-16 w-56 h-56 bg-white/10 rounded-full" />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-5">
                <BookOpen className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold leading-tight">MockMaster</h1>
              <p className="text-white/85 mt-3 text-sm leading-relaxed max-w-sm">
                Practice smarter, score higher. Continue your preparation with secure personal progress tracking.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-white/90">
                <ShieldCheck className="w-4 h-4" /> Private dashboard and history
              </div>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <ShieldCheck className="w-4 h-4" /> Bookmarks synced to your account
              </div>
            </div>
          </div>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={onSubmit}
          className="w-full card rounded-3xl p-7 sm:p-8 lg:p-10 self-center"
        >
          <div className="flex items-center gap-2 mb-2 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">MockMaster</h2>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Welcome back</h3>
          <p className="text-sm text-gray-500 mt-1 mb-7">Login to continue your test preparation.</p>

          <div className="space-y-4">
            <input
              type="email"
              required
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" disabled={submitting} className="btn-primary w-full !rounded-xl !py-3">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {submitting ? 'Logging in...' : 'Login'}
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6 text-center">
            New user? <Link to="/register" className="text-indigo-600 font-semibold">Create account</Link>
          </p>
        </motion.form>
      </div>
    </div>
  );
}
