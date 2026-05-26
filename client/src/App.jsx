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

export default function App() {
  return (
    <>
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
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="history" element={<TestHistory />} />
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="/exam/:testId" element={<ExamPage />} />
        <Route path="/result/:attemptId" element={<ResultPage />} />
      </Routes>
    </>
  );
}
