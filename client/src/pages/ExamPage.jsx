import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useExamStore } from '../store/examStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  ChevronLeft, ChevronRight, Flag, CheckCircle, Clock, AlertTriangle,
  Maximize, Minimize, BookOpen, Loader2, X, RotateCcw, Grid3X3, Bookmark, Keyboard
} from 'lucide-react';
import { useBookmarkStore } from '../store/bookmarkStore';
import QuestionPalette from '../components/QuestionPalette';

const OPTION_KEY_MAP = { '1': 'A', '2': 'B', '3': 'C', '4': 'D', a: 'A', b: 'B', c: 'C', d: 'D' };

const SHORTCUTS = [
  { keys: ['1', '2', '3', '4'], label: 'Select option A, B, C, or D' },
  { keys: ['←', '→'], label: 'Previous / next question' },
  { keys: ['M'], label: 'Mark for review' },
  { keys: ['?'], label: 'Show / hide shortcuts' },
  { keys: ['Esc'], label: 'Close panels' },
];

function Kbd({ children }) {
  return (
    <kbd className="inline-flex min-w-[1.25rem] items-center justify-center px-1.5 py-0.5 text-[10px] font-mono font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded shadow-[0_1px_0_rgba(0,0,0,0.06)]">
      {children}
    </kbd>
  );
}

