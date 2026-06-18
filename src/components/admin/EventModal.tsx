import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Loader2, Calendar, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { useToast } from './Toast';
import { logAction } from '../../lib/logger';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  eventToEdit?: any;
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
  eventToEdit,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'event',
    deadline: '',
    prize_info: '',
    google_form_link: '',
    is_active: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const toast = useToast();

  const handleGenerateDescription = async () => {
    if (!formData.name) {
      toast.error('Please enter a Name first to generate a description!');
      return;
    }
    
    setIsGenerating(true);
    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqKey) throw new Error("GROQ API key is missing. Add VITE_GROQ_API_KEY to your .env.local file.");
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a helpful college event coordinator assistant. You write punchy, exciting event descriptions. Output ONLY the description. No intro, no reasoning, no markdown." },
            { role: "user", content: `Write an engaging, exciting 3-sentence description for a college ${formData.type} named "${formData.name}". Make it sound professional yet fun for college students.` }
          ],
          temperature: 0.7,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText);
      }
      
      const result = await response.json();
      const generatedText = result.choices?.[0]?.message?.content?.trim();
      
      if (generatedText) {
        setFormData(prev => ({ ...prev, description: generatedText }));
        toast.success('✨ AI Description Generated!');
      } else {
        throw new Error("No text generated.");
      }
    } catch (err: any) {
      toast.error(`❌ AI Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (eventToEdit) {
      setFormData({
        name: eventToEdit.name || '',
        description: eventToEdit.description || '',
        type: eventToEdit.type || 'event',
        deadline: eventToEdit.deadline || '',
        prize_info: eventToEdit.prize_info || '',
        google_form_link: eventToEdit.google_form_link || '',
        is_active: eventToEdit.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'event',
        deadline: '',
        prize_info: '',
        google_form_link: '',
        is_active: true,
      });
    }
  }, [eventToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return;

    setIsSaving(true);
    try {
      const dataPayload = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        deadline: formData.deadline || null,
        prize_info: formData.prize_info || null,
        google_form_link: formData.google_form_link || null,
        is_active: formData.is_active,
      };

      if (eventToEdit) {
        // UPDATE record
        const { error } = await supabase
          .from('events')
          .update(dataPayload)
          .eq('id', eventToEdit.id);

        if (error) throw error;
        toast.success("✅ Event details updated successfully!");
      } else {
        // INSERT record
        const { error } = await supabase
          .from('events')
          .insert([dataPayload]);

        if (error) throw error;
        logAction('ADDED_EVENT', formData.name);
        toast.success("✅ Event created successfully!");
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
      title={eventToEdit ? 'Edit Event / Competition' : 'Add New Event / Competition'}
      icon={<Calendar className="w-5 h-5" />}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
            Event / Competition Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Pharma Quiz 2026"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 transition-all placeholder:text-white/20 shadow-inner"
          />
        </div>

        {/* Type Toggle */}
        <div className="space-y-2">
          <label className="block text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
            Type *
          </label>
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none group">
              <input
                type="radio"
                name="type"
                value="event"
                checked={formData.type === 'event'}
                onChange={() => setFormData({ ...formData, type: 'event' })}
                className="w-4 h-4 text-orange-burnt focus:ring-orange-burnt/50 border-white/20 bg-white/5 cursor-pointer"
              />
              <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">Timeline Event</span>
            </label>
            <label className="flex items-center space-x-2.5 cursor-pointer select-none group">
              <input
                type="radio"
                name="type"
                value="competition"
                checked={formData.type === 'competition'}
                onChange={() => setFormData({ ...formData, type: 'competition' })}
                className="w-4 h-4 text-orange-burnt focus:ring-orange-burnt/50 border-white/20 bg-white/5 cursor-pointer"
              />
              <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">Student Competition</span>
            </label>
          </div>
        </div>

        {/* Active Toggle */}
        <div>
          <label className="flex items-center space-x-3 cursor-pointer py-1 select-none group">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-white/20 bg-white/5 text-orange-burnt focus:ring-orange-burnt/50 w-4 h-4 cursor-pointer"
            />
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400/80 group-hover:text-emerald-400 transition-colors">
              Mark as Active ✅
            </span>
          </label>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
              Description *
            </label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={isGenerating}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-orange-burnt/10 hover:bg-orange-burnt/20 text-orange-400 border border-orange-burnt/20 transition-all text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              <span>{isGenerating ? 'Generating...' : 'AI Enhance'}</span>
            </button>
          </div>
          <textarea
            required
            rows={4}
            placeholder="Provide comprehensive details about the occurrence..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 transition-all placeholder:text-white/20 shadow-inner resize-none custom-scrollbar"
          />
        </div>

        {/* Target Deadline */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
            Target Deadline / Date {formData.type === 'competition' ? '*' : '(Optional)'}
          </label>
          <input
            type="date"
            required={formData.type === 'competition'}
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 transition-all shadow-inner [color-scheme:dark]"
          />
        </div>

        {/* Prize Info */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
            Prize / Participation Info (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Cash prizes up to ₹5,000 + trophies"
            value={formData.prize_info}
            onChange={(e) => setFormData({ ...formData, prize_info: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 transition-all placeholder:text-white/20 shadow-inner"
          />
        </div>

        {/* Google Form Link */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-white/60 uppercase tracking-widest ml-1">
            Google Form Link (Optional)
          </label>
          <input
            type="url"
            placeholder="e.g. https://forms.gle/XYZ"
            value={formData.google_form_link}
            onChange={(e) => setFormData({ ...formData, google_form_link: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 transition-all placeholder:text-white/20 shadow-inner"
          />
        </div>

        {/* Action Buttons panel */}
        <div className="flex space-x-3 pt-6 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all font-bold text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="flex-1 px-4 py-3.5 bg-gradient-to-r from-orange-burnt to-[#FF8C42] hover:from-[#b04a18] hover:to-orange-burnt text-white rounded-xl transition-all font-bold text-sm disabled:opacity-50 flex justify-center items-center shadow-[0_4px_15px_rgba(214,90,30,0.4)]"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span>Saving Event...</span>
              </>
            ) : (
              <span>Save Event</span>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default EventModal;
