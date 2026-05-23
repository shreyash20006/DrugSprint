import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { motion } from 'framer-motion';
import { ShieldCheck, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { sendAdminNotification } from '../../lib/brevo';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    // If user is already authenticated, send them to dashboard immediately
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/admin/dashboard', { replace: true });
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoggingIn(true);
    setErrorMessage('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Log successful login
      await logActivity(email, 'login_success', `Successful login from portal for ${email}`);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: any) {
      const errMsg = err.message || 'Invalid email or password. Please try again.';
      setErrorMessage(errMsg);
      toast.error(`❌ Login failed! ${errMsg}`);
      // Log failed login and optionally notify super admin
      await logActivity(email, 'login_fail', `Failed login attempt for "${email}": ${errMsg}`);
      await sendAdminNotification({
        subject: '🚨 Failed Login Attempt Detected',
        title: 'Failed Login Attempt',
        bodyHtml: `<p><b>Email Attempted:</b> ${email}</p><p><b>Error:</b> ${errMsg}</p><p>Please review the Activity Logs for more details.</p>`,
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-navy-dark flex items-center justify-center p-4 overflow-hidden">
      
      {/* Visual background shapes */}
      <div className="absolute top-1/4 -left-10 w-96 h-96 bg-orange-burnt/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-10 w-96 h-96 bg-gold-accent/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.005)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.005)_1px,transparent_1px)] bg-[size:30px_30px] opacity-25 pointer-events-none" />

      {/* Glass card container */}
      <motion.div
        initial={{ opacity: 0, y: 35 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-white/50 hover:text-white mb-6 text-sm transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Public Site</span>
        </Link>

        <div className="glass-panel-dark rounded-2xl p-8 border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-burnt/5 rounded-bl-full pointer-events-none" />

          {/* Icon Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-orange-burnt flex items-center justify-center text-white shadow-lg mb-4">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="font-display font-extrabold text-2xl text-white">Council Console</h1>
            <p className="text-white/60 text-xs mt-1 uppercase tracking-wider font-semibold">TGPCOP Student Council</p>
          </div>

          {/* Display Warning Error */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs p-3 rounded-lg mb-6 leading-relaxed"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  required
                  placeholder="admin@tgpcop.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-orange-burnt text-white placeholder-white/20 outline-none text-sm transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-orange-burnt text-white placeholder-white/20 outline-none text-sm transition-colors"
                />
              </div>
            </div>

            {/* Submit Auth */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="group flex items-center justify-center space-x-2 w-full py-3.5 bg-orange-burnt hover:bg-orange-burnt/95 text-white font-display font-bold rounded-lg text-sm sm:text-base shadow-lg hover:shadow-orange-burnt/20 hover:-translate-y-0.5 transition-all duration-300"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authorizing...</span>
                </>
              ) : (
                <>
                  <span>Sign In Securely</span>
                  <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>

        </div>

        <p className="text-center text-white/40 text-[10px] sm:text-xs mt-6 tracking-wide leading-none">
          🔐 Protected Administrator Access Only. Activities are audited.
        </p>
      </motion.div>

    </div>
  );
};

export default AdminLogin;
