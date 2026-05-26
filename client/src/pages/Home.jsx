import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowRight, Timer, Brain, BarChart3, Smartphone, 
  Shield, RefreshCw, Sparkles, Zap, Target
} from 'lucide-react';
import api from '../lib/api';

const features = [
  { icon: Timer, title: 'Real-Time Timer', desc: 'Countdown with auto-submit when time expires', color: 'bg-rose-50 text-rose-600' },
  { icon: Brain, title: 'Smart Analytics', desc: 'Topic-wise weak area identification', color: 'bg-violet-50 text-violet-600' },
  { icon: Shield, title: 'Exam Simulation', desc: 'Fullscreen mode & tab switch detection', color: 'bg-amber-50 text-amber-600' },
  { icon: RefreshCw, title: 'Auto-Save & Resume', desc: 'Never lose progress, continue anytime', color: 'bg-emerald-50 text-emerald-600' },
  { icon: BarChart3, title: 'Performance Tracking', desc: 'Detailed score breakdowns & trends', color: 'bg-blue-50 text-blue-600' },
  { icon: Smartphone, title: 'Mobile Friendly', desc: 'Practice on any device, anywhere', color: 'bg-cyan-50 text-cyan-600' },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const item = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } }
};

export default function Home() {
  const [stats, setStats] = useState([
    { value: '—', label: 'Chapters' },
    { value: '—', label: 'Topics' },
    { value: '—', label: 'Questions' },
    { value: 'Free', label: 'No Signup' },
  ]);

  useEffect(() => {
    api.get('/stats').then(({ data }) => {
      const d = data.data;
      setStats([
        { value: String(d.chapters), label: 'Chapters' },
        { value: String(d.topics), label: 'Topics' },
        { value: String(d.questions), label: 'Questions' },
        { value: 'Free', label: 'No Signup' },
      ]);
    }).catch(() => {});
  }, []);

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32">
        <motion.div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-indigo-100/60 via-violet-50/40 to-transparent rounded-full blur-3xl -z-10"
          animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div 
          className="absolute top-20 right-10 w-72 h-72 bg-gradient-to-br from-blue-100/40 to-purple-100/30 rounded-full blur-3xl -z-10"
          animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-[13px] font-semibold text-indigo-600 mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Free Mock Tests
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight max-w-4xl mx-auto"
          >
            Practice Smarter,{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 bg-clip-text text-transparent">
              Score Higher
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
          >
            The ultimate mock test platform for any exam. Practice chapter-wise, 
            track your progress, and master every topic with confidence.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/chapters" className="btn-primary !px-8 !py-4 !text-[15px] !rounded-2xl !shadow-xl !shadow-indigo-600/20 hover:!shadow-indigo-600/30">
                Start Practicing Now <ArrowRight className="w-4.5 h-4.5" />
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <Link to="/dashboard" className="btn-outline !px-6 !py-4 !text-[15px] !rounded-2xl">
                <BarChart3 className="w-4.5 h-4.5" /> View My Progress
              </Link>
            </motion.div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            variants={container}
            initial="hidden"
            animate="visible"
            className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto"
          >
            {stats.map((stat) => (
              <motion.div 
                key={stat.label} 
                variants={item}
                whileHover={{ scale: 1.05, y: -3 }}
                className="px-4 py-3 rounded-2xl bg-white border border-gray-100 shadow-sm cursor-default"
              >
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-28 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full text-xs font-semibold text-gray-600 mb-4">
              <Zap className="w-3.5 h-3.5" /> FEATURES
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Built for Serious Preparation
            </h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">
              Every feature designed to give you the most realistic exam experience possible.
            </p>
          </motion.div>

          <motion.div 
            variants={container}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((feat, i) => (
              <motion.div
                key={i}
                variants={item}
                whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(0,0,0,0.06)' }}
                className="group p-6 rounded-2xl border border-gray-100 hover:border-gray-200 bg-white transition-colors"
              >
                <motion.div 
                  className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feat.color}`}
                  whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
                  transition={{ duration: 0.4 }}
                >
                  <feat.icon className="w-5 h-5" />
                </motion.div>
                <h3 className="font-semibold text-gray-900 text-[15px] mb-1.5">{feat.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-10 sm:p-16 text-center"
          >
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.15),_transparent_50%)]" />
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/10 to-transparent" />
            
            <div className="relative">
              <motion.div 
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/10"
              >
                <Target className="w-7 h-7 text-white" />
              </motion.div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                Ready to Ace Your Exam?
              </h2>
              <p className="text-indigo-100 text-sm sm:text-base max-w-md mx-auto mb-8">
                Jump straight into practice. No signup, no barriers — just pick your subject and start mastering it.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  to="/chapters"
                  className="inline-flex items-center gap-2 bg-white text-indigo-700 px-7 py-3.5 rounded-xl font-semibold text-sm hover:bg-indigo-50 transition-colors shadow-xl"
                >
                  Browse All Tests <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">Made with <span className="text-red-400">&hearts;</span> by <span className="font-medium text-gray-500">Chintan</span></p>
        </div>
      </footer>
    </div>
  );
}
