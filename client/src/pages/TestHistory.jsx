import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import {
  ArrowLeft, ArrowRight, Loader2, Clock, CheckCircle2, XCircle,
  Calendar, Trophy, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TestHistory() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/attempts/my-attempts')
      .then(({ data }) => setAttempts(data.data))
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = attempts.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'completed') return a.status === 'completed';
    if (filter === 'timed_out') return a.status === 'timed_out';
    return true;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Loading test history...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Test History</h1>
            <p className="text-sm text-gray-400 mt-1">{attempts.length} total attempt{attempts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {[
            { id: 'all', label: 'All' },
            { id: 'completed', label: 'Completed' },
            { id: 'timed_out', label: 'Timed Out' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              {attempts.length === 0 ? 'No tests taken yet.' : 'No tests match this filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((a, i) => (
              <motion.div
                key={a._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.5) }}
              >
                <Link
                  to={`/result/${a._id}`}
                  className="flex items-center justify-between p-4 card hover:border-indigo-200 transition-all group"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      a.score?.percentage >= 70 ? 'bg-emerald-50' :
                      a.score?.percentage >= 50 ? 'bg-amber-50' : 'bg-red-50'
                    }`}>
                      {a.status === 'timed_out' ? (
                        <Clock className={`w-5 h-5 ${
                          a.score?.percentage >= 70 ? 'text-emerald-500' :
                          a.score?.percentage >= 50 ? 'text-amber-500' : 'text-red-500'
                        }`} />
                      ) : a.score?.percentage >= 70 ? (
                        <Trophy className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-gray-800 group-hover:text-indigo-700 transition-colors truncate">
                        {a.test?.title || 'Untitled Test'}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(a.completedAt || a.createdAt).toLocaleDateString('en', {
                            month: 'short', day: 'numeric', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        {a.status === 'timed_out' && (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                            Timed Out
                          </span>
                        )}
                        {a.tabSwitchCount > 0 && (
                          <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                            {a.tabSwitchCount} tab switch{a.tabSwitchCount > 1 ? 'es' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        a.score?.percentage >= 70 ? 'text-emerald-600' :
                        a.score?.percentage >= 50 ? 'text-amber-600' : 'text-red-500'
                      }`}>{a.score?.percentage ?? 0}%</p>
                      <p className="text-[10px] text-gray-400">
                        {a.score?.correct ?? 0}/{a.score?.total ?? 0}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
