import React, { useState, useEffect } from 'react';
import { BadgeCheck, Users, Upload, Search, Clock, XCircle, FileSpreadsheet, Loader2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export const AdminStudentVerification: React.FC = () => {
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, rejected: 0 });
  const [records, setRecords] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPrn, setNewPrn] = useState('');
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch verifications and optionally join with profiles to get the email if a user is linked
      // PostgREST might not recognize the join if the FK is on auth.users instead of profiles.
      // So we fetch verifications and profiles separately and merge them.
      const { data: verificationsData, error: verificationsError } = await supabase
        .from('student_verifications')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (verificationsError) throw verificationsError;
      
      if (verificationsData) {
        // Fetch all profiles to map emails
        const { data: profilesData } = await supabase.from('profiles').select('id, email');
        
        // Merge them manually
        const mergedData = verificationsData.map((v: any) => {
          const profile = profilesData?.find((p: any) => p.id === v.user_id);
          return {
            ...v,
            profiles: profile ? { email: profile.email } : null
          };
        });

        setRecords(mergedData);
        setStats({
          total: mergedData.length,
          verified: mergedData.filter((d: any) => d.verification_status === 'verified').length,
          pending: mergedData.filter((d: any) => d.verification_status === 'pending' || d.verification_status === 'coming_soon').length,
          rejected: mergedData.filter((d: any) => d.verification_status === 'rejected').length,
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
    r.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.profiles?.email && r.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRevoke = async (id: string) => {
    if (!window.confirm("Are you sure you want to revoke this PRN? It will be unlinked from the student's account and reset to pending.")) return;
    try {
      const { error } = await supabase.from('student_verifications').update({
        user_id: null,
        verification_status: 'pending'
      }).eq('id', id);
      
      if (error) throw error;
      // Refresh the list locally
      fetchData();
    } catch (e: any) {
      console.error(e);
      alert('Error revoking PRN: ' + e.message);
    }
  };

  const handleAddPrn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrn.trim() || !newName.trim()) return alert('Please enter both PRN and Student Name.');
    setIsSubmitting(true);
    try {
      // Check if it already exists
      const { data: existing } = await supabase.from('student_verifications').select('id').eq('prn', newPrn.trim()).single();
      if (existing) {
        alert('This PRN already exists in the database!');
        setIsSubmitting(false);
        return;
      }
      
      const { error } = await supabase.from('student_verifications').insert({
        prn: newPrn.trim(),
        student_name: newName.trim(),
        verification_status: 'pending'
      });
      
      if (error) throw error;
      
      setShowAddModal(false);
      setNewPrn('');
      setNewName('');
      fetchData(); // refresh list
    } catch (e: any) {
      console.error(e);
      alert('Error adding PRN: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-white tracking-tight">Student Verification</h2>
          <p className="text-sm text-white/50 mt-1">Manage and verify PRN-based student accounts.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-orange-burnt hover:bg-[#b04a18] text-white px-4 py-2 rounded-xl transition-colors font-bold text-sm shadow-[0_0_15px_rgba(214,90,30,0.3)] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add PRN</span>
        </button>
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
                        <th className="p-3 border-b border-white/5">Linked Email</th>
                        <th className="p-3 border-b border-white/5">Sem</th>
                        <th className="p-3 border-b border-white/5">Status</th>
                        <th className="p-3 border-b border-white/5 text-right">Actions</th>
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
                          <td className="p-3 text-xs text-white/70">
                            {record.profiles?.email ? record.profiles.email : <span className="text-white/30 italic">Unlinked</span>}
                          </td>
                          <td className="p-3 text-[10px] text-white/50">
                            {record.semester || 'N/A'}
                          </td>
                          <td className="p-3">
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
                          <td className="p-3 text-right">
                            {record.verification_status === 'verified' && (
                              <button 
                                onClick={() => handleRevoke(record.id)}
                                title="Revoke PRN and Unlink"
                                className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded border border-red-500/20 transition-colors"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
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
      {/* Add PRN Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0A1428] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <h3 className="text-xl font-display font-extrabold text-white mb-6">Add New Student PRN</h3>
            
            <form onSubmit={handleAddPrn} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 ml-1">PRN Number</label>
                <input 
                  type="text" 
                  required
                  value={newPrn}
                  onChange={e => setNewPrn(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-burnt transition-colors placeholder:text-white/20"
                  placeholder="e.g. 240467311..."
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1.5 ml-1">Student Name</label>
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-burnt transition-colors placeholder:text-white/20"
                  placeholder="e.g. John Doe"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors font-bold text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-3 bg-orange-burnt hover:bg-[#b04a18] text-white rounded-xl transition-colors font-bold text-sm disabled:opacity-50 flex justify-center items-center shadow-lg"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentVerification;
