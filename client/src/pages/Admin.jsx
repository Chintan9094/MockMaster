import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, BookOpen, FileText, HelpCircle, Loader2,
  ChevronDown, ChevronRight, Save, X, Layers, ArrowLeft, AlertTriangle,
  Upload, FileJson, CheckCircle2, Pencil, Shield, BarChart3, Users
} from 'lucide-react';
import AdminUsersTab from '../components/AdminUsersTab';

function questionToEditForm(q) {
  const opt = (id) => q.options?.find((o) => o.id === id)?.text || '';
  return {
    questionText: q.questionText,
    optionA: opt('A'),
    optionB: opt('B'),
    optionC: opt('C'),
    optionD: opt('D'),
    correctAnswer: q.correctAnswer,
    explanation: q.explanation || '',
    difficulty: q.difficulty || 'medium'
  };
}

function editFormToPayload(form) {
  return {
    questionText: form.questionText,
    options: [
      { id: 'A', text: form.optionA },
      { id: 'B', text: form.optionB },
      { id: 'C', text: form.optionC },
      { id: 'D', text: form.optionD }
    ],
    correctAnswer: form.correctAnswer,
    explanation: form.explanation,
    difficulty: form.difficulty
  };
}

function ConfirmModal({ open, onClose, onConfirm, title, message, loading }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
                className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4"
              >
                <AlertTriangle className="w-7 h-7 text-red-500" />
              </motion.div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500 mb-6 whitespace-pre-line">{message}</p>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white font-semibold text-sm rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {loading ? 'Deleting...' : 'Delete'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Admin() {
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chapters');
  const [expandedChapter, setExpandedChapter] = useState(null);

  // Delete confirmation state
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: '', ids: [], title: '', message: '' });
  const [deleting, setDeleting] = useState(false);

  // Forms
  const [chapterForm, setChapterForm] = useState({ title: '' });
  const [topicForm, setTopicForm] = useState({ title: '', chapterId: '', duration: '10' });
  const [chapterEditModal, setChapterEditModal] = useState({ open: false, chapter: null });
  const [chapterEditTitle, setChapterEditTitle] = useState('');
  const [topicEditModal, setTopicEditModal] = useState({ open: false, topic: null });
  const [topicEditForm, setTopicEditForm] = useState({ title: '', duration: '10' });
  const [savingChapterEdit, setSavingChapterEdit] = useState(false);
  const [savingTopicEdit, setSavingTopicEdit] = useState(false);
  const [questionForm, setQuestionForm] = useState({
    topicId: '',
    chapterId: '',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    difficulty: 'medium'
  });

  const [topicQuestions, setTopicQuestions] = useState([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => { fetchChapters(); }, []);

  useEffect(() => {
    api.get('/admin/users')
      .then(({ data }) => setUserCount(data.data?.length || 0))
      .catch(() => {});
  }, []);

  const fetchTopicQuestions = (topicId) => {
    if (!topicId) {
      setTopicQuestions([]);
      setSelectedQuestionIds([]);
      setEditingId(null);
      setEditForm(null);
      return;
    }
    setQuestionsLoading(true);
    api.get('/admin/questions', { params: { topicId } })
      .then(({ data }) => setTopicQuestions(data.data || []))
      .catch(() => toast.error('Failed to load questions'))
      .finally(() => setQuestionsLoading(false));
  };

  useEffect(() => {
    setEditingId(null);
    setEditForm(null);
    setSelectedQuestionIds([]);
    fetchTopicQuestions(questionForm.topicId);
  }, [questionForm.topicId]);

  const fetchChapters = () => {
    setLoading(true);
    api.get('/tests/chapters')
      .then(({ data }) => setChapters(data.data))
      .catch(() => toast.error('Failed to load chapters'))
      .finally(() => setLoading(false));
  };

  const nextChapterNumber = chapters.length
    ? Math.max(...chapters.map((c) => c.number || 0)) + 1
    : 1;

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!chapterForm.title.trim()) return toast.error('Chapter title is required');
    try {
      await api.post('/admin/chapters', { title: chapterForm.title.trim() });
      toast.success(`Chapter ${nextChapterNumber} added!`);
      setChapterForm({ title: '' });
      fetchChapters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add chapter');
    }
  };

  const openChapterEdit = (chapter) => {
    setChapterEditModal({ open: true, chapter });
    setChapterEditTitle(chapter.title || '');
  };

  const closeChapterEdit = () => {
    setChapterEditModal({ open: false, chapter: null });
    setChapterEditTitle('');
  };

  const handleUpdateChapter = async (e) => {
    e.preventDefault();
    if (!chapterEditTitle.trim()) return toast.error('Chapter title is required');
    setSavingChapterEdit(true);
    try {
      await api.put(`/admin/chapters/${chapterEditModal.chapter._id}`, {
        title: chapterEditTitle.trim()
      });
      toast.success('Chapter updated');
      closeChapterEdit();
      fetchChapters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update chapter');
    } finally {
      setSavingChapterEdit(false);
    }
  };

  const openTopicEdit = (topic) => {
    setTopicEditModal({ open: true, topic });
    setTopicEditForm({
      title: topic.title || '',
      duration: String(topic.duration || 10)
    });
  };

  const closeTopicEdit = () => {
    setTopicEditModal({ open: false, topic: null });
    setTopicEditForm({ title: '', duration: '10' });
  };

  const handleUpdateTopic = async (e) => {
    e.preventDefault();
    if (!topicEditForm.title.trim()) return toast.error('Topic title is required');
    setSavingTopicEdit(true);
    try {
      await api.put(`/admin/topics/${topicEditModal.topic._id}`, {
        title: topicEditForm.title.trim(),
        duration: parseInt(topicEditForm.duration, 10) || 10
      });
      toast.success('Topic updated');
      closeTopicEdit();
      fetchChapters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update topic');
    } finally {
      setSavingTopicEdit(false);
    }
  };

  const handleAddTopic = async (e) => {
    e.preventDefault();
    if (!topicForm.title || !topicForm.chapterId) return toast.error('Fill all fields');
    try {
      await api.post('/admin/topics', { title: topicForm.title, chapterId: topicForm.chapterId, duration: parseInt(topicForm.duration) || 10 });
      toast.success('Topic added!');
      setTopicForm({ title: '', chapterId: topicForm.chapterId, duration: '10' });
      fetchChapters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add topic');
    }
  };

  const [savedCount, setSavedCount] = useState(0);
  const [jsonUploading, setJsonUploading] = useState(false);
  const [jsonResult, setJsonResult] = useState(null);

  const handleJsonUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    if (!questionForm.chapterId || !questionForm.topicId) {
      return toast.error('Select chapter & topic first');
    }

    if (!file.name.endsWith('.json')) {
      return toast.error('Please upload a .json file');
    }

    setJsonUploading(true);
    setJsonResult(null);

    try {
      const text = await file.text();
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        setJsonUploading(false);
        return toast.error('Invalid JSON file');
      }

      const questions = Array.isArray(parsed) ? parsed : parsed.questions;
      if (!Array.isArray(questions) || questions.length === 0) {
        setJsonUploading(false);
        return toast.error('JSON must contain an array of questions');
      }

      const formatted = questions.map(q => {
        const opts = q.options
          ? q.options
          : [
              { id: 'A', text: q.optionA || q.option_a || '' },
              { id: 'B', text: q.optionB || q.option_b || '' },
              { id: 'C', text: q.optionC || q.option_c || '' },
              { id: 'D', text: q.optionD || q.option_d || '' }
            ];
        return {
          questionText: q.questionText || q.question_text || q.question || '',
          options: opts,
          correctAnswer: q.correctAnswer || q.correct_answer || q.answer || 'A',
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium'
        };
      });

      const invalid = formatted.filter(q => !q.questionText || q.options.some(o => !o.text));
      if (invalid.length > 0) {
        setJsonUploading(false);
        return toast.error(`${invalid.length} question(s) have missing text or options`);
      }

      await api.post('/admin/questions', {
        topicId: questionForm.topicId,
        chapterId: questionForm.chapterId,
        questions: formatted
      });

      const topicObj = chapters
        .flatMap(c => c.topics || [])
        .find(t => t._id === questionForm.topicId);
      await api.post('/admin/tests', {
        title: topicObj?.title || 'Untitled',
        topicId: questionForm.topicId,
        chapterId: questionForm.chapterId,
        duration: topicObj?.duration || 10
      });

      setJsonResult({ success: true, count: formatted.length });
      setSavedCount(prev => prev + formatted.length);
      fetchChapters();
      fetchTopicQuestions(questionForm.topicId);
      toast.success(`${formatted.length} questions uploaded!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload questions');
      setJsonResult({ success: false });
    } finally {
      setJsonUploading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const { questionText, optionA, optionB, optionC, optionD, correctAnswer, explanation, difficulty, topicId, chapterId } = questionForm;
    if (!topicId || !chapterId) return toast.error('Select chapter & topic first');
    if (!questionText || !optionA || !optionB || !optionC || !optionD) {
      return toast.error('Fill question and all 4 options');
    }

    try {
      await api.post('/admin/questions', {
        topicId,
        chapterId,
        questions: [{
          questionText,
          options: [
            { id: 'A', text: optionA },
            { id: 'B', text: optionB },
            { id: 'C', text: optionC },
            { id: 'D', text: optionD }
          ],
          correctAnswer,
          explanation,
          difficulty
        }]
      });

      const topicObj = chapters
        .flatMap(c => c.topics || [])
        .find(t => t._id === topicId);
      await api.post('/admin/tests', {
        title: topicObj?.title || 'Untitled',
        topicId,
        chapterId,
        duration: topicObj?.duration || 10
      });

      setSavedCount(prev => prev + 1);
      fetchChapters();
      fetchTopicQuestions(topicId);
      toast.success('Question saved & test updated!');

      setQuestionForm({
        ...questionForm,
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
        explanation: '',
        difficulty: 'medium'
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save question');
    }
  };

  const openDeleteChapter = (ch) => {
    setDeleteModal({
      open: true,
      type: 'chapter',
      id: ch._id,
      title: 'Delete Chapter?',
      message: `This will permanently delete "${ch.title}" and ALL its topics, questions & tests. This cannot be undone.`
    });
  };

  const openDeleteTopic = (topic) => {
    setDeleteModal({
      open: true,
      type: 'topic',
      id: topic._id,
      title: 'Delete Topic?',
      message: `This will permanently delete "${topic.title}" and ALL its questions & tests. This cannot be undone.`
    });
  };

  const openDeleteQuestion = (q) => {
    const preview = q.questionText.length > 100 ? `${q.questionText.slice(0, 100)}…` : q.questionText;
    setDeleteModal({
      open: true,
      type: 'question',
      id: q._id,
      ids: [],
      title: 'Delete Question?',
      message: `Permanently delete this question?\n\n"${preview}"`
    });
  };

  const toggleQuestionSelect = (questionId) => {
    setSelectedQuestionIds((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  const allQuestionsSelected = topicQuestions.length > 0
    && selectedQuestionIds.length === topicQuestions.length;

  const toggleSelectAllQuestions = () => {
    if (allQuestionsSelected) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(topicQuestions.map((q) => q._id));
    }
  };

  const openBulkDeleteQuestions = () => {
    const count = selectedQuestionIds.length;
    if (!count) return;
    setDeleteModal({
      open: true,
      type: 'questions-bulk',
      id: '',
      ids: [...selectedQuestionIds],
      title: `Delete ${count} Question${count > 1 ? 's' : ''}?`,
      message: `Permanently delete ${count} selected question(s)? This cannot be undone.`
    });
  };

  const startEditQuestion = (q) => {
    setEditingId(q._id);
    setEditForm(questionToEditForm(q));
  };

  const cancelEditQuestion = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editForm || !editingId) return;
    const { questionText, optionA, optionB, optionC, optionD } = editForm;
    if (!questionText || !optionA || !optionB || !optionC || !optionD) {
      return toast.error('Fill question and all 4 options');
    }
    setSavingEdit(true);
    try {
      await api.put(`/admin/questions/${editingId}`, editFormToPayload(editForm));
      toast.success('Question updated');
      cancelEditQuestion();
      fetchTopicQuestions(questionForm.topicId);
      fetchChapters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update question');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteModal.type === 'chapter') {
        await api.delete(`/admin/chapters/${deleteModal.id}`);
        toast.success('Chapter deleted');
      } else if (deleteModal.type === 'question') {
        await api.delete(`/admin/questions/${deleteModal.id}`);
        toast.success('Question deleted');
        setSelectedQuestionIds((prev) => prev.filter((id) => id !== deleteModal.id));
        fetchTopicQuestions(questionForm.topicId);
      } else if (deleteModal.type === 'questions-bulk') {
        const { data } = await api.post('/admin/questions/bulk-delete', { ids: deleteModal.ids });
        toast.success(data.message || 'Questions deleted');
        setSelectedQuestionIds([]);
        fetchTopicQuestions(questionForm.topicId);
      } else {
        await api.delete(`/admin/topics/${deleteModal.id}`);
        toast.success('Topic deleted');
      }
      fetchChapters();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, type: '', id: '', ids: [], title: '', message: '' });
    }
  };

  const tabs = [
    { id: 'chapters', label: 'Chapters', icon: Layers },
    { id: 'topics', label: 'Topics', icon: FileText },
    { id: 'questions', label: 'Questions', icon: HelpCircle },
    { id: 'users', label: 'Users', icon: Users },
  ];

  const stats = {
    chapters: chapters.length,
    topics: chapters.reduce((sum, ch) => sum + (ch.topics?.length || 0), 0),
    questions: chapters.reduce(
      (sum, ch) => sum + (ch.topics?.reduce((ts, t) => ts + (t.questionCount || 0), 0) || 0),
      0
    ),
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Site
      </Link>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-indigo-800 text-white p-6 sm:p-8 mb-8">
        <div className="absolute -top-16 -right-10 w-48 h-48 bg-white/10 rounded-full" />
        <div className="absolute -bottom-20 -left-10 w-56 h-56 bg-indigo-500/20 rounded-full" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
                <p className="text-sm text-white/75 mt-0.5">Manage syllabus, questions, and users for MockMaster</p>
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 text-xs font-medium bg-white/10 backdrop-blur px-3 py-2 rounded-xl w-fit">
            <BarChart3 className="w-3.5 h-3.5" />
            Content management dashboard
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Chapters', value: stats.chapters, icon: Layers, color: 'bg-indigo-50 text-indigo-600' },
          { label: 'Topics', value: stats.topics, icon: FileText, color: 'bg-violet-50 text-violet-600' },
          { label: 'Questions', value: stats.questions, icon: HelpCircle, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Users', value: userCount, icon: Users, color: 'bg-sky-50 text-sky-600' },
        ].map((item) => (
          <div key={item.label} className="card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                <item.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                <p className="text-[11px] text-gray-400 font-medium">{item.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-8 p-1.5 bg-gray-100/80 rounded-2xl">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/60'
            }`}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden text-xs">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Chapters Tab */}
      {activeTab === 'chapters' && (
        <div className="space-y-6">
          <form onSubmit={handleAddChapter} className="card p-6 sm:p-7 border-indigo-100/60 bg-gradient-to-br from-white to-indigo-50/20">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" /> Add New Chapter (Syllabus)
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Next chapter will be numbered <span className="font-semibold text-indigo-600">#{nextChapterNumber}</span> automatically.
            </p>
            <div className="grid sm:grid-cols-[1fr_auto] gap-3">
              <input
                type="text"
                placeholder="Chapter title (e.g., Signal Processing)"
                value={chapterForm.title}
                onChange={(e) => setChapterForm({ title: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <button type="submit" className="btn-primary !py-2.5 !px-5 !text-[13px] !rounded-xl">
                <Plus className="w-4 h-4" /> Add Chapter #{nextChapterNumber}
              </button>
            </div>
          </form>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="space-y-2">
              {chapters.map((ch) => (
                <div key={ch._id} className="card p-4 sm:p-5 hover:border-indigo-200 hover:shadow-[0_8px_24px_rgba(0,0,0,0.04)] transition-all">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-3 cursor-pointer flex-1"
                      onClick={() => setExpandedChapter(expandedChapter === ch._id ? null : ch._id)}
                    >
                      {expandedChapter === ch._id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                      <span className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-xs font-bold text-indigo-700">
                        {ch.number}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{ch.title}</p>
                        <p className="text-[11px] text-gray-400">{ch.topics?.length || 0} topics</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openChapterEdit(ch)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Edit chapter"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteChapter(ch)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete chapter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {expandedChapter === ch._id && ch.topics?.length > 0 && (
                    <div className="mt-3 ml-12 space-y-1.5">
                      {ch.topics.map(t => (
                        <div key={t._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm text-gray-700 truncate">{t.title}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              (t.questionCount ?? 0) === 0 ? 'bg-amber-50 text-amber-700' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {t.questionCount ?? 0}
                            </span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => openTopicEdit(t)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                              title="Edit topic"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openDeleteTopic(t)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete topic"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {!chapters.length && (
                <p className="text-center text-sm text-gray-400 py-8">No chapters yet. Add one above.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Topics Tab */}
      {activeTab === 'topics' && (
        <div className="space-y-6">
          <form onSubmit={handleAddTopic} className="card p-6 sm:p-7 border-violet-100/60 bg-gradient-to-br from-white to-violet-50/20">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" /> Add New Topic
            </h3>
            <div className="grid sm:grid-cols-[1fr_1fr_120px_auto] gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Chapter *</label>
                <select
                  value={topicForm.chapterId}
                  onChange={(e) => setTopicForm({ ...topicForm, chapterId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                >
                  <option value="">Select Chapter</option>
                  {chapters.map(ch => (
                    <option key={ch._id} value={ch._id}>{ch.number}. {ch.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Topic Title *</label>
                <input
                  type="text"
                  placeholder="e.g., DFT & FFT"
                  value={topicForm.title}
                  onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Timer (min)</label>
                <input
                  type="number"
                  placeholder="10"
                  min="1"
                  value={topicForm.duration}
                  onChange={(e) => setTopicForm({ ...topicForm, duration: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center"
                />
              </div>
              <button type="submit" className="btn-primary !py-2.5 !px-5 !text-[13px] !rounded-xl">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </form>

          <div className="card p-6 sm:p-7">
            <h3 className="font-semibold text-gray-900 mb-1">Existing Topics</h3>
            <p className="text-sm text-gray-500 mb-5">Browse and manage topics grouped by chapter.</p>
            {chapters.map(ch => (
              ch.topics?.length > 0 && (
                <div key={ch._id} className="mb-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-gray-400 uppercase">{ch.number}. {ch.title}</p>
                    <button
                      type="button"
                      onClick={() => openChapterEdit(ch)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Edit chapter
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {ch.topics.map(t => (
                      <div key={t._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                          <span className="text-sm text-gray-700 truncate">{t.title}</span>
                          <span className="shrink-0 text-[11px] text-gray-400">{t.duration || 10} min</span>
                          <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            (t.questionCount ?? 0) === 0
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {t.questionCount ?? 0} {(t.questionCount ?? 0) === 1 ? 'question' : 'questions'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => openTopicEdit(t)}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Edit topic"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteTopic(t)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                            title="Delete topic"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
            {!chapters.some(c => c.topics?.length > 0) && (
              <p className="text-center text-sm text-gray-400 py-6">No topics yet. Add a chapter first, then add topics.</p>
            )}
          </div>
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Select Chapter & Topic */}
          <div className="card p-6 sm:p-7 border-indigo-100/60 bg-gradient-to-br from-white to-indigo-50/20">
            <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-indigo-600" /> Add Questions
            </h3>
            <p className="text-sm text-gray-500 mb-4">Select a chapter and topic, then add questions. Each question is saved instantly.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <select
                value={questionForm.chapterId}
                onChange={(e) => {
                  setQuestionForm({ ...questionForm, chapterId: e.target.value, topicId: '' });
                  setSavedCount(0);
                }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Select Chapter</option>
                {chapters.map(ch => (
                  <option key={ch._id} value={ch._id}>{ch.number}. {ch.title}</option>
                ))}
              </select>
              <select
                value={questionForm.topicId}
                onChange={(e) => { setQuestionForm({ ...questionForm, topicId: e.target.value }); setSavedCount(0); }}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Select Topic</option>
                {(chapters.find(c => c._id === questionForm.chapterId)?.topics || []).map(t => (
                  <option key={t._id} value={t._id}>{t.title}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Existing questions */}
          {questionForm.topicId && (
            <div className="card p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Questions in this topic
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {questionsLoading ? '…' : topicQuestions.length}
                  </span>
                  {selectedQuestionIds.length > 0 && (
                    <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {selectedQuestionIds.length} selected
                    </span>
                  )}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  {topicQuestions.length > 0 && (
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 cursor-pointer hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={allQuestionsSelected}
                        onChange={toggleSelectAllQuestions}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      Select all
                    </label>
                  )}
                  {selectedQuestionIds.length > 0 && (
                    <button
                      type="button"
                      onClick={openBulkDeleteQuestions}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete selected ({selectedQuestionIds.length})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => fetchTopicQuestions(questionForm.topicId)}
                    disabled={questionsLoading}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50 px-2 py-1.5"
                  >
                    Refresh
                  </button>
                </div>
              </div>

              {questionsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                </div>
              ) : topicQuestions.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No questions yet. Add below or upload JSON.</p>
              ) : (
                <div className="max-h-[420px] overflow-y-auto space-y-3 pr-1">
                  {topicQuestions.map((q, idx) => {
                    const isSelected = selectedQuestionIds.includes(q._id);
                    return (
                    <div
                      key={q._id}
                      className={`border rounded-xl overflow-hidden transition-colors ${
                        isSelected ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200'
                      }`}
                    >
                      {editingId === q._id && editForm ? (
                        <form onSubmit={handleSaveEdit} className="p-4 bg-indigo-50/40 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-indigo-600">Edit Q{idx + 1}</span>
                            <button type="button" onClick={cancelEditQuestion} className="p-1 text-gray-400 hover:text-gray-600">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          <textarea
                            value={editForm.questionText}
                            onChange={(e) => setEditForm({ ...editForm, questionText: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            rows={2}
                            required
                          />
                          <div className="grid sm:grid-cols-2 gap-2">
                            {['A', 'B', 'C', 'D'].map((letter) => (
                              <input
                                key={letter}
                                type="text"
                                value={editForm[`option${letter}`]}
                                onChange={(e) => setEditForm({ ...editForm, [`option${letter}`]: e.target.value })}
                                placeholder={`Option ${letter}`}
                                className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                                required
                              />
                            ))}
                          </div>
                          <div className="grid sm:grid-cols-3 gap-2">
                            <select
                              value={editForm.correctAnswer}
                              onChange={(e) => setEditForm({ ...editForm, correctAnswer: e.target.value })}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                            >
                              {['A', 'B', 'C', 'D'].map((l) => <option key={l} value={l}>{l} correct</option>)}
                            </select>
                            <select
                              value={editForm.difficulty}
                              onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                            <button
                              type="submit"
                              disabled={savingEdit}
                              className="btn-primary !py-2 !text-xs !rounded-lg flex items-center justify-center gap-1"
                            >
                              {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              Save
                            </button>
                          </div>
                          <textarea
                            value={editForm.explanation}
                            onChange={(e) => setEditForm({ ...editForm, explanation: e.target.value })}
                            placeholder="Explanation (optional)"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            rows={2}
                          />
                        </form>
                      ) : (
                        <div className="p-4 bg-gray-50/50">
                          <div className="flex items-start justify-between gap-3">
                            <label className="flex items-start gap-3 min-w-0 flex-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleQuestionSelect(q._id)}
                                className="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                              />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold text-gray-400">Q{idx + 1}</span>
                                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase ${
                                  q.difficulty === 'easy' ? 'bg-emerald-50 text-emerald-600' :
                                  q.difficulty === 'hard' ? 'bg-red-50 text-red-600' :
                                  'bg-amber-50 text-amber-600'
                                }`}>
                                  {q.difficulty}
                                </span>
                                <span className="text-[10px] text-gray-500">Answer: {q.correctAnswer}</span>
                              </div>
                              <p className="text-sm text-gray-800 leading-snug">{q.questionText}</p>
                              <ul className="mt-2 space-y-0.5">
                                {q.options?.map((o) => (
                                  <li key={o.id} className={`text-xs ${o.id === q.correctAnswer ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                                    {o.id}. {o.text}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            </label>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditQuestion(q)}
                                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDeleteQuestion(q)}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
          )}

          {/* JSON Upload - shows when topic selected */}
          {questionForm.topicId && (
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileJson className="w-4 h-4 text-indigo-600" /> Upload from JSON File
              </h3>
              <p className="text-sm text-gray-500 mb-4">Bulk upload questions from a JSON file. Accepts an array of question objects.</p>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <label className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium cursor-pointer transition-colors ${
                  jsonUploading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                }`}>
                  {jsonUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {jsonUploading ? 'Uploading...' : 'Choose JSON File'}
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleJsonUpload}
                    disabled={jsonUploading}
                    className="hidden"
                  />
                </label>

                {jsonResult?.success && (
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" /> {jsonResult.count} questions uploaded
                  </span>
                )}
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-xs font-medium text-gray-500 mb-2">Expected JSON format:</p>
                <pre className="text-[11px] text-gray-600 overflow-x-auto leading-relaxed">{`[
  {
    "questionText": "What is ...?",
    "optionA": "Answer 1",
    "optionB": "Answer 2",
    "optionC": "Answer 3",
    "optionD": "Answer 4",
    "correctAnswer": "A",
    "explanation": "Because ...",
    "difficulty": "easy"
  }
]`}</pre>
              </div>
            </div>
          )}

          {/* Divider */}
          {questionForm.topicId && (
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-medium text-gray-400 uppercase">or add manually</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}

          {/* Question Form - shows when topic selected */}
          {questionForm.topicId && (
            <form onSubmit={handleAddQuestion} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">New Question</h3>
                {savedCount > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    {savedCount} saved this session
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Question Text *</label>
                  <textarea
                    value={questionForm.questionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                    rows={2}
                    placeholder="Type your question here..."
                    required
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Option A *</label>
                    <input
                      type="text"
                      value={questionForm.optionA}
                      onChange={(e) => setQuestionForm({ ...questionForm, optionA: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Option A"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Option B *</label>
                    <input
                      type="text"
                      value={questionForm.optionB}
                      onChange={(e) => setQuestionForm({ ...questionForm, optionB: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Option B"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Option C *</label>
                    <input
                      type="text"
                      value={questionForm.optionC}
                      onChange={(e) => setQuestionForm({ ...questionForm, optionC: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Option C"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Option D *</label>
                    <input
                      type="text"
                      value={questionForm.optionD}
                      onChange={(e) => setQuestionForm({ ...questionForm, optionD: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      placeholder="Option D"
                      required
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Correct Answer</label>
                    <select
                      value={questionForm.correctAnswer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1.5">Difficulty</label>
                    <select
                      value={questionForm.difficulty}
                      onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button type="submit" className="w-full btn-primary !py-2.5 !text-[13px] !rounded-xl">
                      <Save className="w-4 h-4" /> Save Question
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Explanation (optional)</label>
                  <textarea
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none"
                    rows={2}
                    placeholder="Explain why the correct answer is right..."
                  />
                </div>
              </div>
            </form>
          )}

          {!questionForm.topicId && (
            <div className="card p-10 text-center border-dashed border-2 border-gray-200 bg-gray-50/50">
              <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Select a chapter and topic above to start adding questions</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <AdminUsersTab onCountChange={setUserCount} />
      )}

      {/* Edit Chapter Modal */}
      <AnimatePresence>
        {chapterEditModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeChapterEdit}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              onSubmit={handleUpdateChapter}
              className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Edit Chapter</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Chapter {chapterEditModal.chapter?.number}
                  </p>
                </div>
                <button type="button" onClick={closeChapterEdit} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Chapter title</label>
              <input
                type="text"
                required
                value={chapterEditTitle}
                onChange={(e) => setChapterEditTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none mb-5"
              />
              <div className="flex gap-3">
                <button type="button" onClick={closeChapterEdit} disabled={savingChapterEdit} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingChapterEdit} className="flex-1 btn-primary !py-3 !rounded-xl flex items-center justify-center gap-2">
                  {savingChapterEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingChapterEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Topic Modal */}
      <AnimatePresence>
        {topicEditModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={closeTopicEdit}
          >
            <motion.form
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              onSubmit={handleUpdateTopic}
              className="bg-white rounded-2xl p-6 sm:p-7 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 mb-5">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-3">
                    <Pencil className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Edit Topic</h3>
                  <p className="text-sm text-gray-500 mt-1 truncate">{topicEditModal.topic?.title}</p>
                </div>
                <button type="button" onClick={closeTopicEdit} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-4 mb-5">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Topic title</label>
                  <input
                    type="text"
                    required
                    value={topicEditForm.title}
                    onChange={(e) => setTopicEditForm((p) => ({ ...p, title: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Timer (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    value={topicEditForm.duration}
                    onChange={(e) => setTopicEditForm((p) => ({ ...p, duration: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={closeTopicEdit} disabled={savingTopicEdit} className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={savingTopicEdit} className="flex-1 btn-primary !py-3 !rounded-xl flex items-center justify-center gap-2">
                  {savingTopicEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {savingTopicEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: '', id: '', ids: [], title: '', message: '' })}
        onConfirm={handleConfirmDelete}
        title={deleteModal.title}
        message={deleteModal.message}
        loading={deleting}
      />
    </div>
  );
}
