import { useState, useCallback, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { usePageCache } from '../hooks/usePageCache';
import {
  ArrowLeft, ArrowRight, Loader2, Clock, CheckCircle2, XCircle,
  Calendar, Trophy, History, Target, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';

const FILTERS = [
  { id: 'all', label: 'All Tests' },
  { id: 'completed', label: 'Completed' },
  { id: 'timed_out', label: 'Timed Out' },
];

function scoreTone(pct = 0) {
  if (pct >= 70) return { text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', ring: 'ring-emerald-100' };
  if (pct >= 50) return { text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', ring: 'ring-amber-100' };
  return { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', ring: 'ring-red-100' };
}

export default function TestHistory() {
  const [filter, setFilter] = useState('all');

  const fetchAttempts = useCallback(async () => {
    const { data } = await api.get('/attempts/my-attempts');
    return (data.data || []).filter((a) => ['completed', 'timed_out'].includes(a.status));
  }, []);

  const { data, loading, error } = usePageCache('test-history', fetchAttempts);
  const attempts = data ?? [];

  useEffect(() => {
    if (error && !loading && !attempts.length) toast.error('Failed to load history');
  }, [error, loading, attempts.length]);

  const stats = useMemo(() => {
    const completed = attempts.filter((a) => a.status === 'completed').length;
    const timedOut = attempts.filter((a) => a.status === 'timed_out').length;
    const avgScore = attempts.length
      ? Math.round(attempts.reduce((sum, a) => sum + (a.score?.percentage || 0), 0) / attempts.length)
      : 0;
    return { total: attempts.length, completed, timedOut, avgScore };
  }, [attempts]);

  const filtered = attempts.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'completed') return a.status === 'completed';
    if (filter === 'timed_out') return a.status === 'timed_out';
    return true;
  });

  const filterCounts = {
    all: attempts.length,
    completed: stats.completed,
    timed_out: stats.timedOut,
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Loading test history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 text-white p-6 sm:p-8 mb-8">
          <div className="absolute -top-16 -right-10 w-48 h-48 bg-white/10 rounded-full" />
          <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-white/10 rounded-full" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Test History</h1>
                <p className="text-sm text-white/80 mt-0.5">Review all your completed mock attempts</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {[
            { icon: History, label: 'Total Tests', value: stats.total, color: 'bg-indigo-50 text-indigo-600' },
            { icon: CheckCircle2, label: 'Completed', value: stats.completed, color: 'bg-emerald-50 text-emerald-600' },
            { icon: Clock, label: 'Timed Out', value: stats.timedOut, color: 'bg-amber-50 text-amber-600' },
            { icon: Target, label: 'Avg Score', value: `${stats.avgScore}%`, color: 'bg-violet-50 text-violet-600' },
          ].map((item) => (
            <div key={item.label} className="card p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{item.value}</p>
                  <p className="text-[11px] text-gray-400 font-medium">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-700'
              }`}
            >
              {tab.label}
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                filter === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {filterCounts[tab.id]}
              </span>
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12 sm:p-16 text-center border-dashed border-2 border-gray-200 bg-gray-50/40">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Clock className="w-8 h-8 text-indigo-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {attempts.length === 0 ? 'No tests taken yet' : 'No tests match this filter'}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              {attempts.length === 0
                ? 'Start your first mock test to build your performance history here.'
                : 'Try switching filters to see other attempts.'}
            </p>
            {attempts.length === 0 && (
              <Link to="/chapters" className="btn-primary !rounded-xl">
                <BookOpen className="w-4 h-4" /> Start Practicing
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((a, i) => {
              const pct = a.score?.percentage ?? 0;
              const tone = scoreTone(pct);
              return (
                <motion.div
                  key={a._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                >
                  <Link
                    to={`/result/${a._id}`}
                    className={`group block card p-4 sm:p-5 border-l-4 ${tone.border} hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ring-4 ${tone.ring} ${tone.bg}`}>
                          {a.status === 'timed_out' ? (
                            <Clock className={`w-5 h-5 ${tone.text}`} />
                          ) : pct >= 70 ? (
                            <Trophy className={`w-5 h-5 ${tone.text}`} />
                          ) : (
                            <XCircle className={`w-5 h-5 ${tone.text}`} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors truncate">
                            {a.test?.title || 'Untitled Test'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-gray-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(a.completedAt || a.createdAt).toLocaleDateString('en', {
                                month: 'short', day: 'numeric', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                            {a.status === 'timed_out' && (
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
                                Timed Out
                              </span>
                            )}
                            {a.status === 'completed' && (
                              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                Completed
                              </span>
                            )}
                            {a.tabSwitchCount > 0 && (
                              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                                {a.tabSwitchCount} tab switch{a.tabSwitchCount > 1 ? 'es' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className={`text-right px-3 py-2 rounded-xl ${tone.bg}`}>
                          <p className={`text-lg font-bold ${tone.text}`}>{pct}%</p>
                          <p className="text-[10px] text-gray-500 font-medium">
                            {a.score?.correct ?? 0}/{a.score?.total ?? 0} correct
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
