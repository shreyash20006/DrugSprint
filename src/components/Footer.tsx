import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, MessageCircle, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="bg-navy-dark text-white pt-16 pb-8 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          
          {/* Left Column: Brand & Tagline */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative overflow-hidden w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 border border-white/10 shadow-sm">
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
                <span className="font-display font-bold text-xl tracking-tight block leading-none">
                  TGPCOP
                </span>
                <span className="text-[10px] opacity-75 block tracking-wider uppercase font-semibold">
                  Student Council
                </span>
              </div>
            </Link>
            <p className="text-sm text-white/70 max-w-sm mt-2">
              Tulsiramji Gaikwad Patil College of Pharmacy (TGPCOP), Nagpur.
            </p>
            <blockquote className="text-orange-burnt font-display font-medium text-sm italic">
              "Your Voice. Our Future. | Together Towards Excellence"
            </blockquote>
          </div>

          {/* Center Column: Quick Navigation Links */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-base uppercase tracking-wider text-gold-accent">
              Quick Links
            </h3>
            <ul className="grid grid-cols-2 gap-3 text-sm text-white/70">
              <li>
                <Link to="/" className="hover:text-orange-burnt transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/council" className="hover:text-orange-burnt transition-colors">Our Council</Link>
              </li>
              <li>
                <Link to="/ask" className="hover:text-orange-burnt transition-colors">Ask Council</Link>
              </li>
              <li>
                <Link to="/notices" className="hover:text-orange-burnt transition-colors">Notice Board</Link>
              </li>
              <li>
                <Link to="/events" className="hover:text-orange-burnt transition-colors">Events & Sports</Link>
              </li>
              <li>
                <Link to="/media" className="hover:text-orange-burnt transition-colors">Gallery Media</Link>
              </li>
            </ul>
          </div>

          {/* Right Column: Social Connection & Contact Info */}
          <div className="space-y-4">
            <h3 className="font-display font-bold text-base uppercase tracking-wider text-gold-accent">
              Connect With Us
            </h3>
            <p className="text-xs text-white/60">
              TGPCOP Campus, Wardha Road, Mohgaon, Nagpur, Maharashtra 441108
            </p>
            <div className="flex space-x-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-orange-burnt hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                aria-label="Instagram Profile"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a
                href="https://whatsapp.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-orange-burnt hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                aria-label="WhatsApp Channel"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-orange-burnt hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                aria-label="YouTube Channel"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.163a3.003 3.003 0 00-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 00-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 002.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 002.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Footer Base Strip */}
        <div className="border-t border-white/10 pt-8 mt-8 flex flex-col md:flex-row items-center justify-between text-xs text-white/50 space-y-4 md:space-y-0">
          <p className="flex flex-wrap items-center gap-2">
            <span>© {currentYear} TGPCOP Student Council. All Rights Reserved.</span>
            <span className="text-white/25 hidden sm:inline">|</span>
            <Link to="/admin" className="hover:text-orange-burnt transition-colors font-semibold tracking-wide">
              🔐 Admin Portal
            </Link>
            <span className="text-white/25 hidden sm:inline">|</span>
            <Link to="/report" className="hover:text-orange-burnt transition-colors font-semibold tracking-wide">
              ⚠️ Report a Problem
            </Link>
          </p>
          <p className="flex items-center space-x-1">
            <span>Made with</span>
            <Heart className="w-3 h-3 text-orange-burnt fill-current" />
            <span>for the pharmacy pioneers at Nagpur.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
