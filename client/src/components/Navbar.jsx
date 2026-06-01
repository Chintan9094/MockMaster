import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, LayoutDashboard, GraduationCap, Menu, X, Bookmark } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../store/authStore';

const navLinks = [
  { to: '/', label: 'Home', icon: null },
  { to: '/chapters', label: 'Mock Tests', icon: GraduationCap },
  { to: '/dashboard', label: 'My Progress', icon: LayoutDashboard },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const logout = useAuthStore((s) => s.logout);
  const isAuthed = Boolean(token);

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="sticky top-0 z-40 glass border-b border-gray-100/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2.5 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: -3 }}
              whileTap={{ scale: 0.95 }}
              className="w-9 h-9 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:shadow-indigo-600/30 transition-shadow"
            >
              <BookOpen className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </motion.div>
            <div className="flex items-baseline gap-0.5">
              <span className="font-extrabold text-indigo-600 text-[16px]">Mock</span>
              <span className="font-bold text-gray-900 text-[16px]">Master</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              if (!isAuthed && (link.to === '/dashboard' || link.to === '/bookmarks')) return null;
              const isActive = location.pathname === link.to || 
                (link.to !== '/' && location.pathname.startsWith(link.to));
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`relative px-4 py-2 rounded-lg text-[13px] font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-indigo-700'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="activeNav"
                      className="absolute inset-0 bg-indigo-50 rounded-lg"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative">{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden md:block">
            {isAuthed ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 max-w-[180px] truncate">{user?.email}</span>
                <button
                  type="button"
                  onClick={() => logout(true)}
                  className="btn-outline !py-2 !px-4 !text-[12px]"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-outline !py-2 !px-4 !text-[12px] !rounded-xl">
                  Login
                </Link>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.95 }}>
                  <Link to="/register" className="btn-primary !py-2.5 !px-5 !text-[13px] !rounded-xl !shadow-md">
                    <GraduationCap className="w-4 h-4" />
                    Register
                  </Link>
                </motion.div>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden"
            >
              <div className="pb-4 pt-2 space-y-1">
                {navLinks.map((link, i) => (
                  (!isAuthed && (link.to === '/dashboard' || link.to === '/bookmarks')) ? null : (
                  <motion.div
                    key={link.to}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={link.to}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors"
                    >
                      {link.icon && <link.icon className="w-4 h-4" />}
                      {link.label}
                    </Link>
                  </motion.div>
                  )
                ))}
                <div className="pt-2 border-t border-gray-100 mt-2">
                  {isAuthed ? (
                    <button
                      type="button"
                      onClick={() => { setMobileOpen(false); logout(true); }}
                      className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    >
                      Logout
                    </button>
                  ) : (
                    <div className="space-y-1">
                      <Link
                        to="/login"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors"
                      >
                        Login
                      </Link>
                      <Link
                        to="/register"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                      >
                        Register
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
