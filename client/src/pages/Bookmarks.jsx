import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bookmark, ArrowLeft, Trash2, ChevronDown, CheckCircle2,
  BookOpen, AlertTriangle
} from 'lucide-react';
import { useBookmarkStore } from '../store/bookmarkStore';

export default function Bookmarks() {
  const { bookmarks, removeBookmark, clearAll } = useBookmarkStore();
  const [expandedQ, setExpandedQ] = useState({});
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Bookmarked Questions</h1>
            <p className="text-sm text-gray-400 mt-1">
              {bookmarks.length} saved for revision
            </p>
          </div>
          {bookmarks.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        {bookmarks.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <Bookmark className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bookmarks yet</h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
              During a test or on the result page, tap the bookmark icon on any question to save it here for later review.
            </p>
            <Link to="/chapters" className="btn-primary !rounded-xl">
              <BookOpen className="w-4 h-4" /> Start Practicing
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookmarks.map((q, idx) => {
              const isExpanded = expandedQ[q.questionId];
              return (
                <motion.div
                  key={q.questionId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  className="card overflow-hidden"
                >
                  <div
                    className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => setExpandedQ((p) => ({ ...p, [q.questionId]: !p[q.questionId] }))}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 bg-indigo-100">
                        <Bookmark className="w-3.5 h-3.5 text-indigo-600" fill="currentColor" />
                      </div>
                      <div className="flex-1 min-w-0">
                        {q.difficulty && (
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase mb-1 inline-block ${
                            q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
                            q.difficulty === 'medium' ? 'bg-amber-50 text-amber-600' :
                            'bg-red-50 text-red-600'
                          }`}>
                            {q.difficulty}
                          </span>
                        )}
                        <p className="text-[13px] text-gray-800 font-medium leading-relaxed">
                          {q.questionText}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeBookmark(q.questionId); }}
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        title="Remove bookmark"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 sm:px-5 pb-5 pt-0 border-t border-gray-50">
                          <div className="grid sm:grid-cols-2 gap-2 mt-4">
                            {q.options?.map((opt) => {
                              const isCorrect = opt.id === q.correctAnswer;
                              return (
                                <div
                                  key={opt.id}
                                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] border ${
                                    isCorrect
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                      : 'bg-gray-50 border-gray-100 text-gray-600'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                                    isCorrect ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-500'
                                  }`}>
                                    {opt.id}
                                  </span>
                                  <span className="leading-snug flex-1">{opt.text}</span>
                                  {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                                </div>
                              );
                            })}
                          </div>
                          {q.explanation && (
                            <div className="mt-4 p-4 bg-indigo-50/70 rounded-xl border border-indigo-100/50">
                              <p className="text-[11px] font-semibold text-indigo-600 mb-1">EXPLANATION</p>
                              <p className="text-[13px] text-indigo-900 leading-relaxed">{q.explanation}</p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowClearConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Clear all bookmarks?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  This removes all {bookmarks.length} saved questions. This cannot be undone.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { clearAll(); setShowClearConfirm(false); }}
                    className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold text-sm rounded-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