export default function ExamPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [mobilePalette, setMobilePalette] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const timerRef = useRef(null);

  const {
    attempt, questions, currentIndex, answers, timeRemaining,
    isFullscreen, tabSwitchCount, isSubmitting,
    initExam, setCurrentIndex, selectAnswer, toggleMarkForReview,
    clearAnswer, decrementTime, incrementTabSwitch, setFullscreen,
    submitExam, resetExam
  } = useExamStore();
  const { toggleBookmark, isBookmarked } = useBookmarkStore();

  const loadingRef = useRef(false);
  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    loadExam();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [testId]);

  useEffect(() => {
    if (attempt && timeRemaining > 0) {
      timerRef.current = setInterval(decrementTime, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [attempt, timeRemaining > 0]);

  useEffect(() => {
    if (attempt && timeRemaining <= 0 && !isSubmitting) {
      handleAutoSubmit();
    }
  }, [timeRemaining]);

  useEffect(() => {
    const handler = () => {
      if (document.hidden && attempt) {
        incrementTabSwitch();
        toast('Tab switch detected!', { icon: '⚠️', duration: 2000 });
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [attempt, tabSwitchCount]);

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Warn on browser back/refresh/close
  useEffect(() => {
    if (!attempt) return;
    const beforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    const popState = (e) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      setShowLeaveWarning(true);
    };
    window.addEventListener('beforeunload', beforeUnload);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', popState);
    return () => {
      window.removeEventListener('beforeunload', beforeUnload);
      window.removeEventListener('popstate', popState);
    };
  }, [attempt]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!attempt || loading) return;

    const handleKeyDown = (e) => {
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;

      if (showConfirmSubmit || showLeaveWarning) return;

      if (e.key === 'Escape') {
        if (showShortcuts) {
          e.preventDefault();
          setShowShortcuts(false);
        } else if (mobilePalette) {
          e.preventDefault();
          setMobilePalette(false);
        }
        return;
      }

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts((v) => !v);
        return;
      }

      if (showShortcuts || mobilePalette) return;

      const optionId = OPTION_KEY_MAP[e.key];
      if (optionId) {
        e.preventDefault();
        selectAnswer(optionId);
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentIndex(Math.max(0, currentIndex - 1));
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1));
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMarkForReview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    attempt, loading, currentIndex, questions.length,
    showConfirmSubmit, showLeaveWarning, mobilePalette, showShortcuts,
    selectAnswer, setCurrentIndex, toggleMarkForReview
  ]);

  const loadExam = async () => {
    try {
      const { data } = await api.post(`/attempts/start/${testId}`);
      initExam(data.data, data.data.questionOrder);
      if (data.resumed) toast.success('Resumed your previous attempt');
    } catch {
      toast.error('Failed to start test');
      navigate('/chapters');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = async () => {
    toast.error("Time's up! Submitting...");
    try {
      const result = await submitExam(true);
      if (result) navigate(`/result/${result._id}`);
    } catch { toast.error('Submit failed'); }
  };

  const handleSubmit = async () => {
    setShowConfirmSubmit(false);
    try {
      const result = await submitExam(false);
      if (result) { resetExam(); navigate(`/result/${result._id}`); }
    } catch { toast.error('Submit failed'); }
  };

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const statusStyles = {
    current: 'border-2 border-indigo-600 bg-white text-indigo-700 font-bold shadow-sm',
    answered: 'bg-emerald-500 text-white font-semibold border-2 border-emerald-500',
    marked: 'bg-amber-400 text-white font-semibold border-2 border-amber-400',
    'marked-answered': 'bg-amber-400 text-white font-semibold border-2 border-emerald-500',
    unvisited: 'bg-gray-50 text-gray-500 border-2 border-gray-200 hover:border-gray-300'
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm text-gray-500 font-medium">Preparing your exam...</p>
      </div>
    );
  }

  if (!attempt || !questions.length) return null;

  const currentQuestion = questions[currentIndex];
  const currentAnswer = answers[currentIndex];
  const answeredCount = answers.filter(a => a?.selectedAnswer).length;
  const markedCount = answers.filter(a => a?.markedForReview).length;
  const timeWarning = timeRemaining < 60;
  const timeCaution = timeRemaining < 300 && !timeWarning;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Top Navigation Bar */}
      <header className="flex-shrink-0 bg-indigo-700 px-4 sm:px-6 h-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-white/80" />
          <span className="font-bold text-white text-sm">MockMaster</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowShortcuts(true)}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Sub Header - Question info + Timer + Submit */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
            {questions.length} total
          </span>
          {currentQuestion?.difficulty && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${
              currentQuestion.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
              currentQuestion.difficulty === 'medium' ? 'bg-amber-50 text-amber-600' :
              'bg-red-50 text-red-600'
            }`}>
              {currentQuestion.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowConfirmSubmit(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white text-[13px] font-semibold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
          >
            <CheckCircle className="w-4 h-4" />
            Submit
          </motion.button>

          {/* Timer - Large & Prominent */}
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
            timeWarning ? 'border-red-400 bg-red-50' :
            timeCaution ? 'border-amber-300 bg-amber-50' :
            'border-gray-300 bg-gray-50'
          }`}>
            <Clock className={`w-4 h-4 ${
              timeWarning ? 'text-red-500' : timeCaution ? 'text-amber-500' : 'text-gray-500'
            }`} />
            <span className={`font-mono text-xl sm:text-2xl font-bold tracking-wider ${
              timeWarning ? 'text-red-600 animate-pulse-soft' :
              timeCaution ? 'text-amber-600' :
              'text-gray-800'
            }`}>
              {formatTime(timeRemaining)}
            </span>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Question Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-[#f5f6fa]">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="px-5 sm:px-6 pt-4 pb-3">
                    <h2 className="text-[15px] sm:text-[16px] font-medium text-gray-900 leading-relaxed">
                      {currentQuestion?.questionText}
                    </h2>
                  </div>

                  <div className="px-3 sm:px-4 pb-2">
                    <p className="text-[10px] text-gray-400 mb-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span><Kbd>1</Kbd>–<Kbd>4</Kbd> select</span>
                      <span><Kbd>←</Kbd><Kbd>→</Kbd> nav</span>
                      <span><Kbd>M</Kbd> review</span>
                      <button
                        type="button"
                        onClick={() => setShowShortcuts(true)}
                        className="text-indigo-500 hover:text-indigo-700 font-medium"
                      >
                        Shortcuts
                      </button>
                    </p>
                    {currentQuestion?.options?.map((option) => {
                      const isSelected = currentAnswer?.selectedAnswer === option.id;
                      const hotkey = { A: '1', B: '2', C: '3', D: '4' }[option.id];
                      return (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => selectAnswer(option.id)}
                          className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 flex items-center gap-3 transition-all duration-150 hover:bg-indigo-50/40 ${
                            isSelected ? 'bg-indigo-50' : ''
                          }`}
                        >
                          <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-1.5 h-1.5 bg-white rounded-full"
                              />
                            )}
                          </span>
                          <span className={`flex-1 text-[14px] leading-snug ${
                            isSelected ? 'text-indigo-900 font-medium' : 'text-gray-700'
                          }`}>
                            <span className="font-semibold text-indigo-600 mr-1.5">{option.id}.</span>
                            {option.text}
                          </span>
                          {hotkey && <Kbd>{hotkey}</Kbd>}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Bottom bar — always visible */}
          <div className="shrink-0 border-t border-gray-200 bg-white px-4 sm:px-6 py-3 pb-safe lg:pb-3">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-2 pr-14 lg:pr-0">
              <motion.button
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                title="Previous (←)"
                className="flex items-center gap-1 px-4 py-2 text-gray-600 text-[13px] font-medium hover:bg-gray-50 rounded-lg border border-gray-200 transition-all disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </motion.button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={clearAnswer}
                  disabled={!currentAnswer?.selectedAnswer}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
                  title="Clear selection"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleMarkForReview}
                  className={`p-2 rounded-lg transition-all ${
                    currentAnswer?.markedForReview
                      ? 'text-amber-600 bg-amber-50'
                      : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                  title="Mark for review (M)"
                >
                  <Flag className="w-4 h-4" fill={currentAnswer?.markedForReview ? 'currentColor' : 'none'} />
                </button>
                <button
                  onClick={() => {
                    const added = toggleBookmark({
                      questionId: currentQuestion._id,
                      questionText: currentQuestion.questionText,
                      options: currentQuestion.options,
                      correctAnswer: currentQuestion.correctAnswer,
                      explanation: currentQuestion.explanation || '',
                      difficulty: currentQuestion.difficulty
                    });
                    toast.success(added ? 'Question bookmarked' : 'Bookmark removed');
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    isBookmarked(currentQuestion?._id)
                      ? 'text-indigo-600 bg-indigo-50'
                      : 'text-gray-400 hover:text-indigo-600 hover:bg-indigo-50'
                  }`}
                  title={isBookmarked(currentQuestion?._id) ? 'Remove bookmark' : 'Bookmark for revision'}
                >
                  <Bookmark className="w-4 h-4" fill={isBookmarked(currentQuestion?._id) ? 'currentColor' : 'none'} />
                </button>
              </div>

              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                disabled={currentIndex === questions.length - 1}
                title="Next (→)"
                className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-[13px] font-semibold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-30 shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Sidebar - Question Overview (Desktop) */}
        <aside className="hidden lg:flex flex-col w-[300px] min-h-0 shrink-0 border-l border-gray-200 bg-white p-4 pt-5">
          <QuestionPalette
            total={questions.length}
            answers={answers}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
            statusStyles={statusStyles}
            answeredCount={answeredCount}
            markedCount={markedCount}
            tabSwitchCount={tabSwitchCount}
            onShowShortcuts={() => setShowShortcuts(true)}
            className="flex-1 min-h-0"
          />
        </aside>
      </div>

      {/* Mobile FAB */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setMobilePalette(true)}
        className="lg:hidden fixed bottom-5 right-5 z-[60] w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-600/30 flex flex-col items-center justify-center"
      >
        <Grid3X3 className="w-5 h-5" />
        <span className="text-[9px] font-bold mt-0.5">{answeredCount}/{questions.length}</span>
      </motion.button>

      {/* Mobile Palette Sheet */}
      <AnimatePresence>
        {mobilePalette && (
          <div className="lg:hidden fixed inset-0 z-[70]">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobilePalette(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pt-3 max-h-[70vh] flex flex-col shadow-2xl"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4 shrink-0" />
              <div className="flex items-center justify-between mb-3 shrink-0">
                <h4 className="font-bold text-sm text-gray-900">Question Overview</h4>
                <button type="button" onClick={() => setMobilePalette(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <QuestionPalette
                total={questions.length}
                answers={answers}
                currentIndex={currentIndex}
                onSelect={(idx) => { setCurrentIndex(idx); setMobilePalette(false); }}
                statusStyles={statusStyles}
                answeredCount={answeredCount}
                markedCount={markedCount}
                tabSwitchCount={tabSwitchCount}
                onShowShortcuts={() => { setMobilePalette(false); setShowShortcuts(true); }}
                className="flex-1 min-h-0"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[85] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                    <Keyboard className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Keyboard Shortcuts</h3>
                    <p className="text-xs text-gray-500">Answer faster during the exam</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <ul className="space-y-3">
                {SHORTCUTS.map((s) => (
                  <li
                    key={s.label}
                    className="flex items-center justify-between gap-4 py-2.5 px-3 rounded-xl bg-gray-50"
                  >
                    <span className="text-sm text-gray-700">{s.label}</span>
                    <span className="flex gap-1 shrink-0">
                      {s.keys.map((k) => (
                        <Kbd key={k}>{k}</Kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-center text-xs text-gray-400">
                Press <Kbd>?</Kbd> anytime to toggle this panel
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Confirmation Modal */}
      <AnimatePresence>
        {showConfirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                  className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-5"
                >
                  <AlertTriangle className="w-7 h-7 text-amber-500" />
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Submit Test?</h3>
                <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>

                <div className="grid grid-cols-3 gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-600">{answeredCount}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Answered</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-amber-500">{markedCount}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Marked</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-red-500">{questions.length - answeredCount}</p>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Skipped</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmSubmit(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Continue
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Confirm Submit'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leave Warning Modal */}
      <AnimatePresence>
        {showLeaveWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl p-7 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                  className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5"
                >
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Leave Test?</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Your test is still in progress. If you leave now, your progress will be saved and you can resume later, but the timer will keep running.
                </p>

                <div className="p-3 bg-amber-50 rounded-xl mb-6 border border-amber-100">
                  <p className="text-xs text-amber-700 font-medium flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    Time remaining: {formatTime(timeRemaining)}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLeaveWarning(false)}
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    Continue Test
                  </button>
                  <button
                    onClick={() => {
                      setShowLeaveWarning(false);
                      resetExam();
                      navigate('/chapters');
                    }}
                    className="flex-1 px-4 py-3 bg-red-50 text-red-600 font-semibold text-sm rounded-xl hover:bg-red-100 transition-colors border border-red-200"
                  >
                    Leave Anyway
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
