import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Users, Upload, Search, Clock, XCircle, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '../../components/admin/ProtectedRoute';

export const AdminStudentVerification: React.FC = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">Student Verification</h2>
          <p className="text-sm text-white/50 mt-1">Manage and verify PRN-based student accounts.</p>
        </div>
      </div>

      {/* Preparation Mode Banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start space-x-3 shadow-lg relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[40px] pointer-events-none" />
        <Clock className="w-6 h-6 text-amber-500 shrink-0" />
        <div>
          <h3 className="text-sm font-display font-bold text-amber-400">Preparation Mode Active</h3>
          <p className="text-xs text-amber-200/70 mt-1 max-w-3xl leading-relaxed">
            The Student Verification module is currently being built and tested. Verification capabilities will be automatically enabled once the official TGPCOP student database is uploaded to the system. No student features are currently restricted.
          </p>
        </div>
      </motion.div>

      {/* Demo Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-16 h-16 text-white" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-1">Total Students</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-display font-extrabold text-white opacity-50">0</span>
            <span className="text-xs font-bold text-white/30">records</span>
          </div>
        </div>

        {/* Verified Students */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BadgeCheck className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-500/70 mb-1">Verified Students</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-display font-extrabold text-white opacity-50">0</span>
            <span className="text-xs font-bold text-white/30">verified</span>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="w-16 h-16 text-amber-500" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-amber-500/70 mb-1">Pending Verification</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-display font-extrabold text-white opacity-50">0</span>
            <span className="text-xs font-bold text-white/30">pending</span>
          </div>
        </div>

        {/* Rejected Verification */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-red-500/70 mb-1">Rejected</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-display font-extrabold text-white opacity-50">0</span>
            <span className="text-xs font-bold text-white/30">rejected</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Data Management */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#0A1428] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-burnt/5 rounded-full blur-[40px] pointer-events-none" />
            
            <h3 className="font-display font-bold text-white mb-4 flex items-center">
              <Upload className="w-4 h-4 mr-2 text-orange-burnt" /> Database Import
            </h3>

            <div className="space-y-4">
              <button disabled className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 opacity-50 cursor-not-allowed transition-all">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Import CSV File</p>
                    <p className="text-[10px] text-white/40">Upload official database</p>
                  </div>
                </div>
                <Upload className="w-4 h-4 text-white/20" />
              </button>

              <button disabled className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 opacity-50 cursor-not-allowed transition-all">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-burnt/10 rounded-lg">
                    <BadgeCheck className="w-5 h-5 text-orange-burnt" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Run Auto-Verify</p>
                    <p className="text-[10px] text-white/40">Match unverified users</p>
                  </div>
                </div>
              </button>

              <div className="p-3 bg-white/5 rounded-xl border border-dashed border-white/10 text-center">
                <p className="text-[10px] text-white/40 leading-relaxed">
                  Student database upload will be available after official records are received from the administration.
                </p>
              </div>
            </div>
          </div>

          {/* Verification Roadmap */}
          <div className="bg-[#0A1428] border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <h3 className="font-display font-bold text-white mb-4 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-burnt" /> Verification Roadmap
            </h3>

            <div className="space-y-4 text-xs font-sans">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-400 font-bold">Phase 1: Foundation</span>
                <span className="text-emerald-400">✅</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/70 font-medium">Phase 2: Student Database Upload</span>
                <span className="text-amber-500 animate-pulse">⏳</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/70 font-medium">Phase 3: Automatic PRN Verification</span>
                <span className="text-amber-500">⏳</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/70 font-medium">Phase 4: Verified Student Features</span>
                <span className="text-amber-500">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Search & Records */}
        <div className="lg:col-span-2">
          <div className="bg-[#0A1428] border border-white/10 rounded-3xl p-6 shadow-xl h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-display font-bold text-white flex items-center">
                <Users className="w-4 h-4 mr-2 text-orange-burnt" /> Verification Records
              </h3>
              
              <div className="relative">
                <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  disabled
                  placeholder="Search PRN or Name..." 
                  className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-white/30 outline-none opacity-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-10 bg-white/[0.02] border border-dashed border-white/10 rounded-2xl">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                <BadgeCheck className="w-8 h-8 text-white/20" />
              </div>
              <h4 className="text-white font-display font-bold mb-1">No Records Available</h4>
              <p className="text-xs text-white/40 text-center max-w-sm leading-relaxed">
                The verification records database is currently empty. This view will populate once the student database is uploaded and accounts start matching.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStudentVerification;
