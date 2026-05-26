import { create } from 'zustand';
import api from '../lib/api';

export const useExamStore = create((set, get) => ({
  attempt: null,
  questions: [],
  currentIndex: 0,
  answers: [],
  timeRemaining: 0,
  isFullscreen: false,
  tabSwitchCount: 0,
  isSubmitting: false,

  initExam: (attempt, questions) => {
    const answers = attempt.answers || questions.map(() => ({
      selectedAnswer: null,
      markedForReview: false,
      timeTaken: 0
    }));

    set({
      attempt,
      questions,
      currentIndex: attempt.currentQuestionIndex || 0,
      answers,
      timeRemaining: attempt.timeRemaining,
      tabSwitchCount: attempt.tabSwitchCount || 0
    });
  },

  setCurrentIndex: (index) => {
    const { attempt } = get();
    set({ currentIndex: index });
    api.put(`/attempts/${attempt._id}/progress`, {
      currentQuestionIndex: index,
      timeRemaining: get().timeRemaining
    }).catch(() => {});
  },

  selectAnswer: (answerOptionId) => {
    const { answers, currentIndex, attempt } = get();
    const newAnswers = [...answers];
    newAnswers[currentIndex] = { ...newAnswers[currentIndex], selectedAnswer: answerOptionId };
    set({ answers: newAnswers });
    api.put(`/attempts/${attempt._id}/answer`, {
      questionIndex: currentIndex,
      selectedAnswer: answerOptionId
    }).catch(() => {});
  },

  toggleMarkForReview: () => {
    const { answers, currentIndex, attempt } = get();
    const newAnswers = [...answers];
    const current = newAnswers[currentIndex];
    newAnswers[currentIndex] = { ...current, markedForReview: !current.markedForReview };
    set({ answers: newAnswers });
    api.put(`/attempts/${attempt._id}/answer`, {
      questionIndex: currentIndex,
      markedForReview: newAnswers[currentIndex].markedForReview
    }).catch(() => {});
  },

  clearAnswer: () => {
    const { answers, currentIndex, attempt } = get();
    const newAnswers = [...answers];
    newAnswers[currentIndex] = { ...newAnswers[currentIndex], selectedAnswer: null };
    set({ answers: newAnswers });
    api.put(`/attempts/${attempt._id}/answer`, {
      questionIndex: currentIndex,
      selectedAnswer: null
    }).catch(() => {});
  },

  decrementTime: () => {
    const { timeRemaining, attempt } = get();
    if (timeRemaining <= 0) return;
    const newTime = timeRemaining - 1;
    set({ timeRemaining: newTime });
    if (newTime % 30 === 0) {
      api.put(`/attempts/${attempt._id}/progress`, { timeRemaining: newTime }).catch(() => {});
    }
  },

  incrementTabSwitch: () => {
    const { tabSwitchCount, attempt } = get();
    const newCount = tabSwitchCount + 1;
    set({ tabSwitchCount: newCount });
    api.put(`/attempts/${attempt._id}/progress`, { tabSwitchCount: newCount }).catch(() => {});
  },

  setFullscreen: (val) => set({ isFullscreen: val }),

  submitExam: async (timedOut = false) => {
    const { attempt, isSubmitting } = get();
    if (isSubmitting) return null;
    set({ isSubmitting: true });
    try {
      const { data } = await api.post(`/attempts/${attempt._id}/submit`, { timedOut });
      set({ isSubmitting: false });
      return data.data;
    } catch (err) {
      set({ isSubmitting: false });
      throw err;
    }
  },

  resetExam: () => set({
    attempt: null,
    questions: [],
    currentIndex: 0,
    answers: [],
    timeRemaining: 0,
    isFullscreen: false,
    tabSwitchCount: 0,
    isSubmitting: false
  })
}));
