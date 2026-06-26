import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { logAction } from '../../lib/logger';
import {
  Tag, Plus, Edit, Trash2, Eye, EyeOff, Copy,
  Search, Loader2, Archive, ToggleLeft, ToggleRight,
  Star, Users, CreditCard, X, Upload
} from 'lucide-react';
import { uploadFileToCloudinary } from '../../lib/cloudinary';

const CATEGORIES = [
  'Events', 'Workshops', 'Seminars', 'Conferences',
  'Membership', 'Certificates', 'Study Materials',
  'Digital Downloads', 'Academic Services', 'Others'
];
const STATUSES = ['upcoming', 'open', 'closed', 'sold_out', 'draft'];

const EMPTY_FORM = {
  name: '', category: 'Events', description: '',
  banner_image: '', thumbnail: '',
  price: '', discount_price: '', currency: 'INR',
  registration_open: '', registration_close: '',
  max_seats: '', unlimited_seats: true,
  allow_waiting_list: false,
  status: 'open',
  is_featured: false, is_popular: false, is_new: true,
  is_active: true,
};

export const AdminServices: React.FC = () => {
  const toast = useToast();
  const { role } = useAuth();
  const canEdit = ['super_admin', 'admin', 'developer', 'treasurer'].includes(role || '');

  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ ...EMPTY_FORM });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('services').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setServices(data || []);
    } catch (err: any) {
      toast.error('Failed to load services: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openCreate = () => {
    setEditingService(null);
    setForm({ ...EMPTY_FORM });
    setIsModalOpen(true);
  };

  const openEdit = (service: any) => {
    setEditingService(service);
    setForm({ ...EMPTY_FORM, ...service, price: service.price || '', discount_price: service.discount_price || '', max_seats: service.max_seats || '' });
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'banner_image' | 'thumbnail') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadFileToCloudinary(file);
      setForm((prev: any) => ({ ...prev, [field]: url }));
      toast.success('Image uploaded!');
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) { toast.error('Permission denied'); return; }
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        price: form.price !== '' ? Number(form.price) : null,
        discount_price: form.discount_price !== '' ? Number(form.discount_price) : null,
        max_seats: !form.unlimited_seats && form.max_seats !== '' ? Number(form.max_seats) : null,
        registration_open: form.registration_open || null,
        registration_close: form.registration_close || null,
      };
      // Remove controlled fields not in DB
      delete payload.unlimited_seats;

      if (editingService) {
        const { error } = await supabase.from('services').update(payload).eq('id', editingService.id);
        if (error) throw error;
        await logAction('UPDATED_SERVICE', `Service: ${form.name}`);
        toast.success('Service updated!');
      } else {
        const { error } = await supabase.from('services').insert({ ...payload, registered_count: 0 });
        if (error) throw error;
        await logAction('CREATED_SERVICE', `Service: ${form.name}`);
        toast.success('Service created!');
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err: any) {
      toast.error('Save failed: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!canEdit) { toast.error('Permission denied'); return; }
    if (!window.confirm(`Delete service "${name}"? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      await logAction('DELETED_SERVICE', `Service: ${name}`);
      toast.success('Service deleted!');
      fetchServices();
    } catch (err: any) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const handleToggleActive = async (service: any) => {
    if (!canEdit) { toast.error('Permission denied'); return; }
    try {
      const { error } = await supabase.from('services').update({ is_active: !service.is_active }).eq('id', service.id);
      if (error) throw error;
      toast.success(`Service ${service.is_active ? 'disabled' : 'enabled'}!`);
      fetchServices();
    } catch (err: any) {
      toast.error('Failed: ' + err.message);
    }
  };

  const handleDuplicate = async (service: any) => {
    if (!canEdit) { toast.error('Permission denied'); return; }
    try {
      const { id: _id, created_at: _ca, updated_at: _ua, registered_count: _rc, ...rest } = service;
      const { error } = await supabase.from('services').insert({
        ...rest, name: `${rest.name} (Copy)`, status: 'draft', is_active: false, registered_count: 0
      });
      if (error) throw error;
      toast.success('Service duplicated as draft!');
      fetchServices();
    } catch (err: any) {
      toast.error('Duplicate failed: ' + err.message);
    }
  };

  const filtered = services.filter(s => {
    const matchSearch = !searchQuery || s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = catFilter === 'All' || s.category === catFilter;
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const totalRevenue = services.reduce((sum, s) => sum + ((s.price || 0) * (s.registered_count || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center space-x-3">
          <Tag className="w-6 h-6 text-orange-burnt animate-pulse" />
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">Student Services Manager</h2>
            <p className="text-white/40 text-xs mt-0.5">Manage all student service registrations and offerings</p>
          </div>
        </div>
        {canEdit && (
          <button onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold rounded-xl shadow-md hover:-translate-y-px transition-all">
            <Plus className="w-4 h-4" /> Add New Service
          </button>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Services', value: services.length, color: 'text-blue-400' },
          { label: 'Active', value: services.filter(s => s.is_active).length, color: 'text-emerald-400' },
          { label: 'Total Registrations', value: services.reduce((sum, s) => sum + (s.registered_count || 0), 0), color: 'text-purple-400' },
          { label: 'Est. Revenue', value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'text-orange-burnt' },
        ].map(stat => (
          <div key={stat.label} className="bg-[#0D1B3E]/40 border border-white/10 rounded-xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">{stat.label}</p>
            <h3 className={`text-2xl font-display font-extrabold ${stat.color}`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-[#0D1B3E]/40 border border-white/10 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 w-4 h-4 text-white/30" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 outline-none focus:border-orange-burnt transition-all" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2.5 bg-[#0D1B3E] border border-white/10 rounded-lg text-sm text-white outline-none focus:border-orange-burnt">
            <option value="all">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          {['All', ...CATEGORIES].map(cat => (
            <button key={cat} onClick={() => setCatFilter(cat)}
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${catFilter === cat ? 'bg-orange-burnt text-white' : 'bg-white/5 text-white/50 border border-white/10 hover:text-white'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-[#0D1B3E]/30 border border-white/10 rounded-xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="p-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-orange-burnt animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-white/40">
            <Tag className="w-10 h-10 text-white/10 mx-auto mb-3" />
            <p>No services match the current filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-white/5 border-b border-white/10">
                <tr className="text-[10px] font-bold uppercase tracking-wider text-white/40">
                  <th className="text-left px-5 py-3.5">Service</th>
                  <th className="text-left px-5 py-3.5">Category</th>
                  <th className="text-left px-5 py-3.5">Price</th>
                  <th className="text-center px-5 py-3.5">Registrations</th>
                  <th className="text-center px-5 py-3.5">Status</th>
                  <th className="text-right px-5 py-3.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(service => (
                  <tr key={service.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {service.thumbnail ? (
                          <img src={service.thumbnail} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-orange-burnt/10 border border-orange-burnt/25 flex items-center justify-center shrink-0">
                            <Tag className="w-4 h-4 text-orange-burnt" />
                          </div>
                        )}
                        <div>
                          <span className="block font-semibold text-white leading-tight">{service.name}</span>
                          <div className="flex gap-1 mt-0.5">
                            {service.is_featured && <span className="text-[8px] font-bold text-amber-400">⭐ Featured</span>}
                            {service.is_popular && <span className="text-[8px] font-bold text-orange-400">🔥 Popular</span>}
                            {service.is_new && <span className="text-[8px] font-bold text-purple-400">✨ New</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-orange-burnt/10 text-orange-burnt border border-orange-burnt/20">{service.category}</span>
                    </td>
                    <td className="px-5 py-3.5 font-display font-bold text-white">
                      {!service.price ? 'Free' : `₹${service.price}`}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-white font-bold">{service.registered_count || 0}</span>
                        {service.max_seats && <span className="text-white/40 text-xs">/ {service.max_seats}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                        service.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        service.status === 'draft' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                        service.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>{service.status}</span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleToggleActive(service)} title={service.is_active ? 'Disable' : 'Enable'}
                          className="w-8 h-8 rounded-lg border border-white/10 hover:border-orange-burnt hover:bg-orange-burnt/10 text-white/50 hover:text-white flex items-center justify-center transition-all">
                          {service.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                        {canEdit && (
                          <>
                            <button onClick={() => openEdit(service)} title="Edit"
                              className="w-8 h-8 rounded-lg border border-white/10 hover:border-blue-400 hover:bg-blue-500/10 text-white/50 hover:text-white flex items-center justify-center transition-all">
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDuplicate(service)} title="Duplicate"
                              className="w-8 h-8 rounded-lg border border-white/10 hover:border-purple-400 hover:bg-purple-500/10 text-white/50 hover:text-white flex items-center justify-center transition-all">
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(service.id, service.name)} title="Delete"
                              className="w-8 h-8 rounded-lg border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 text-red-400 hover:text-red-500 flex items-center justify-center transition-all">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0D1B3E] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#0D1B3E] border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-display font-extrabold text-lg text-white">{editingService ? 'Edit Service' : 'Add New Service'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 text-white/60 hover:text-white flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Service Name *</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                  placeholder="e.g. Annual Cultural Festival Registration"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-burnt transition-colors" />
              </div>

              {/* Category + Status row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Category *</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}
                    className="w-full px-3 py-2.5 bg-[#080F25] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-burnt">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Status *</label>
                  <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
                    className="w-full px-3 py-2.5 bg-[#080F25] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-burnt">
                    {STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  placeholder="Describe this service..." rows={3}
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-burnt resize-none" />
              </div>

              {/* Images */}
              <div className="grid grid-cols-2 gap-4">
                {(['banner_image', 'thumbnail'] as const).map(field => (
                  <div key={field}>
                    <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">{field.replace('_', ' ')}</label>
                    <input type="url" value={form[field]} onChange={e => setForm({...form, [field]: e.target.value})}
                      placeholder="https://... or upload below"
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-orange-burnt mb-1.5" />
                    <label className="flex items-center gap-1.5 text-[9px] font-bold text-orange-burnt/80 cursor-pointer hover:text-orange-burnt transition-colors">
                      <Upload className="w-3 h-3" />
                      {isUploading ? 'Uploading...' : 'Upload File'}
                      <input type="file" accept="image/*" className="hidden" disabled={isUploading}
                        onChange={e => handleImageUpload(e, field)} />
                    </label>
                  </div>
                ))}
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Price (₹)</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})}
                    placeholder="0 = Free"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-burnt" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Discount Price</label>
                  <input type="number" min="0" value={form.discount_price} onChange={e => setForm({...form, discount_price: e.target.value})}
                    placeholder="Optional"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-burnt" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Currency</label>
                  <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})}
                    className="w-full px-3 py-2.5 bg-[#080F25] border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-burnt">
                    <option value="INR">INR ₹</option>
                    <option value="USD">USD $</option>
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Registration Opens</label>
                  <input type="datetime-local" value={form.registration_open} onChange={e => setForm({...form, registration_open: e.target.value})}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-burnt" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1.5">Registration Closes</label>
                  <input type="datetime-local" value={form.registration_close} onChange={e => setForm({...form, registration_close: e.target.value})}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-burnt" />
                </div>
              </div>

              {/* Seats */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <label className="text-[10px] font-bold text-white/40 uppercase tracking-wider">Seats</label>
                  <button type="button" onClick={() => setForm({...form, unlimited_seats: !form.unlimited_seats})}
                    className="flex items-center gap-1.5 text-[9px] font-bold text-orange-burnt">
                    {form.unlimited_seats ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {form.unlimited_seats ? 'Unlimited' : 'Limited'}
                  </button>
                </div>
                {!form.unlimited_seats && (
                  <input type="number" min="1" value={form.max_seats} onChange={e => setForm({...form, max_seats: e.target.value})}
                    placeholder="Maximum seats"
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm outline-none focus:border-orange-burnt" />
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-3">
                {[
                  { key: 'is_featured', label: '⭐ Featured', color: 'amber' },
                  { key: 'is_popular', label: '🔥 Popular', color: 'orange' },
                  { key: 'is_new', label: '✨ New', color: 'purple' },
                  { key: 'allow_waiting_list', label: '📋 Waiting List', color: 'blue' },
                  { key: 'is_active', label: '✅ Active', color: 'emerald' },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={!!(form as any)[key]} onChange={e => setForm({...form, [key]: e.target.checked})}
                      className="w-4 h-4 accent-orange-burnt rounded" />
                    <span className="text-xs font-bold text-white/70">{label}</span>
                  </label>
                ))}
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2 border-t border-white/10">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 border border-white/10 text-white/60 font-display text-xs font-bold rounded-xl hover:bg-white/5 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving || isUploading}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold rounded-xl shadow-md disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
                  {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminServices;
