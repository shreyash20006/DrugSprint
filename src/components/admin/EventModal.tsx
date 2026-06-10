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
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-1.5">
            Event / Competition Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Pharma Quiz 2026"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-white transition-colors"
          />
        </div>

        {/* Type Toggle (Radio buttons as requested: ○ Event  ● Competition) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-2.5">
            Type *
          </label>
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="radio"
                name="type"
                value="event"
                checked={formData.type === 'event'}
                onChange={() => setFormData({ ...formData, type: 'event' })}
                className="w-4 h-4 text-orange-burnt focus:ring-orange-burnt border-navy-dark/20 cursor-pointer"
              />
              <span className="text-sm font-semibold text-navy-dark">Timeline Event</span>
            </label>
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="radio"
                name="type"
                value="competition"
                checked={formData.type === 'competition'}
                onChange={() => setFormData({ ...formData, type: 'competition' })}
                className="w-4 h-4 text-orange-burnt focus:ring-orange-burnt border-navy-dark/20 cursor-pointer"
              />
              <span className="text-sm font-semibold text-navy-dark">Student Competition</span>
            </label>
          </div>
        </div>

        {/* Active Toggle */}
        <div>
          <label className="flex items-center space-x-3 cursor-pointer py-1 select-none">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-navy-dark/15 text-orange-burnt focus:ring-orange-burnt w-4 h-4 cursor-pointer"
            />
            <span className="text-xs font-bold uppercase tracking-wider text-navy-dark/70">
              Mark as Active ✅
            </span>
          </label>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70">
              Description *
            </label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={isGenerating}
              className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 border border-purple-500/20 transition-all text-[10px] font-bold uppercase tracking-wider disabled:opacity-50"
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
            className="w-full px-3 py-2 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-white transition-colors resize-none font-sans"
          />
        </div>

        {/* Target Deadline */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-1.5">
            Target Deadline / Date {formData.type === 'competition' ? '*' : '(Optional)'}
          </label>
          <input
            type="date"
            required={formData.type === 'competition'}
            value={formData.deadline}
            onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-white transition-colors"
          />
        </div>

        {/* Prize Info */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-1.5">
            Prize / Participation Info (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Cash prizes up to ₹5,000 + trophies"
            value={formData.prize_info}
            onChange={(e) => setFormData({ ...formData, prize_info: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-white transition-colors"
          />
        </div>

        {/* Google Form Link */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-navy-dark/70 mb-1.5">
            Google Form Link (Optional)
          </label>
          <input
            type="url"
            placeholder="e.g. https://forms.gle/XYZ"
            value={formData.google_form_link}
            onChange={(e) => setFormData({ ...formData, google_form_link: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-navy-dark/15 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt outline-none text-sm bg-white transition-colors"
          />
        </div>

        {/* Action Buttons panel */}
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
