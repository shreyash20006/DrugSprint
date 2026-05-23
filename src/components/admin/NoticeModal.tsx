import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Megaphone } from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from './Toast';

interface NoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  noticeToEdit?: any;
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
  noticeToEdit,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    pdf_url: '',
    external_link: '',
    is_pinned: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (noticeToEdit) {
      setFormData({
        title: noticeToEdit.title || '',
        description: noticeToEdit.description || '',
        category: noticeToEdit.category || 'General',
        pdf_url: noticeToEdit.pdf_url || '',
        external_link: noticeToEdit.external_link || '',
        is_pinned: noticeToEdit.is_pinned || false,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'General',
        pdf_url: '',
        external_link: '',
        is_pinned: false,
      });
    }
  }, [noticeToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) return;

    // Validate attachment links if they are provided
    const cleanPdf = formData.pdf_url?.trim();
    const cleanLink = formData.external_link?.trim();

    if (cleanPdf) {
      if (!cleanPdf.toLowerCase().startsWith('https://')) {
        toast.warning("⚠️ Attachment PDF link must start with secure https:// protocol!");
        return;
      }
      if (!cleanPdf.toLowerCase().includes('.pdf') && !cleanPdf.toLowerCase().includes('cloudinary.com')) {
        toast.warning("⚠️ Attachment PDF must point to a valid .pdf file!");
        return;
      }
    }

    if (cleanLink) {
      if (!cleanLink.toLowerCase().startsWith('https://')) {
        toast.warning("⚠️ External resource link must start with secure https:// protocol!");
        return;
      }
    }

    setIsSaving(true);
    try {
      const dataPayload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        pdf_url: cleanPdf || null,
        external_link: cleanLink || null,
        is_pinned: formData.is_pinned,
      };

      if (noticeToEdit) {
        // UPDATE record
        const { error } = await supabase
          .from('notices')
          .update(dataPayload)
          .eq('id', noticeToEdit.id);

        if (error) throw error;
        toast.success("✅ Notice updated successfully!");
      } else {
        // INSERT record
        const { error } = await supabase
          .from('notices')
          .insert([dataPayload]);

        if (error) throw error;
        toast.success("✅ Notice added successfully!");
      }

      onRefresh();
      onClose();
    } catch (err: any) {
      toast.error(`❌ Action failed! ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={noticeToEdit ? 'Edit Notice' : 'Add New Notice'}
      icon={<Megaphone className="w-5 h-5" />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-1.5">
            Title *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Mid-Semester Exam Schedule"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm transition-colors bg-white"
          />
        </div>

        {/* Category & Pin top toggle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-1.5">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-white cursor-pointer"
            >
              <option>Academic</option>
              <option>Event</option>
              <option>Alert</option>
              <option>General</option>
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="flex items-center space-x-3 cursor-pointer py-2.5 select-none">
              <input
                type="checkbox"
                checked={formData.is_pinned}
                onChange={(e) => setFormData({ ...formData, is_pinned: e.target.checked })}
                className="rounded border-navy-dark/15 text-orange-burnt focus:ring-orange-burnt w-4 h-4 cursor-pointer"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-navy-dark/70">
                Pin to Top 📌
              </span>
            </label>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-1.5">
            Description *
          </label>
          <textarea
            required
            rows={4}
            placeholder="Provide comprehensive details about the announcement..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-white transition-colors resize-none font-sans"
          />
        </div>

        {/* PDF Link */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-1.5">
            PDF Link (Optional)
          </label>
          <input
            type="url"
            placeholder="e.g. https://drive.google.com/exam-file.pdf"
            value={formData.pdf_url}
            onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm transition-colors bg-white"
          />
        </div>

        {/* External Link */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-1.5">
            External Link (Optional)
          </label>
          <input
            type="url"
            placeholder="e.g. https://google-form-link"
            value={formData.external_link}
            onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm transition-colors bg-white"
          />
        </div>

        {/* Actions Button panel */}
        <div className="flex space-x-3 pt-3 border-t border-navy-dark/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-navy-dark/15 hover:bg-navy-dark/5 text-navy-dark font-display text-sm font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 py-2.5 bg-orange-burnt hover:bg-orange-burnt/95 text-white font-display text-sm font-semibold rounded-lg shadow-md transition-all flex items-center justify-center space-x-1.5"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Notice...</span>
              </>
            ) : (
              <span>Save Notice</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default NoticeModal;
