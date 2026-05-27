import { create } from 'zustand';

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

  toggleBookmark: (question) => {
    const { bookmarks } = get();
    const id = question.questionId;
    const exists = bookmarks.some((b) => b.questionId === id);
    const updated = exists
      ? bookmarks.filter((b) => b.questionId !== id)
      : [...bookmarks, { ...question, bookmarkedAt: Date.now() }];
    saveBookmarks(updated);
    set({ bookmarks: updated });
    return !exists;
  },

  isBookmarked: (questionId) => get().bookmarks.some((b) => b.questionId === questionId),

  removeBookmark: (questionId) => {
    const updated = get().bookmarks.filter((b) => b.questionId !== questionId);
    saveBookmarks(updated);
    set({ bookmarks: updated });
  },

  clearAll: () => {
    saveBookmarks([]);
    set({ bookmarks: [] });
  }
}));
