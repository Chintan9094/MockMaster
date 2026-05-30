import { useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { usePageCache } from '../hooks/usePageCache';
import { ArrowLeft, Clock, Award, Play, Loader2, FileText, BookOpen, ServerCrash, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChapterDetail() {
  const { chapterId } = useParams();
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    const { data } = await api.get(`/tests/chapters/${chapterId}`);
    return data.data;
  }, [chapterId]);

  const { data, loading, error, refetch } = usePageCache(`chapter:${chapterId}`, fetchData);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Loading topics...</p>
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
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Unable to load topics</h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Make sure the backend server is running: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono text-indigo-600">cd server && npm run dev</code>
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/chapters" className="btn-ghost">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <button onClick={refetch} className="btn-primary !rounded-xl !py-2.5">
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const hasTopics = data.topics && data.topics.length > 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
      <Link 
        to="/chapters" 
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Chapters
      </Link>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
          Chapter {data.chapter.number}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-3">
          {data.chapter.title}
        </h1>
        <p className="text-gray-500 text-sm mt-2">
          {hasTopics
            ? `${data.topics.length} topics available — select one to start practicing`
            : 'No topics added to this chapter yet'
          }
        </p>
      </motion.div>

      {!hasTopics ? (
        <div className="card p-10 sm:p-14 text-center border-dashed border-2 border-gray-200 bg-gray-50/50">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <BookOpen className="w-8 h-8 text-indigo-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Topics Available</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
            This chapter doesn't have any topics or tests yet. Add topics via the Admin API or re-run the seeder.
          </p>
          <div className="bg-gray-900 rounded-xl p-4 max-w-lg mx-auto text-left mb-6 space-y-2">
            <p className="text-[11px] text-gray-400 font-medium">Add a topic via API:</p>
            <code className="text-[12px] text-emerald-400 font-mono block break-all">
              POST /api/admin/topics {`{"title": "Topic Name", "chapterId": "${chapterId}"}`}
            </code>
          </div>
          <div className="flex gap-3 justify-center">
            <Link to="/chapters" className="btn-ghost">
              <ArrowLeft className="w-4 h-4" /> Back to Chapters
            </Link>
            <button onClick={refetch} className="btn-primary !rounded-xl">
              <RefreshCw className="w-4 h-4" /> Refresh
            </button>
          </div>
        </div>
      ) : (
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {data.topics.map(({ topic, tests }) => (
            <motion.div
              key={topic._id}
              variants={{
                hidden: { opacity: 0, y: 20, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } }
              }}
              whileHover={{ y: -4 }}
              className="card p-5"
            >
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-indigo-100/50">
                  <FileText className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-[14px] leading-snug pt-1.5">
                  {topic.title}
                </h3>
              </div>

              {tests.length > 0 ? (
                <div className="space-y-2.5">
                  {tests.map((test) => (
                    <div
                      key={test._id}
                      className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-xl border border-gray-100/50 hover:bg-indigo-50/50 hover:border-indigo-100/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-[13px] font-medium text-gray-700 truncate">{test.title}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Clock className="w-3 h-3" /> {test.duration} min
                          </span>
                          <span className="flex items-center gap-1 text-[11px] text-gray-400">
                            <Award className="w-3 h-3" /> {test.totalMarks} marks
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => navigate(`/exam/${test._id}`)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white text-[12px] font-semibold rounded-lg hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-600/20"
                      >
                        <Play className="w-3 h-3" fill="currentColor" /> Start
                      </motion.button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
                  <p className="text-xs text-gray-400">No tests created for this topic yet</p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
