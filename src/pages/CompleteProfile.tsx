import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useStudentAuth } from '../lib/StudentAuthProvider';
import { User, BookOpen, Phone, Mail, Sparkles, ShieldCheck, Loader2 } from 'lucide-react';
import { useToast } from '../components/admin/Toast';

export const CompleteProfile: React.FC = () => {
  const { studentUser, studentProfile, isLoading, refreshProfile } = useStudentAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [fullName, setFullName] = useState('');
  const [year, setYear] = useState('First Year');
  const [phone, setPhone] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Redirect to login if user session doesn't exist
  useEffect(() => {
    if (!isLoading && !studentUser) {
      navigate('/login');
    }
  }, [studentUser, isLoading, navigate]);

  // Pre-fill profile name if available from Google login
  useEffect(() => {
    if (studentProfile) {
      const name = studentProfile.full_name || '';
      // Don't pre-fill placeholder names
      if (name !== 'Student' && name !== 'Member') {
        setFullName(name);
      }
      setYear(studentProfile.year || 'First Year');
      setPhone(studentProfile.phone || '');
    }
  }, [studentProfile]);

  // Auto redirect to dashboard if profile is already complete
  useEffect(() => {
    if (!isLoading && studentProfile) {
      const isComplete = studentProfile.full_name && 
                         studentProfile.full_name !== 'Student' && 
                         studentProfile.full_name !== 'Member' && 
                         studentProfile.phone && 
                         studentProfile.year;
      if (isComplete) {
        navigate('/dashboard');
      }
    }
  }, [studentProfile, isLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentUser) return;

    if (!fullName.trim() || fullName.trim().length < 3) {
      return toast.error('Please enter your full name (minimum 3 characters)');
    }
    if (!phone.trim() || phone.trim().length < 10) {
      return toast.error('Please enter a valid WhatsApp phone number (minimum 10 digits)');
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          year: year,
          phone: phone.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', studentUser.id);

      if (error) throw error;

      await refreshProfile();
      toast.success('🎉 Profile completed successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !studentUser) {
    return (
      <div className="min-h-screen bg-[#050B18] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-burnt animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#050B18] text-white flex flex-col justify-center items-center px-4 py-16 overflow-hidden">
      {/* Background glowing ambient orbs */}
      <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] rounded-full ambient-orb-orange opacity-40 z-0 pointer-events-none blur-[120px]" />
      <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full ambient-orb-gold opacity-40 z-0 pointer-events-none blur-[120px]" />
      <div className="absolute inset-0 grid-bg-overlay opacity-10 z-0 pointer-events-none" />
      <div className="noise-overlay noise-soft" />

      {/* Main card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Corner border accents */}
        <div className="absolute -top-px -left-px w-12 h-12 border-t-2 border-l-2 border-orange-burnt/50 rounded-tl-3xl pointer-events-none" />
        <div className="absolute -bottom-px -right-px w-12 h-12 border-b-2 border-r-2 border-gold-accent/40 rounded-br-3xl pointer-events-none" />

        <div className="relative bg-gradient-to-br from-[#0D1B3E]/95 to-[#0A1428]/95 border border-orange-burnt/25 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3.5 mb-6 relative z-10">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-burnt to-[#E06D2B] flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-lg text-white tracking-tight">
                Complete Your Profile
              </h2>
              <p className="text-[10px] text-white/45 font-sans font-medium tracking-[0.18em] uppercase mt-0.5">
                Onboarding Step 1 of 2
              </p>
            </div>
          </div>

          <p className="text-white/60 text-xs leading-relaxed mb-6 font-sans">
            Please fill in your basic student credentials below to unlock access to student forums, event passes, study stores, and resources.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
            {/* Read-Only Email Field */}
            <div className="relative">
              <label className="block text-[10px] font-bold text-white/60 uppercase mb-1.5 pl-1">Email ID</label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  disabled
                  value={studentUser.email}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-xs text-white/40 outline-none cursor-not-allowed"
                />
              </div>
            </div>

            {/* Full Name Field */}
            <div>
              <label className="block text-[10px] font-bold text-white/60 uppercase mb-1.5 pl-1">Full Name</label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isSaving}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-[#0F1E42]/80 text-xs text-white placeholder-white/20 outline-none focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt/20 transition-all"
                />
              </div>
            </div>

            {/* Academic Year Field */}
            <div>
              <label className="block text-[10px] font-bold text-white/60 uppercase mb-1.5 pl-1">Academic Year</label>
              <div className="relative flex items-center">
                <BookOpen className="absolute left-3.5 w-4 h-4 text-white/30" />
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  disabled={isSaving}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-[#080F25] text-xs text-white outline-none focus:border-orange-burnt transition-all appearance-none cursor-pointer"
                >
                  <option value="First Year">First Year</option>
                  <option value="Second Year">Second Year</option>
                  <option value="Third Year">Third Year</option>
                  <option value="Final Year">Final Year</option>
                </select>
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className="block text-[10px] font-bold text-white/60 uppercase mb-1.5 pl-1">WhatsApp Phone Number</label>
              <div className="relative flex items-center">
                <Phone className="absolute left-3.5 w-4 h-4 text-white/30" />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  disabled={isSaving}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-white/10 bg-[#0F1E42]/80 text-xs text-white placeholder-white/20 outline-none focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt/20 transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSaving}
              whileHover={{ scale: isSaving ? 1 : 1.015 }}
              whileTap={{ scale: isSaving ? 1 : 0.98 }}
              className="w-full py-3.5 mt-2 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg hover:shadow-orange-burnt/10 hover:shadow-xl transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Saving details...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify and Onboard</span>
                </>
              )}
            </motion.button>
          </form>

          {/* Footer details */}
          <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[9px] text-white/30 font-sans font-bold uppercase tracking-[0.18em]">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles className="w-2.5 h-2.5 text-gold-accent" />
              Secure Data Sync
            </span>
            <span>TGPCOP nagpur</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CompleteProfile;
