import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { logAction } from '../../lib/logger';
import {
  GraduationCap,
  Download,
  Search,
  Filter,
  Loader2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  HelpCircle,
} from 'lucide-react';

interface Enquiry {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  course: string;
  message: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export const AdminAdmissions: React.FC = () => {
  const toast = useToast();
  
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [courseFilter, setCourseFilter] = useState('All');

  // Selected enquiry for notes/status editing modal
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('Pending');
  const [isSaving, setIsSaving] = useState(false);

  const fetchEnquiries = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admission_enquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEnquiries(data || []);
    } catch (err: any) {
      toast.error(`❌ Failed to load enquiries: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const handleUpdateEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEnquiry) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('admission_enquiries')
        .update({
          status,
          notes: notes.trim() || null,
        })
        .eq('id', editingEnquiry.id);

      if (error) throw error;

      logAction('UPDATE_ADMISSION_ENQUIRY', `Updated enquiry for ${editingEnquiry.name} to status: ${status}`);
      toast.success('✅ Enquiry status updated successfully.');
      setEditingEnquiry(null);
      fetchEnquiries();
    } catch (err: any) {
      toast.error(`❌ Failed to update enquiry: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEnquiry = async (enquiry: Enquiry) => {
    if (!window.confirm(`Are you sure you want to delete the enquiry for ${enquiry.name}?`)) return;

    try {
      const { error } = await supabase
        .from('admission_enquiries')
        .delete()
        .eq('id', enquiry.id);

      if (error) throw error;

      logAction('DELETE_ADMISSION_ENQUIRY', `Deleted enquiry for ${enquiry.name}`);
      toast.success('Enquiry deleted successfully.');
      fetchEnquiries();
    } catch (err: any) {
      toast.error(`❌ Delete failed: ${err.message}`);
    }
  };

  // Export to Excel/CSV
  const handleExportCSV = () => {
    if (enquiries.length === 0) {
      toast.warning('⚠️ No enquiries data to export.');
      return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Course', 'Message', 'Status', 'Notes', 'Submitted At'];
    
    const csvRows = [
      headers.join(','), // join headers
      ...enquiries.map(e => [
        `"${e.name.replace(/"/g, '""')}"`,
        `"${(e.email || '').replace(/"/g, '""')}"`,
        `"${e.phone.replace(/"/g, '""')}"`,
        `"${e.course.replace(/"/g, '""')}"`,
        `"${(e.message || '').replace(/"/g, '""')}"`,
        `"${e.status.replace(/"/g, '""')}"`,
        `"${(e.notes || '').replace(/"/g, '""')}"`,
        `"${new Date(e.created_at).toLocaleString()}"`
      ].join(','))
    ];

    const csvContent = "\uFEFF" + csvRows.join("\n"); // Add BOM for Excel UTF-8 support
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tgpcop_admissions_enquiries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('📊 Spreadsheet (CSV) downloaded successfully.');
  };

  // Filter enquiries
  const filteredEnquiries = enquiries.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.phone.includes(searchQuery) ||
                          (e.email && e.email.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
    const matchesCourse = courseFilter === 'All' || e.course === courseFilter;

    return matchesSearch && matchesStatus && matchesCourse;
  });

  const getStatusBadgeClass = (statusStr: string) => {
    switch (statusStr) {
      case 'Pending':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'Called - Interested':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'Called - Not Interested':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
      case 'No Answer':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
      case 'Admitted':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
      default:
        return 'bg-white/5 text-white/50 border-white/10';
    }
  };

  const getStatusIcon = (statusStr: string) => {
    switch (statusStr) {
      case 'Pending':
        return <Clock className="w-3.5 h-3.5 mr-1 shrink-0" />;
      case 'Called - Interested':
      case 'Admitted':
        return <CheckCircle className="w-3.5 h-3.5 mr-1 shrink-0" />;
      case 'Called - Not Interested':
        return <XCircle className="w-3.5 h-3.5 mr-1 shrink-0" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 mr-1 shrink-0" />;
    }
  };

  const labelCls =
    'block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1.5';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-burnt/10 rounded-xl border border-orange-burnt/20">
            <GraduationCap className="w-5 h-5 text-orange-burnt" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Admissions Enquiries</h2>
            <p className="text-xs text-white/40 font-sans mt-0.5">
              Manage student admission leads, track call responses, and download spreadsheets
            </p>
          </div>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold hover:shadow-[0_4px_15px_rgba(214,90,30,0.4)] hover:-translate-y-px transition-all shadow-md cursor-pointer border border-white/5"
        >
          <Download className="w-4 h-4" />
          <span>Download Spreadsheet</span>
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <Search className="w-4.5 h-4.5 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, phone, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#0D1B3E] text-white text-sm placeholder-white/35 outline-none focus:border-orange-burnt/50 transition-all font-sans"
          />
        </div>

        {/* Course Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#0D1B3E] text-white text-sm outline-none focus:border-orange-burnt/50 transition-all font-sans"
          >
            <option value="All">All Courses</option>
            <option value="B.Pharm">B.Pharm</option>
            <option value="D.Pharm">D.Pharm</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-white/10 bg-[#0D1B3E] text-white text-sm outline-none focus:border-orange-burnt/50 transition-all font-sans"
          >
            <option value="All">All Call Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Called - Interested">Called - Interested</option>
            <option value="Called - Not Interested">Called - Not Interested</option>
            <option value="No Answer">No Answer</option>
            <option value="Admitted">Admitted</option>
          </select>
        </div>
      </div>

      {/* Enquiries List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-white/40">
          <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-3" />
          <p className="text-sm font-display">Loading enquiries...</p>
        </div>
      ) : filteredEnquiries.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center bg-white/[0.02] rounded-2xl border border-white/5 text-center px-4">
          <GraduationCap className="w-12 h-12 text-white/10 mb-3" />
          <p className="text-white/50 text-sm font-display font-bold">No enquiries found</p>
          <p className="text-white/30 text-xs font-sans mt-1">
            {searchQuery || statusFilter !== 'All' || courseFilter !== 'All' 
              ? 'Try modifying your filters or search keywords.' 
              : 'New enquiries submitted via the homepage will appear here.'}
          </p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(5,11,24,0.4)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] text-white/40 font-bold uppercase tracking-wider">
                  <th className="py-4 px-6">Student Info</th>
                  <th className="py-4 px-6">Course</th>
                  <th className="py-4 px-6">Submitted Msg</th>
                  <th className="py-4 px-6">Call Status</th>
                  <th className="py-4 px-6">Action / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80 font-sans text-xs">
                {filteredEnquiries.map((enquiry) => (
                  <tr key={enquiry.id} className="hover:bg-white/[0.01] transition-all">
                    {/* Student Info */}
                    <td className="py-4 px-6 space-y-1">
                      <div className="text-white font-semibold text-sm">{enquiry.name}</div>
                      <div className="flex items-center space-x-1.5 text-white/45">
                        <Phone className="w-3 h-3 text-orange-burnt" />
                        <a href={`tel:${enquiry.phone}`} className="hover:text-orange-burnt transition-colors">{enquiry.phone}</a>
                      </div>
                      {enquiry.email && (
                        <div className="flex items-center space-x-1.5 text-white/45">
                          <Mail className="w-3 h-3 text-orange-burnt" />
                          <span>{enquiry.email}</span>
                        </div>
                      )}
                    </td>

                    {/* Course */}
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold border bg-orange-burnt/10 text-orange-burnt border-orange-burnt/25">
                        {enquiry.course}
                      </span>
                    </td>

                    {/* Message */}
                    <td className="py-4 px-6 max-w-xs">
                      {enquiry.message ? (
                        <p className="line-clamp-2 text-white/60 leading-relaxed">{enquiry.message}</p>
                      ) : (
                        <span className="text-white/20 italic">No query message</span>
                      )}
                      <div className="flex items-center space-x-1 text-[9px] text-white/30 font-bold uppercase tracking-wider mt-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(enquiry.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-bold border ${getStatusBadgeClass(enquiry.status)}`}>
                        {getStatusIcon(enquiry.status)}
                        {enquiry.status}
                      </span>
                    </td>

                    {/* Actions & Notes */}
                    <td className="py-4 px-6 space-y-2">
                      {enquiry.notes ? (
                        <div className="bg-[#050B18]/50 border border-white/5 rounded-xl p-2.5 max-w-xs text-[11px] text-white/50 italic leading-relaxed">
                          {enquiry.notes}
                        </div>
                      ) : (
                        <span className="text-white/25 italic text-[10px] block">No call notes added</span>
                      )}
                      <div className="flex items-center space-x-2 pt-1">
                        <button
                          onClick={() => {
                            setEditingEnquiry(enquiry);
                            setStatus(enquiry.status);
                            setNotes(enquiry.notes || '');
                          }}
                          className="px-2.5 py-1 bg-white/5 border border-white/10 hover:bg-orange-burnt/10 hover:border-orange-burnt/30 text-white/80 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                        >
                          ✏️ Update Call
                        </button>
                        <button
                          onClick={() => handleDeleteEnquiry(enquiry)}
                          className="p-1 rounded-lg hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all cursor-pointer"
                          title="Delete enquiry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Update Status & Notes Modal */}
      {editingEnquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#0A1428] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-white/[0.01]">
              <div>
                <h3 className="font-display font-extrabold text-sm text-white uppercase tracking-wider">
                  Update Lead: {editingEnquiry.name}
                </h3>
                <span className="text-[9px] text-orange-burnt font-sans font-bold block mt-0.5 uppercase tracking-widest">
                  Course: {editingEnquiry.course} • Phone: {editingEnquiry.phone}
                </span>
              </div>
              <button
                onClick={() => setEditingEnquiry(null)}
                className="p-1.5 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-all outline-none"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateEnquiry} className="p-5 space-y-4">
              {/* Call Status */}
              <div className="space-y-1.5">
                <label className={labelCls}>Call Status *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0D1B3E] text-white text-sm outline-none focus:border-orange-burnt/50 transition-all font-sans"
                >
                  <option value="Pending" className="bg-[#0A1428] text-white">Pending (Not Called)</option>
                  <option value="Called - Interested" className="bg-[#0A1428] text-white">Called - Interested</option>
                  <option value="Called - Not Interested" className="bg-[#0A1428] text-white">Called - Not Interested</option>
                  <option value="No Answer" className="bg-[#0A1428] text-white">No Answer / Busy</option>
                  <option value="Admitted" className="bg-[#0A1428] text-white">Admitted Successfully</option>
                </select>
              </div>

              {/* Call Notes */}
              <div className="space-y-1.5">
                <label className={labelCls}>Call Notes / Follow-up Details</label>
                <textarea
                  placeholder="e.g. Interested in B.Pharm, asked to call back next Monday after results."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-[#0D1B3E] text-white text-sm placeholder-white/35 outline-none focus:border-orange-burnt/50 transition-all resize-none font-sans"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-3 pt-3 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setEditingEnquiry(null)}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 hover:text-white hover:bg-white/5 text-xs font-display font-bold uppercase transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-grow py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center border border-white/5"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Update</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdmissions;
