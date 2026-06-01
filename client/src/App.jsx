import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Home from './pages/Home';
import Chapters from './pages/Chapters';
import ChapterDetail from './pages/ChapterDetail';
import ExamPage from './pages/ExamPage';
import ResultPage from './pages/ResultPage';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import TestHistory from './pages/TestHistory';
import Bookmarks from './pages/Bookmarks';
import OfflineBanner from './components/OfflineBanner';
import Login from './pages/Login';
import Register from './pages/Register';
import RequireAuth from './components/RequireAuth';
import RequireAdmin from './components/RequireAdmin';
import { useAuthStore } from './store/authStore';

export default function App() {
  const bootstrap = useAuthStore((s) => s.bootstrap);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);

  useEffect(() => {
    if (!bootstrapped) bootstrap();
  }, [bootstrapped, bootstrap]);

  return (
    <>
      <OfflineBanner />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '14px',
            padding: '14px 20px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
          }
        }}
      />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="chapters" element={<Chapters />} />
          <Route path="chapters/:chapterId" element={<ChapterDetail />} />
          <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="history" element={<RequireAuth><TestHistory /></RequireAuth>} />
          <Route path="bookmarks" element={<RequireAuth><Bookmarks /></RequireAuth>} />
          <Route path="admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        </Route>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/exam/:testId" element={<RequireAuth><ExamPage /></RequireAuth>} />
        <Route path="/result/:attemptId" element={<RequireAuth><ResultPage /></RequireAuth>} />
      </Routes>
    </>
  );
}
