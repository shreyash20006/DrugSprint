import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, GraduationCap, ChevronDown } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();

  const moreLinks = [
    { name: '🏆 Achievements', path: '/achievements' },
    { name: '🗳️ Vote Now', path: '/vote' },
    { name: '🤝 Mentors', path: '/mentors' },
    { name: '📰 Newsletter', path: '/newsletter' },
    { name: '🆘 Report Issue', path: '/complaint' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Council', path: '/council' },
    { name: 'Ask', path: '/ask' },
    { name: 'Notices', path: '/notices' },
    { name: 'Events', path: '/events' },
    { name: 'Gallery', path: '/media' },
  ];

  return (
    <>
      <header
        id="navbar"
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white shadow-lg py-3 text-navy-dark'
            : 'bg-navy-dark/90 backdrop-blur-md py-4 text-white'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & College Name */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative overflow-hidden w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-orange-burnt/10 shadow-sm">
              {/* Load the official TGPCOP logo, fallback to GraduationCap */}
              <img
                src="https://res.cloudinary.com/dsqxboxoc/image/upload/v1779522116/WhatsApp_Image_2026-05-23_at_1.10.29_PM_susb5a.jpg"
                alt="TGPCOP Logo"
                className="w-full h-full object-cover error-fallback-hide absolute inset-0 transition-transform duration-300 group-hover:scale-108"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <GraduationCap className="w-5 h-5 text-orange-burnt absolute" />
            </div>
            <div>
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight block leading-none">
                TGPCOP
              </span>
              <span className="text-[10px] sm:text-xs opacity-80 block tracking-wider uppercase font-semibold">
                Student Council
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `relative font-display font-medium text-sm transition-colors duration-200 hover:text-orange-burnt px-1 py-2 ${
                      isActive
                        ? isScrolled
                          ? 'text-orange-burnt'
                          : 'text-orange-burnt'
                        : isScrolled
                        ? 'text-navy-dark/80'
                        : 'text-white/80'
                    }`
                  }
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="activeNavUnderline"
                      className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-burnt"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </NavLink>
              );
            })}

            <div
              className="relative"
              onMouseEnter={() => setMoreOpen(true)}
              onMouseLeave={() => setMoreOpen(false)}
            >
              <button
                type="button"
                className={`flex items-center gap-1 font-display font-medium text-sm px-1 py-2 transition-colors hover:text-orange-burnt ${
                  isScrolled ? 'text-navy-dark/80' : 'text-white/80'
                }`}
              >
                More <ChevronDown className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-navy-dark/10 py-2 z-50"
                  >
                    {moreLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        className="block px-4 py-2.5 text-sm text-navy-dark hover:bg-orange-burnt/10 hover:text-orange-burnt font-medium"
                      >
                        {link.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Portal Action button */}
            <Link
              to="/admin"
              className={`ml-2 px-4 py-1.5 rounded-full border text-[11px] font-display font-bold uppercase tracking-widest transition-all duration-300 hover:scale-105 active:scale-95 flex items-center space-x-1 shrink-0 ${
                isScrolled
                  ? 'border-orange-burnt text-orange-burnt hover:bg-orange-burnt hover:text-white shadow-xs shadow-orange-burnt/10'
                  : 'border-white/35 text-white hover:bg-white hover:text-navy-dark shadow-xs'
              }`}
            >
              <span>🔑</span>
              <span>Portal</span>
            </Link>
          </nav>

          {/* Hamburger Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-orange-burnt/10 transition-colors"
            aria-label="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
            />

            {/* Slide-in Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed right-0 top-0 bottom-0 w-[280px] bg-navy-dark text-white p-6 z-50 shadow-2xl flex flex-col justify-between md:hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-8">
                  <span className="font-display font-bold text-lg text-orange-burnt">
                    TGPCOP Council
                  </span>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-md hover:bg-white/10 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="flex flex-col space-y-4">
                  {navLinks.map((link) => {
                    const isActive = location.pathname === link.path;
                    return (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`font-display font-medium text-lg py-2 border-b border-white/10 flex items-center justify-between ${
                          isActive ? 'text-orange-burnt font-bold' : 'text-white/80'
                        }`}
                      >
                        {link.name}
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-orange-burnt" />
                        )}
                      </Link>
                    );
                  })}
                  <p className="text-[10px] font-bold uppercase text-white/40 pt-4">More</p>
                  {moreLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="font-display font-medium text-base py-2 text-white/80 hover:text-orange-burnt"
                    >
                      {link.name}
                    </Link>
                  ))}
                </nav>
              </div>

              <div>
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full text-center py-3 bg-orange-burnt hover:bg-orange-burnt/95 text-white font-display text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-orange-burnt/15 transition-all block mb-4 active:scale-98"
                >
                  🔑 Admin Portal
                </Link>
                <div className="text-center text-xs text-white/50 border-t border-white/10 pt-4">
                  TGPCOP Student Council © 2026
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
