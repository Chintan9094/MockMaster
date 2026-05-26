import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useExamStore } from '../store/examStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  ChevronLeft, ChevronRight, Flag, CheckCircle, Clock, AlertTriangle,
  Maximize, Minimize, BookOpen, Loader2, X, RotateCcw, Grid3X3
} from 'lucide-react';

export default function ExamPage() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showLeaveWarning, setShowLeaveWarning] = useState(false);
  const [mobilePalette, setMobilePalette] = useState(false);
  const timerRef = useRef(null);

  const {
    attempt, questions, currentIndex, answers, timeRemaining,
    isFullscreen, tabSwitchCount, isSubmitting,
    initExam, setCurrentIndex, selectAnswer, toggleMarkForReview,
    clearAnswer, decrementTime, incrementTabSwitch, setFullscreen,
    submitExam, resetExam
  } = useExamStore();

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

  const getStatus = (idx) => {
    const a = answers[idx];
    if (idx === currentIndex) return 'current';
    if (!a) return 'unvisited';
    if (a.markedForReview && a.selectedAnswer) return 'marked-answered';
    if (a.markedForReview) return 'marked';
    if (a.selectedAnswer) return 'answered';
    return 'unvisited';
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
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Sub Header - Question info + Timer + Submit */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">
            Question {currentIndex + 1} of {questions.length}
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
      <div className="flex-1 flex min-h-0">
        {/* Question Area */}
        <div className="flex-1 overflow-y-auto bg-[#f5f6fa]">
          <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              >
                {/* Question Text */}
                <div className="px-6 sm:px-8 pt-6 pb-4">
                  <h2 className="text-[15px] sm:text-[17px] font-medium text-gray-900 leading-relaxed">
                    {currentQuestion?.questionText}
                  </h2>
                </div>

                {/* Options */}
                <div className="px-4 sm:px-6 pb-6">
                  {currentQuestion?.options?.map((option) => {
                    const isSelected = currentAnswer?.selectedAnswer === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => selectAnswer(option.id)}
                        className={`w-full text-left px-5 py-4 border-b border-gray-100 last:border-b-0 flex items-center gap-4 transition-all duration-150 hover:bg-indigo-50/40 ${
                          isSelected ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="w-2 h-2 bg-white rounded-full"
                            />
                          )}
                        </span>
                        <span className={`text-[14px] sm:text-[15px] leading-relaxed ${
                          isSelected ? 'text-indigo-900 font-medium' : 'text-gray-700'
                        }`}>
                          {option.text}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Navigation */}
            <div className="flex items-center justify-between mt-6">
              <motion.button
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-5 py-2.5 text-gray-600 text-[13px] font-medium hover:bg-white hover:shadow-sm rounded-lg border border-transparent hover:border-gray-200 transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:border-transparent disabled:hover:shadow-none"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </motion.button>

              <div className="flex items-center gap-2">
                <button
                  onClick={clearAnswer}
                  disabled={!currentAnswer?.selectedAnswer}
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-30"
                  title="Clear selection"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={toggleMarkForReview}
                  className={`p-2.5 rounded-lg transition-all ${
                    currentAnswer?.markedForReview
                      ? 'text-amber-600 bg-amber-50'
                      : 'text-gray-400 hover:text-amber-600 hover:bg-amber-50'
                  }`}
                  title="Mark for review"
                >
                  <Flag className="w-4 h-4" fill={currentAnswer?.markedForReview ? 'currentColor' : 'none'} />
                </button>
              </div>

              <motion.button
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                disabled={currentIndex === questions.length - 1}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-600 text-white text-[13px] font-semibold rounded-lg hover:bg-indigo-700 transition-all disabled:opacity-30 shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Sidebar - Question Overview (Desktop) */}
        <aside className="hidden lg:flex flex-col w-[280px] border-l border-gray-200 bg-white">
          <div className="px-5 py-4 border-b border-gray-100">
            <h4 className="text-sm font-bold text-gray-800">Question Overview</h4>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            <div className="grid grid-cols-5 gap-2">
              {questions.map((_, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-full aspect-square rounded-md text-[12px] transition-all ${statusStyles[getStatus(idx)]}`}
                >
                  {idx + 1}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="p-5 border-t border-gray-100 space-y-3">
            <div className="grid grid-cols-1 gap-2.5 text-[12px]">
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-emerald-500 border-2 border-emerald-500" />
                <span className="text-gray-600">Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-amber-400 border-2 border-amber-400" />
                <span className="text-gray-600">Marked for Review ({markedCount})</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-gray-50 border-2 border-gray-200" />
                <span className="text-gray-600">Not Visited ({questions.length - answeredCount})</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="w-5 h-5 rounded-md bg-white border-2 border-indigo-600" />
                <span className="text-gray-600">Current</span>
              </div>
            </div>

            {tabSwitchCount > 0 && (
              <div className="p-3 bg-red-50 rounded-lg flex items-center gap-2 text-[11px] text-red-600 font-medium border border-red-100">
                <AlertTriangle className="w-3.5 h-3.5" />
                Tab switches: {tabSwitchCount}
              </div>
            )}
          </div>
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
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-5 pt-3 max-h-[70vh] overflow-y-auto shadow-2xl"
            >
              <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-sm text-gray-900">Question Overview</h4>
                <button onClick={() => setMobilePalette(false)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2.5">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setCurrentIndex(idx); setMobilePalette(false); }}
                    className={`w-full aspect-square rounded-lg text-[12px] transition-all ${statusStyles[getStatus(idx)]}`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2.5 mt-5 pt-4 border-t border-gray-100 text-[11px]">
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-emerald-500 border-2 border-emerald-500" /><span className="text-gray-600">Answered ({answeredCount})</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-amber-400 border-2 border-amber-400" /><span className="text-gray-600">Review ({markedCount})</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-gray-50 border-2 border-gray-200" /><span className="text-gray-600">Not Visited</span></div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 rounded bg-white border-2 border-indigo-600" /><span className="text-gray-600">Current</span></div>
              </div>
            </motion.div>
          </div>
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
