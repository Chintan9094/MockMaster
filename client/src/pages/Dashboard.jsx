import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import {
  BarChart3, Clock, Trophy, Target, ArrowRight, Play,
  Loader2, BookOpen, TrendingUp, AlertTriangle, CheckCircle2, Layers
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#22c55e', '#ef4444', '#94a3b8'];

export default function Dashboard() {
  const navigate = useNavigate();
  const [overall, setOverall] = useState(null);
  const [topicData, setTopicData] = useState(null);
  const [incomplete, setIncomplete] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      api.get('/analytics/overall'),
      api.get('/analytics/topics'),
      api.get('/attempts/incomplete')
    ])
      .then(([overallRes, topicsRes, incompleteRes]) => {
        setOverall(overallRes.data.data);
        setTopicData(topicsRes.data.data);
        setIncomplete(incompleteRes.data.data);
      })
      .catch(() => toast.error('Failed to load data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAbandon = async (attemptId) => {
    try {
      await api.post(`/attempts/${attemptId}/abandon`);
      setIncomplete(incomplete.filter(a => a._id !== attemptId));
      toast.success('Attempt discarded');
    } catch {
      toast.error('Failed to discard');
    }
  };

  const handleClearAll = async () => {
    try {
      await api.post('/attempts/abandon-all');
      setIncomplete([]);
      toast.success('All incomplete attempts cleared');
    } catch {
      toast.error('Failed to clear');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Loading your progress...</p>
      </div>
    );
  }

  const summary = overall?.summary || {};
  const pieData = [
    { name: 'Correct', value: summary.totalCorrect || 0 },
    { name: 'Incorrect', value: summary.totalIncorrect || 0 },
    { name: 'Unanswered', value: Math.max(0, (summary.totalQuestions || 0) - (summary.totalCorrect || 0) - (summary.totalIncorrect || 0)) }
  ];
  const hasData = summary.totalTests > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Progress</h1>
          <p className="text-sm text-gray-400 mt-1">Track your preparation journey</p>
        </div>
        <Link to="/chapters" className="btn-primary !py-2.5 !px-5 !text-[13px] !rounded-xl hidden sm:inline-flex">
          <BookOpen className="w-4 h-4" /> Practice More
        </Link>
      </motion.div>

      {/* Resume Banner */}
      {incomplete.length > 0 && (
        <div className="card p-5 mb-6 border-amber-200/60 bg-gradient-to-r from-amber-50/50 to-orange-50/30">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-semibold text-gray-900 text-sm">Resume Unfinished</h3>
            </div>
            <button
              onClick={handleClearAll}
              className="text-[11px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="space-y-2">
            {incomplete.map((a) => (
              <div key={a._id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-amber-100/50">
                <div>
                  <p className="font-medium text-gray-800 text-[13px]">{a.test?.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {Math.floor((a.timeRemaining || 0) / 60)} min left
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAbandon(a._id)}
                    className="text-[11px] text-gray-400 hover:text-red-500 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Discard
                  </button>
                  <button
                    onClick={() => navigate(`/exam/${a.test?._id}`)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 text-white text-[12px] font-semibold rounded-lg hover:bg-amber-600 active:scale-95 transition-all"
                  >
                    <Play className="w-3 h-3" fill="currentColor" /> Resume
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasData ? (
        <div className="card p-12 sm:p-16 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Layers className="w-8 h-8 text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No tests taken yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            Start practicing with mock tests to see your performance analytics here.
          </p>
          <Link to="/chapters" className="btn-primary !rounded-xl">
            <BookOpen className="w-4 h-4" /> Start Your First Test
          </Link>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8"
          >
            {[
              { icon: BookOpen, value: summary.totalTests, label: 'Tests Taken', color: 'bg-blue-50 text-blue-600' },
              { icon: Target, value: `${summary.accuracy}%`, label: 'Accuracy', color: 'bg-emerald-50 text-emerald-600' },
              { icon: TrendingUp, value: `${summary.avgPercentage}%`, label: 'Avg Score', color: 'bg-violet-50 text-violet-600' },
              { icon: Trophy, value: summary.totalCorrect, label: 'Correct Ans', color: 'bg-amber-50 text-amber-600' },
            ].map((stat, i) => (
              <motion.div 
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 15, scale: 0.9 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } }
                }}
                whileHover={{ y: -3, boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}
                className="card p-4 sm:p-5"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-5 mb-8">
            {/* Pie */}
            <div className="card p-5">
              <h3 className="font-semibold text-sm text-gray-900 mb-4">Answer Distribution</h3>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx]} />)}
                    </Pie>
                    <Tooltip formatter={(val, name) => [`${val}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 text-[11px] text-gray-500">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                    {item.name} ({item.value})
                  </div>
                ))}
              </div>
            </div>

            {/* Line */}
            <div className="card p-5">
              <h3 className="font-semibold text-sm text-gray-900 mb-4">Score Trend</h3>
              {overall?.progressOverTime?.length > 1 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={overall.progressOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })} fontSize={11} />
                    <YAxis domain={[0, 100]} fontSize={11} />
                    <Tooltip labelFormatter={(v) => new Date(v).toLocaleDateString()} formatter={(v) => [`${v}%`, 'Score']} />
                    <Line type="monotone" dataKey="percentage" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[220px] text-sm text-gray-400">
                  Take more tests to see trends
                </div>
              )}
            </div>
          </div>

          {/* Weak / Strong Topics */}
          <div className="grid lg:grid-cols-2 gap-5 mb-8">
            {topicData?.weakTopics?.length > 0 && (
              <div className="card p-5 border-red-100/50">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <h3 className="font-semibold text-sm text-gray-900">Needs Improvement</h3>
                </div>
                <div className="space-y-2">
                  {topicData.weakTopics.slice(0, 5).map((t) => (
                    <div key={t.topicId} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl">
                      <div>
                        <p className="text-[13px] font-medium text-gray-800">{t.topicTitle}</p>
                        <p className="text-[11px] text-gray-400">{t.correct}/{t.total} correct</p>
                      </div>
                      <span className="text-sm font-bold text-red-500">{t.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {topicData?.strongTopics?.length > 0 && (
              <div className="card p-5 border-emerald-100/50">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-semibold text-sm text-gray-900">Strong Topics</h3>
                </div>
                <div className="space-y-2">
                  {topicData.strongTopics.slice(0, 5).map((t) => (
                    <div key={t.topicId} className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl">
                      <div>
                        <p className="text-[13px] font-medium text-gray-800">{t.topicTitle}</p>
                        <p className="text-[11px] text-gray-400">{t.correct}/{t.total} correct</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">{t.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-gray-900">Recent Tests</h3>
              <Link
                to="/history"
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
              >
                See All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="space-y-2">
              {overall?.recentAttempts?.slice(0, 6).map((a) => (
                <Link
                  key={a.id}
                  to={`/result/${a.id}`}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                >
                  <div>
                    <p className="text-[13px] font-medium text-gray-800 group-hover:text-indigo-700 transition-colors">{a.testTitle}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(a.completedAt).toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    {a.tabSwitchCount > 0 && (
                      <span className="text-[10px] font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-md">
                        {a.tabSwitchCount} tab switch{a.tabSwitchCount > 1 ? 'es' : ''}
                      </span>
                    )}
                    <div className="text-right">
                      <p className={`text-sm font-bold ${
                        a.score.percentage >= 70 ? 'text-emerald-600' :
                        a.score.percentage >= 50 ? 'text-amber-600' : 'text-red-500'
                      }`}>{a.score.percentage}%</p>
                      <p className="text-[10px] text-gray-400">{a.score.correct}/{a.score.total}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
