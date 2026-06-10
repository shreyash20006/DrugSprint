import React, { useState, useEffect } from 'react';
import { BadgeCheck, Users, Upload, Search, Clock, XCircle, FileSpreadsheet, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminStudentVerification: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, rejected: 0 });
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_verifications')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      if (data) {
        setRecords(data);
        setStats({
          total: data.length,
          verified: data.filter(d => d.verification_status === 'verified').length,
          pending: data.filter(d => d.verification_status === 'pending' || d.verification_status === 'coming_soon').length,
          rejected: data.filter(d => d.verification_status === 'rejected').length,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredRecords = records.filter(r => 
    r.prn.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">Student Verification</h2>
          <p className="text-sm text-white/50 mt-1">Manage and verify PRN-based student accounts.</p>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="w-16 h-16 text-white" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-1">Total Students</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-display font-extrabold text-white">{stats.total}</span>
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
            <span className="text-3xl font-display font-extrabold text-white">{stats.verified}</span>
            <span className="text-xs font-bold text-emerald-500/30">verified</span>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="w-16 h-16 text-amber-500" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-amber-500/70 mb-1">Pending Verification</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-display font-extrabold text-white">{stats.pending}</span>
            <span className="text-xs font-bold text-amber-500/30">pending</span>
          </div>
        </div>

        {/* Rejected Verification */}
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-red-500/70 mb-1">Rejected</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-display font-extrabold text-white">{stats.rejected}</span>
            <span className="text-xs font-bold text-red-500/30">rejected</span>
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
              <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-white">Import CSV File</p>
                    <p className="text-[10px] text-white/40">Upload official database</p>
                  </div>
                </div>
                <Upload className="w-4 h-4 text-white/50" />
              </button>

              <button className="w-full flex items-center justify-between p-4 rounded-xl bg-orange-burnt/10 border border-orange-burnt/20 hover:bg-orange-burnt/20 transition-all">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-burnt/20 rounded-lg">
                    <BadgeCheck className="w-5 h-5 text-orange-burnt" />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-orange-400">Run Auto-Verify</p>
                    <p className="text-[10px] text-orange-400/50">Match unverified users</p>
                  </div>
                </div>
              </button>

              <div className="p-3 bg-emerald-500/10 rounded-xl border border-dashed border-emerald-500/20 text-center">
                <p className="text-[10px] text-emerald-400 leading-relaxed font-bold">
                  Official records received. Phase 3 Verification is currently active.
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
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-400 font-bold">Phase 2: Database Upload</span>
                <span className="text-emerald-400">✅</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-amber-400 font-bold">Phase 3: Automatic Verification</span>
                <span className="text-amber-500 animate-pulse">⏳</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-white/70 font-medium">Phase 4: Verified Student Features</span>
                <span className="text-amber-500/50">⏳</span>
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search PRN or Name..." 
                  className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder:text-white/30 outline-none focus:border-orange-burnt transition-colors"
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col border border-white/5 rounded-2xl bg-white/[0.01]">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10">
                  <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-4" />
                  <p className="text-xs text-white/40 font-display">Loading official database...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-white/20" />
                  </div>
                  <h4 className="text-white font-display font-bold mb-1">No Records Found</h4>
                  <p className="text-xs text-white/40 text-center max-w-sm leading-relaxed">
                    Try adjusting your search filters.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0A1428] z-10">
                      <tr className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        <th className="p-3 border-b border-white/5">PRN</th>
                        <th className="p-3 border-b border-white/5">Student Name</th>
                        <th className="p-3 border-b border-white/5">Sem</th>
                        <th className="p-3 border-b border-white/5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-3 text-xs font-display font-bold text-orange-burnt whitespace-nowrap">
                            {record.prn}
                          </td>
                          <td className="p-3 text-xs text-white font-medium">
                            {record.student_name}
                          </td>
                          <td className="p-3 text-[10px] text-white/50">
                            {record.semester || 'N/A'}
                          </td>
                          <td className="p-3 text-right">
                            <span className={`inline-block text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${
                              record.verification_status === 'verified' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : record.verification_status === 'rejected'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {record.verification_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            {!isLoading && (
              <div className="mt-4 flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest font-bold">
                <span>Showing {filteredRecords.length} records</span>
                <span>TGPCOP Official Database</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStudentVerification;
