import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../lib/api';
import {
  Trophy, Target, XCircle, MinusCircle, ArrowLeft,
  CheckCircle2, RotateCcw, Loader2, ChevronDown, Clock, Sparkles, MonitorX, Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useBookmarkStore } from '../store/bookmarkStore';

export default function ResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState({});
  const [showAll, setShowAll] = useState(false);
  const { fetchBookmarks, toggleBookmark, isBookmarked } = useBookmarkStore();

  useEffect(() => {
    fetchBookmarks().catch(() => {});
    api.get(`/attempts/${attemptId}/result`)
      .then(({ data }) => setResult(data.data))
      .catch(() => toast.error('Failed to load result'))
      .finally(() => setLoading(false));
  }, [attemptId, fetchBookmarks]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-400">Loading results...</p>
      </div>
    );
  }

  if (!result) return null;

  const { score, test, questionOrder, answers, tabSwitchCount, status } = result;
  const isPassed = score.percentage >= 50;
  const displayedQuestions = showAll ? questionOrder : questionOrder.slice(0, 5);

  return (
    <div className="min-h-screen bg-[#fafbff]">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <Link to="/chapters" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 mb-8 transition-colors group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" /> Back to Tests
        </Link>

        {/* Score Hero */}
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className={`card p-8 sm:p-10 text-center mb-8 border-2 ${isPassed ? 'border-emerald-100 bg-gradient-to-b from-emerald-50/50 to-white' : 'border-red-100 bg-gradient-to-b from-red-50/30 to-white'}`}
        >
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.2 }}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 ${
              isPassed ? 'bg-emerald-100' : 'bg-red-100'
            }`}
          >
            {isPassed ? <Trophy className="w-8 h-8 text-emerald-600" /> : <Target className="w-8 h-8 text-red-500" />}
          </motion.div>

          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{test?.title}</h1>
          
          {status === 'timed_out' && (
            <p className="text-xs text-amber-600 flex items-center justify-center gap-1 mb-3">
              <Clock className="w-3 h-3" /> Auto-submitted (time expired)
            </p>
          )}

          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            className="mt-4 mb-2"
          >
            <span className={`text-5xl sm:text-6xl font-extrabold ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>
              {score.percentage}
            </span>
            <span className="text-2xl text-gray-400 font-medium">%</span>
          </motion.div>
          <p className="text-sm text-gray-500">
            {score.marksObtained.toFixed(1)} out of {score.totalMarks} marks
          </p>
          <p className={`text-sm font-semibold mt-2 ${isPassed ? 'text-emerald-600' : 'text-red-500'}`}>
            {isPassed ? 'Great job! You passed!' : 'Keep practicing, you\'ll get there!'}
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-4 gap-3 mb-8"
        >
          {[
            { icon: CheckCircle2, value: score.correct, label: 'Correct', color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { icon: XCircle, value: score.incorrect, label: 'Wrong', color: 'text-red-500', bg: 'bg-red-50' },
            { icon: MinusCircle, value: score.unanswered, label: 'Skipped', color: 'text-gray-400', bg: 'bg-gray-50' },
            { icon: MonitorX, value: tabSwitchCount || 0, label: 'Tab Switches', color: tabSwitchCount > 0 ? 'text-red-500' : 'text-emerald-500', bg: tabSwitchCount > 0 ? 'bg-red-50' : 'bg-emerald-50' },
          ].map((s, i) => (
            <motion.div 
              key={i} 
              variants={{
                hidden: { opacity: 0, y: 15, scale: 0.9 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4 } }
              }}
              className="card p-4 text-center"
            >
              <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-[10px] text-gray-400 font-medium mt-0.5">{s.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="flex flex-wrap gap-3 mb-10"
        >
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }} onClick={() => navigate(`/exam/${result.test._id}`)} className="btn-primary !rounded-xl">
            <RotateCcw className="w-4 h-4" /> Retake Test
          </motion.button>
          <Link to="/dashboard" className="btn-outline !rounded-xl">
            View Progress
          </Link>
          <Link to="/bookmarks" className="btn-outline !rounded-xl">
            <Bookmark className="w-4 h-4" /> My Bookmarks
          </Link>
        </motion.div>

        {/* Answer Review */}
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-bold text-gray-900">Detailed Review</h2>
          </div>

          <div className="space-y-3">
            {displayedQuestions.map((question, idx) => {
              const answer = answers[idx];
              const isCorrect = answer?.isCorrect;
              const isUnanswered = !answer?.selectedAnswer;
              const isExpanded = expandedQ[idx];

              return (
                <div key={idx} className={`card overflow-hidden transition-all ${
                  isExpanded ? 'shadow-md' : ''
                }`}>
                  <div
                    className="p-4 sm:p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                    onClick={() => setExpandedQ(p => ({ ...p, [idx]: !p[idx] }))}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        isUnanswered ? 'bg-gray-100' : isCorrect ? 'bg-emerald-100' : 'bg-red-100'
                      }`}>
                        {isUnanswered ? <MinusCircle className="w-3.5 h-3.5 text-gray-400" /> :
                         isCorrect ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> :
                         <XCircle className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[11px] font-semibold text-gray-400">Q{idx + 1}</span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            isUnanswered ? 'bg-gray-100 text-gray-500' :
                            isCorrect ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                          }`}>
                            {isUnanswered ? 'SKIPPED' : isCorrect ? 'CORRECT' : 'WRONG'}
                          </span>
                        </div>
                        <p className="text-[13px] text-gray-800 font-medium leading-relaxed line-clamp-2">
                          {question.questionText}
                        </p>
                      </div>
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            const added = await toggleBookmark({
                              questionId: question._id,
                              questionText: question.questionText,
                              options: question.options,
                              correctAnswer: question.correctAnswer,
                              explanation: question.explanation || '',
                              difficulty: question.difficulty
                            });
                            toast.success(added ? 'Question bookmarked' : 'Bookmark removed');
                          } catch {
                            toast.error('Failed to update bookmark');
                          }
                        }}
                        className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                          isBookmarked(question._id)
                            ? 'text-indigo-600 bg-indigo-50'
                            : 'text-gray-300 hover:text-indigo-500 hover:bg-indigo-50'
                        }`}
                        title={isBookmarked(question._id) ? 'Remove bookmark' : 'Bookmark for revision'}
                      >
                        <Bookmark className="w-4 h-4" fill={isBookmarked(question._id) ? 'currentColor' : 'none'} />
                      </button>
                      <ChevronDown className={`w-4 h-4 text-gray-300 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 sm:px-5 pb-5 pt-0 border-t border-gray-50 animate-fade-in">
                      <div className="grid sm:grid-cols-2 gap-2 mt-4">
                        {question.options.map((opt) => {
                          const isCorrectOpt = opt.id === question.correctAnswer;
                          const isUserChoice = opt.id === answer?.selectedAnswer;
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[13px] border ${
                                isCorrectOpt
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                  : isUserChoice && !isCorrect
                                  ? 'bg-red-50 border-red-200 text-red-800'
                                  : 'bg-gray-50 border-gray-100 text-gray-600'
                              }`}
                            >
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                                isCorrectOpt ? 'bg-emerald-500 text-white' :
                                isUserChoice && !isCorrect ? 'bg-red-500 text-white' :
                                'bg-gray-200 text-gray-500'
                              }`}>
                                {opt.id}
                              </span>
                              <span className="leading-snug">{opt.text}</span>
                            </div>
                          );
                        })}
                      </div>

                      {question.explanation && (
                        <div className="mt-4 p-4 bg-indigo-50/70 rounded-xl border border-indigo-100/50">
                          <p className="text-[11px] font-semibold text-indigo-600 mb-1">EXPLANATION</p>
                          <p className="text-[13px] text-indigo-900 leading-relaxed">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!showAll && questionOrder.length > 5 && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full mt-4 btn-ghost !py-3 !text-indigo-600"
            >
              Show all {questionOrder.length} questions
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
