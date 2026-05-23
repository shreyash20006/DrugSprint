import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, MessageCircle, Heart } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const [socialLinks, setSocialLinks] = useState({
    instagram: '',
    facebook: '',
    twitter: '',
    linkedin: '',
    youtube: '',
    whatsapp_group: '',
  });

  useEffect(() => {
    const fetchSocialLinks = async () => {
      try {
        const { data, error } = await supabase.from('settings').select('*');
        if (error) throw error;
        const map: Record<string, string> = {};
        (data || []).forEach((row: any) => { map[row.key] = row.value; });
        
        setSocialLinks({
          instagram: map['social_instagram'] || '',
          facebook: map['social_facebook'] || '',
          twitter: map['social_twitter'] || '',
          linkedin: map['social_linkedin'] || '',
          youtube: map['social_youtube'] || '',
          whatsapp_group: map['social_whatsapp_group'] || '',
        });
      } catch (err) {
        console.error('Error fetching social links:', err);
      }
    };

    fetchSocialLinks();
  }, []);

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
            <div className="flex flex-wrap gap-3">
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  aria-label="Instagram Profile"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  aria-label="Facebook Page"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-sky-500 hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  aria-label="Twitter Profile"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
              )}
              
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-blue-700 hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  aria-label="LinkedIn Page"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              
              {socialLinks.youtube && (
                <a
                  href={socialLinks.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-red-600 hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  aria-label="YouTube Channel"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              
              {socialLinks.whatsapp_group && (
                <a
                  href={socialLinks.whatsapp_group}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-green-600 hover:text-white flex items-center justify-center transition-all duration-300 transform hover:scale-110"
                  aria-label="WhatsApp Group"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
            </div>
            
            {/* Fallback message if no social links */}
            {!socialLinks.instagram && !socialLinks.facebook && !socialLinks.twitter && 
             !socialLinks.linkedin && !socialLinks.youtube && !socialLinks.whatsapp_group && (
              <p className="text-xs text-white/40 italic">Social media links coming soon...</p>
            )}
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
            <span className="text-white/25 hidden sm:inline">|</span>
            <Link to="/complaint" className="hover:text-orange-burnt transition-colors font-semibold tracking-wide">
              🆘 Report an Issue
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
