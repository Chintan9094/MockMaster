import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ArrowRight, BookOpen, Loader2, Sparkles, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await register(form);
      toast.success('Account created');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7ff] px-4 py-10">
      <div className="max-w-5xl mx-auto min-h-[80vh] grid lg:grid-cols-2 gap-6 items-stretch">
        <motion.form
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={onSubmit}
          className="w-full card rounded-3xl p-7 sm:p-8 lg:p-10 self-center lg:order-1"
        >
          <div className="flex items-center gap-2 mb-2 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">MockMaster</h2>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">Create your account</h3>
          <p className="text-sm text-gray-500 mt-1 mb-7">Save your progress, bookmarks, and history in one place.</p>

          <div className="space-y-4">
            <input
              type="text"
              placeholder="Name (optional)"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
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
              placeholder="Password (min 6 chars)"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" disabled={submitting} className="btn-primary w-full !rounded-xl !py-3">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-6 text-center">
            Already have account? <Link to="/login" className="text-indigo-600 font-semibold">Login</Link>
          </p>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden lg:flex rounded-3xl p-10 bg-gradient-to-br from-violet-600 via-indigo-700 to-indigo-800 text-white relative overflow-hidden lg:order-2"
        >
          <div className="absolute -top-20 -left-16 w-56 h-56 bg-white/10 rounded-full" />
          <div className="absolute -bottom-24 -right-16 w-64 h-64 bg-white/10 rounded-full" />
          <div className="relative z-10 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-5">
                <BookOpen className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold leading-tight">MockMaster</h1>
              <p className="text-white/85 mt-3 text-sm leading-relaxed max-w-sm">
                Create your account and keep your preparation journey synced across your tests.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Sparkles className="w-4 h-4" /> Personal analytics and trend tracking
              </div>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Sparkles className="w-4 h-4" /> Bookmarks saved to your account
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
