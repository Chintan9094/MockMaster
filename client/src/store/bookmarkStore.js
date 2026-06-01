import { create } from 'zustand';
import api from '../lib/api';

const STORAGE_KEY = 'mockmaster_bookmarks';

function loadBookmarks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveBookmarks(bookmarks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export const useBookmarkStore = create((set, get) => ({
  bookmarks: loadBookmarks(),
  loading: false,

  fetchBookmarks: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/bookmarks');
      const normalized = (data.data || []).map((b) => ({
        ...b,
        questionId: String(b.questionId),
        bookmarkedAt: new Date(b.createdAt).getTime()
      }));
      saveBookmarks(normalized);
      set({ bookmarks: normalized, loading: false });
    } catch {
      set({ loading: false });
      throw new Error('Failed to fetch bookmarks');
    }
  },

  toggleBookmark: async (question) => {
    const id = String(question.questionId);
    const { data } = await api.post('/bookmarks/toggle', {
      questionId: id,
      questionText: question.questionText,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
      difficulty: question.difficulty
    });
    const { bookmarks } = get();
    const updated = data.data.bookmarked
      ? [...bookmarks, { ...question, questionId: id, bookmarkedAt: Date.now() }]
      : bookmarks.filter((b) => String(b.questionId) !== id);
    saveBookmarks(updated);
    set({ bookmarks: updated });
    return data.data.bookmarked;
  },

  isBookmarked: (questionId) => get().bookmarks.some((b) => String(b.questionId) === String(questionId)),

  removeBookmark: async (questionId) => {
    await api.delete(`/bookmarks/${questionId}`);
    const updated = get().bookmarks.filter((b) => String(b.questionId) !== String(questionId));
    saveBookmarks(updated);
    set({ bookmarks: updated });
  },

  clearAll: async () => {
    await api.delete('/bookmarks');
    saveBookmarks([]);
    set({ bookmarks: [] });
  },

  clearLocal: () => {
    saveBookmarks([]);
    set({ bookmarks: [] });
  }
}));
