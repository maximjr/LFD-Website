import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Calendar, Menu, X, LogOut, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isAdmin: isUserAdmin } = useAuth();

  interface NavLink {
    name: string;
    path: string;
    icon?: React.ReactNode;
  }

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks: NavLink[] = [
    { name: 'Home', path: '/' },
    { name: 'About Us', path: '/about' },
    { name: 'Products', path: '/products' },
    { name: 'Seminars', path: '/seminars' },
    { name: 'Contact', path: '/contact' },
  ];

  if (isUserAdmin) {
    navLinks.push({ name: 'Admin', path: '/admin', icon: <ShieldCheck className="w-4 h-4" /> });
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-2' : 'bg-white py-4'
    }`}>
      <div className="container-custom">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <img 
              src="https://i.imgur.com/7ryePWK.png" 
              alt="Optimal Health Care Logo" 
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <span className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight flex items-center gap-1.5">
              <span className="text-[#00a651]">Optimal</span>
              <span className="text-[#9333ea]">Health</span>
              <span className="text-[#00a651]">Care</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-semibold transition-colors hover:text-emerald-600 flex items-center gap-1.5 ${
                    isActive(link.path) ? 'text-emerald-600' : 'text-slate-600'
                  }`}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              {currentUser ? (
                <button
                  onClick={() => handleLogout().catch(console.error)}
                  className="text-sm font-semibold text-slate-600 hover:text-rose-600 transition-colors flex items-center gap-1"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className={`text-sm font-semibold transition-colors hover:text-emerald-600 ${
                    isActive('/login') ? 'text-emerald-600' : 'text-slate-600'
                  }`}
                >
                  Login
                </Link>
              )}
            </div>
            <Link 
              to="/contact" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg flex items-center gap-2 whitespace-nowrap"
            >
              <Calendar className="w-4 h-4" /> Book Appointment
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-white border-t border-slate-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`block px-4 py-3 rounded-xl text-base font-semibold transition-colors flex items-center gap-2 ${
                    isActive(link.path) 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {link.icon && <span className="w-5 h-5">{link.icon}</span>}
                  {link.name}
                </Link>
              ))}
              {currentUser ? (
                <button
                  onClick={() => handleLogout().catch(console.error)}
                  className="w-full text-left block px-4 py-3 rounded-xl text-base font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-5 h-5" /> Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className={`block px-4 py-3 rounded-xl text-base font-semibold transition-colors ${
                    isActive('/login') 
                      ? 'bg-emerald-50 text-emerald-600' 
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Login
                </Link>
              )}
              <div className="pt-4 px-4">
                <Link 
                  to="/contact" 
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-xl font-bold text-center transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" /> Book Appointment
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
