import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Plus, Trash2, BookOpen, FileText, HelpCircle, Loader2,
  ChevronDown, ChevronRight, Save, X, Layers, ArrowLeft, AlertTriangle
} from 'lucide-react';

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
              <p className="text-sm text-gray-500 mb-6">{message}</p>

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
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: '', title: '', message: '' });
  const [deleting, setDeleting] = useState(false);

  // Forms
  const [chapterForm, setChapterForm] = useState({ number: '', title: '' });
  const [topicForm, setTopicForm] = useState({ title: '', chapterId: '', duration: '10' });
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

  useEffect(() => { fetchChapters(); }, []);

  const fetchChapters = () => {
    setLoading(true);
    api.get('/tests/chapters')
      .then(({ data }) => setChapters(data.data))
      .catch(() => toast.error('Failed to load chapters'))
      .finally(() => setLoading(false));
  };

  const handleAddChapter = async (e) => {
    e.preventDefault();
    if (!chapterForm.number || !chapterForm.title) return toast.error('Fill all fields');
    try {
      await api.post('/admin/chapters', { number: parseInt(chapterForm.number), title: chapterForm.title });
      toast.success('Chapter added!');
      setChapterForm({ number: '', title: '' });
      fetchChapters();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add chapter');
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

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      if (deleteModal.type === 'chapter') {
        await api.delete(`/admin/chapters/${deleteModal.id}`);
        toast.success('Chapter deleted');
      } else {
        await api.delete(`/admin/topics/${deleteModal.id}`);
        toast.success('Topic deleted');
      }
      fetchChapters();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteModal({ open: false, type: '', id: '', title: '', message: '' });
    }
  };

  const tabs = [
    { id: 'chapters', label: 'Chapters', icon: Layers },
    { id: 'topics', label: 'Topics', icon: FileText },
    { id: 'questions', label: 'Questions', icon: HelpCircle },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-indigo-600 mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Site
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Add and manage syllabus, topics & questions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-xl w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Chapters Tab */}
      {activeTab === 'chapters' && (
        <div className="space-y-6">
          <form onSubmit={handleAddChapter} className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" /> Add New Chapter (Syllabus)
            </h3>
            <div className="grid sm:grid-cols-[100px_1fr_auto] gap-3">
              <input
                type="number"
                placeholder="No."
                value={chapterForm.number}
                onChange={(e) => setChapterForm({ ...chapterForm, number: e.target.value })}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <input
                type="text"
                placeholder="Chapter title (e.g., Signal Processing)"
                value={chapterForm.title}
                onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <button type="submit" className="btn-primary !py-2.5 !px-5 !text-[13px] !rounded-xl">
                <Plus className="w-4 h-4" /> Add
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
                <div key={ch._id} className="card p-4">
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
                    <button
                      onClick={() => openDeleteChapter(ch)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {expandedChapter === ch._id && ch.topics?.length > 0 && (
                    <div className="mt-3 ml-12 space-y-1.5">
                      {ch.topics.map(t => (
                        <div key={t._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700">{t.title}</span>
                          <button
                            onClick={() => openDeleteTopic(t)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
          <form onSubmit={handleAddTopic} className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" /> Add New Topic
            </h3>
            <div className="grid sm:grid-cols-[1fr_1fr_100px_auto] gap-3">
              <select
                value={topicForm.chapterId}
                onChange={(e) => setTopicForm({ ...topicForm, chapterId: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none bg-white"
              >
                <option value="">Select Chapter</option>
                {chapters.map(ch => (
                  <option key={ch._id} value={ch._id}>{ch.number}. {ch.title}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Topic title (e.g., DFT & FFT)"
                value={topicForm.title}
                onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              />
              <input
                type="number"
                placeholder="Min"
                min="1"
                value={topicForm.duration}
                onChange={(e) => setTopicForm({ ...topicForm, duration: e.target.value })}
                className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-center"
                title="Test duration in minutes"
              />
              <button type="submit" className="btn-primary !py-2.5 !px-5 !text-[13px] !rounded-xl">
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Duration is in minutes (default: 10 min)</p>
          </form>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Existing Topics</h3>
            {chapters.map(ch => (
              ch.topics?.length > 0 && (
                <div key={ch._id} className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 mb-2 uppercase">{ch.number}. {ch.title}</p>
                  <div className="space-y-1.5">
                    {ch.topics.map(t => (
                      <div key={t._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-500" />
                          <span className="text-sm text-gray-700">{t.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded hidden sm:inline">{t._id}</code>
                          <button
                            onClick={() => openDeleteTopic(t)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
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
          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, type: '', id: '', title: '', message: '' })}
        onConfirm={handleConfirmDelete}
        title={deleteModal.title}
        message={deleteModal.message}
        loading={deleting}
      />
    </div>
  );
}
