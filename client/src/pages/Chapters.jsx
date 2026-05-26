import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { ChevronRight, Loader2, BookOpen, Layers, ServerCrash, RefreshCw } from 'lucide-react';

const chapterColors = [
  'from-rose-500 to-pink-600',
  'from-violet-500 to-purple-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-cyan-500 to-blue-600',
];

export default function Chapters() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchChapters = () => {
    setLoading(true);
    setError(false);
    api.get('/tests/chapters')
      .then(({ data }) => setChapters(data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchChapters(); }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Loading chapters...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center">
          <ServerCrash className="w-8 h-8 text-red-400" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Unable to connect to server</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            The backend server is not running. Start it with: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono text-indigo-600">cd server && npm run dev</code>
          </p>
        </div>
        <button onClick={fetchChapters} className="btn-primary !rounded-xl !py-2.5 mt-2">
          <RefreshCw className="w-4 h-4" /> Try Again
        </button>
      </div>
    );
  }

  if (!chapters.length) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Layers className="w-5 h-5 text-indigo-600" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Syllabus & Mock Tests</h1>
          </div>
        </div>

        <div className="card p-10 sm:p-14 text-center border-dashed border-2 border-gray-200 bg-gray-50/50">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-8 h-8 text-indigo-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Syllabus Added Yet</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            The mock test database is empty. Seed it with sample data to get started, or add chapters manually via the Admin API.
          </p>
          <div className="bg-gray-900 rounded-xl p-4 max-w-md mx-auto text-left mb-6">
            <p className="text-[11px] text-gray-400 mb-2 font-medium">Run in terminal:</p>
            <code className="text-sm text-emerald-400 font-mono">cd server && npm run seed</code>
          </div>
          <button onClick={fetchChapters} className="btn-primary !rounded-xl">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Syllabus & Mock Tests</h1>
          </div>
        </div>
        <p className="text-gray-500 text-sm ml-[52px]">
          Select a chapter to view topic-wise practice tests
        </p>
      </motion.div>

      <motion.div 
        initial="hidden"
        animate="visible"
        variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }}
        className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {chapters.map((chapter, idx) => (
          <motion.div
            key={chapter._id}
            variants={{
              hidden: { opacity: 0, y: 20, scale: 0.95 },
              visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
            }}
            whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              to={`/chapters/${chapter._id}`}
              className="group card-hover p-5 flex flex-col h-full"
            >
              <div className="flex items-start gap-4">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${chapterColors[idx % chapterColors.length]} flex items-center justify-center flex-shrink-0 shadow-lg shadow-gray-200/50`}>
                  <span className="text-white font-bold text-sm">{chapter.number}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-[14px] leading-snug group-hover:text-indigo-700 transition-colors">
                    {chapter.title}
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" />
                    {chapter.topics?.length || 0} Topics
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-end">
                <span className="text-xs font-medium text-indigo-600 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0">
                  View Tests <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
