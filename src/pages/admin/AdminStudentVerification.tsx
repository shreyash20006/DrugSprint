import React, { useState, useEffect } from 'react';
import { BadgeCheck, Users, Search, Clock, XCircle, Loader2, Plus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

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
      const { data: verificationsData, error: verificationsError } = await supabase
        .from('student_verifications')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (verificationsError) throw verificationsError;
      
      if (verificationsData) {
        const { data: profilesData } = await supabase.from('profiles').select('id, email');
        
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
      fetchData(); 
    } catch (e: any) {
      console.error(e);
      alert('Error adding PRN: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tableVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const rowVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-extrabold text-white tracking-tight drop-shadow-md">Student Verification</h2>
          <p className="text-sm text-white/50 mt-1">Manage and verify PRN-based student accounts.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="group flex items-center space-x-2 bg-gradient-to-r from-orange-burnt to-[#FF8C42] text-white px-5 py-2.5 rounded-xl transition-all font-bold text-sm shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:shadow-[0_6px_20px_rgba(214,90,30,0.6)] hover:-translate-y-0.5 active:translate-y-0"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          <span>Add PRN</span>
        </button>
      </div>

      {/* Analytics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Students */}
        <div className="bg-[#0A1428]/60 backdrop-blur-md border border-white/10 rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-colors">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Users className="w-16 h-16 text-white" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/50 mb-1">Total Students</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-display font-extrabold text-white drop-shadow-sm">{stats.total}</span>
            <span className="text-xs font-bold text-white/30">records</span>
          </div>
        </div>

        {/* Verified Students */}
        <div className="bg-[#0A1428]/60 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-5 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-500 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <BadgeCheck className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-400/80 mb-1">Verified Students</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-display font-extrabold text-white drop-shadow-sm">{stats.verified}</span>
            <span className="text-xs font-bold text-emerald-500/40">verified</span>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-[#0A1428]/60 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="w-16 h-16 text-amber-500" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-amber-400/80 mb-1">Pending Verification</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-display font-extrabold text-white drop-shadow-sm">{stats.pending}</span>
            <span className="text-xs font-bold text-amber-500/40">pending</span>
          </div>
        </div>

        {/* Rejected Verification */}
        <div className="bg-[#0A1428]/60 backdrop-blur-md border border-red-500/20 rounded-2xl p-5 relative overflow-hidden group hover:border-red-500/40 transition-colors">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-red-500 rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <XCircle className="w-16 h-16 text-red-500" />
          </div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-red-400/80 mb-1">Rejected</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-display font-extrabold text-white drop-shadow-sm">{stats.rejected}</span>
            <span className="text-xs font-bold text-red-500/40">rejected</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Full Column: Search & Records */}
        <div className="col-span-1">
          <div className="bg-[#0A1428]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl h-full flex flex-col min-h-[500px]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h3 className="font-display font-bold text-white flex items-center text-lg">
                <Users className="w-5 h-5 mr-2 text-orange-burnt" /> Verification Records
              </h3>
              
              <div className="relative group">
                <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-orange-burnt transition-colors" />
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search PRN or Name..." 
                  className="w-full sm:w-72 bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 transition-all shadow-inner"
                />
              </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col border border-white/5 rounded-2xl bg-black/20 shadow-inner">
              {isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10">
                  <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
                  <p className="text-sm text-white/50 font-display">Loading official database...</p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-10">
                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10 shadow-lg">
                    <Search className="w-10 h-10 text-white/30" />
                  </div>
                  <h4 className="text-white font-display font-bold text-lg mb-2">No Records Found</h4>
                  <p className="text-sm text-white/40 text-center max-w-sm leading-relaxed">
                    We couldn't find any students matching your search criteria. Try a different PRN or Name.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#0A1428]/95 backdrop-blur-md z-20 shadow-sm border-b border-white/10">
                      <tr className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                        <th className="p-4 pl-6">PRN</th>
                        <th className="p-4">Student Name</th>
                        <th className="p-4">Linked Email</th>
                        <th className="p-4">Sem</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 pr-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <motion.tbody 
                      variants={tableVariants} 
                      initial="hidden" 
                      animate="show"
                      className="divide-y divide-white/5"
                    >
                      {filteredRecords.map((record) => (
                        <motion.tr variants={rowVariants} key={record.id} className="hover:bg-white/[0.03] transition-colors group">
                          <td className="p-4 pl-6 text-sm font-display font-bold text-orange-burnt whitespace-nowrap">
                            {record.prn}
                          </td>
                          <td className="p-4 text-sm text-white font-medium group-hover:text-orange-100 transition-colors">
                            {record.student_name}
                          </td>
                          <td className="p-4 text-sm text-white/70">
                            {record.profiles?.email ? record.profiles.email : <span className="text-white/30 italic">Unlinked</span>}
                          </td>
                          <td className="p-4 text-xs text-white/50">
                            {record.semester || 'N/A'}
                          </td>
                          <td className="p-4">
                            <span className={`inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded border shadow-sm ${
                              record.verification_status === 'verified' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/10' 
                                : record.verification_status === 'rejected'
                                ? 'bg-red-500/10 text-red-400 border-red-500/20 shadow-red-500/10'
                                : 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-amber-500/10'
                            }`}>
                              {record.verification_status}
                            </span>
                          </td>
                          <td className="p-4 pr-6 text-right">
                            {record.verification_status === 'verified' && (
                              <button 
                                onClick={() => handleRevoke(record.id)}
                                title="Revoke PRN and Unlink"
                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg border border-red-500/20 hover:border-red-500 transition-all shadow-sm"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </table>
                </div>
              )}
            </div>
            
            {!isLoading && (
              <div className="mt-5 flex items-center justify-between text-[10px] text-white/40 uppercase tracking-widest font-bold">
                <span>Showing {filteredRecords.length} records</span>
                <span>TGPCOP Official Database</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add PRN Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050A15]/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#0A1428] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-burnt to-[#FF8C42]" />
              
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-display font-extrabold text-white">Add New PRN</h3>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
              
              <form onSubmit={handleAddPrn} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">PRN Number</label>
                  <input 
                    type="text" 
                    required
                    value={newPrn}
                    onChange={e => setNewPrn(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 transition-all placeholder:text-white/20 shadow-inner"
                    placeholder="e.g. 240467311..."
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">Student Name</label>
                  <input 
                    type="text" 
                    required
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 transition-all placeholder:text-white/20 shadow-inner"
                    placeholder="e.g. John Doe"
                  />
                </div>
                
                <div className="flex space-x-3 pt-6">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3.5 bg-gradient-to-r from-orange-burnt to-[#FF8C42] hover:from-[#b04a18] hover:to-orange-burnt text-white rounded-xl transition-all font-bold text-sm disabled:opacity-50 flex justify-center items-center shadow-[0_4px_15px_rgba(214,90,30,0.4)]"
                  >
                    {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add Student'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminStudentVerification;
