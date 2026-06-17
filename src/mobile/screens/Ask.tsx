import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, HelpCircle, Sparkles, Loader2 } from 'lucide-react';
import { councilMembers } from '../../data/council';
import { supabase } from '../../lib/supabase';
import { useStudentAuth } from '../../lib/StudentAuthProvider';
import { sendQuestionEmail } from '../../lib/brevo';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How long for a response?",
    answer: "You can expect an official response from the directed council member or executive committee within 3-5 working days depending on the nature of the inquiry."
  },
  {
    question: "Can I ask anonymously?",
    answer: "Currently, providing your name and course year is required so we can verify your student status and contact you directly with a resolution."
  },
  {
    question: "What topics can I ask about?",
    answer: "You can submit queries regarding general college life, B.Pharm academic timetables, library study hours, anti-ragging compliance, cultural events, or sports week rosters."
  },
  {
    question: "How will I get the reply?",
    answer: "The Student Council will contact you directly via your registered college email or phone number. Approved replies are also recorded in our secure administration console."
  },
  {
    question: "Can I suggest events?",
    answer: "Yes, absolutely! We welcome student feedback and campus suggestions. Feel free to use this question form and direct your proposal to our Events Coordinator (Nayan Thote)."
  }
];

export const Ask: React.FC = () => {
  const [searchParams] = useSearchParams();
  const defaultTo = searchParams.get('to') || 'General Council';
  
  const { studentProfile } = useStudentAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    year: 'B.Pharm I Year',
    directedTo: 'General Council',
    question: ''
  });

  useEffect(() => {
    if (studentProfile) {
      setFormData(prev => ({
        ...prev,
        name: studentProfile.full_name || prev.name,
        email: studentProfile.email || prev.email,
        year: studentProfile.year || prev.year
      }));
    }
  }, [studentProfile]);

  useEffect(() => {
    if (defaultTo) {
      setFormData((prev) => ({ ...prev, directedTo: defaultTo }));
    }
  }, [defaultTo]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isGeneratingAiAnswer, setIsGeneratingAiAnswer] = useState(false);

  const handleAiSuggest = async () => {
    if (!formData.question || formData.question.length < 10) {
      alert('Please enter a detailed question first so I can understand what you need!');
      return;
    }
    
    setIsGeneratingAiAnswer(true);
    setAiAnswer(null);
    try {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY;
      if (!groqKey) {
        setAiAnswer("AI is not configured. Please submit your question directly to the council.");
        setIsGeneratingAiAnswer(false);
        return;
      }
      
      const faqContext = faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join("\n\n");
      
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: `You are the TGPCOP Council AI Assistant. Answer the student's question based ONLY on this context:\n\n${faqContext}\n\nIf the answer is not in the context, say "I couldn't find an exact answer. Please submit your question to the council for a direct reply." Keep answers short and friendly. No markdown.` },
            { role: "user", content: formData.question }
          ],
          temperature: 0.3,
          max_tokens: 150
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed`);
      }
      
      const result = await response.json();
      const generatedText = result.choices?.[0]?.message?.content?.trim();
      setAiAnswer(generatedText || "Sorry, I couldn't process that. Please submit your question.");
    } catch (err: any) {
      setAiAnswer("AI service is currently unavailable. Please submit your question to the council.");
    } finally {
      setIsGeneratingAiAnswer(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.question) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('questions').insert([
        {
          student_name: formData.name,
          student_email: formData.email,
          student_year: formData.year,
          directed_to: formData.directedTo,
          question_text: formData.question,
          status: 'pending'
        }
      ]);

      if (error) throw error;

      const targetedMember = councilMembers.find((m) => m.name === formData.directedTo);
      const memberEmail = targetedMember ? targetedMember.email : "sb108750@gmail.com";

      await sendQuestionEmail({
        studentName: formData.name,
        studentYear: formData.year,
        directedTo: formData.directedTo,
        questionText: formData.question,
        memberEmail: memberEmail
      });

      setIsSubmitted(true);

      setTimeout(() => {
        setIsSubmitted(false);
        setFormData(prev => ({
          ...prev,
          question: ''
        }));
      }, 3000);

    } catch (err: any) {
      alert(`Error submitting inquiry: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Inquiries & Support
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Ask the Council
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Submit queries regarding schedules, library study hours, anti-ragging compliance, fests, or academic timetables directly.
        </p>
      </section>

      {/* Form Container */}
      <div className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-burnt/5 rounded-bl-full pointer-events-none" />
        
        <AnimatePresence mode="wait">
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                  Your Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/20"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                  Your Email Address
                </label>
                <input
                  type="email"
                  required
                  readOnly={!!studentProfile}
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className={`w-full border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none transition-colors placeholder-white/20 ${
                    studentProfile ? 'bg-white/5 cursor-not-allowed text-white/45' : 'bg-[#050B18]/60 focus:border-orange-burnt'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                    Your Year
                  </label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full bg-[#050B18]/80 border border-white/10 rounded-xl px-3 py-3 text-xs text-white outline-none focus:border-orange-burnt appearance-none"
                  >
                    <option>B.Pharm I Year</option>
                    <option>B.Pharm II Year</option>
                    <option>B.Pharm III Year</option>
                    <option>B.Pharm IV Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50 mb-1 pl-0.5">
                    Direct To
                  </label>
                  <select
                    value={formData.directedTo}
                    onChange={(e) => setFormData({ ...formData, directedTo: e.target.value })}
                    className="w-full bg-[#050B18]/80 border border-white/10 rounded-xl px-3 py-3 text-xs text-white outline-none focus:border-orange-burnt appearance-none"
                  >
                    <option value="General Council">General Council</option>
                    {councilMembers.map((m) => (
                      <option key={m.name} value={m.name}>
                        {m.role.split(' ')[0]} - {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 pl-0.5">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-white/50">
                    Your Inquiry / Feedback
                  </label>
                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={isGeneratingAiAnswer}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-all text-[9px] font-bold uppercase tracking-wider"
                  >
                    {isGeneratingAiAnswer ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                    <span>AI Quick Answer</span>
                  </button>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Provide details about your query..."
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  className="w-full bg-[#050B18]/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt resize-none transition-colors placeholder-white/20"
                />

                <AnimatePresence>
                  {aiAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="mt-3 p-3.5 bg-purple-500/5 border border-purple-500/15 rounded-xl relative text-[11px] leading-relaxed text-white/80 font-sans"
                    >
                      <button
                        type="button"
                        onClick={() => setAiAnswer(null)}
                        className="absolute top-1.5 right-2.5 text-purple-400/40 hover:text-purple-400 text-sm"
                      >
                        &times;
                      </button>
                      <span className="block text-[9px] font-bold uppercase tracking-wider text-purple-400 mb-0.5">AI Auto-Response</span>
                      {aiAnswer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Inquiry...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Inquiry</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-8 text-center"
            >
              <span className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center justify-center text-emerald-400 text-xl mb-3 animate-bounce">
                ✓
              </span>
              <h4 className="font-display font-bold text-white text-base">Inquiry Submitted!</h4>
              <p className="text-white/60 text-xs font-sans mt-1 max-w-xs leading-relaxed">
                Thank you for contacting the Council. Your grievance has been recorded and directed successfully.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* FAQ Accordion */}
      <section className="space-y-3">
        <h3 className="font-display font-extrabold text-sm text-white pl-0.5">Campus FAQs</h3>
        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/5 rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex items-center justify-between font-display font-bold text-xs text-white hover:text-orange-burnt transition-colors outline-none"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-orange-burnt/70 transition-transform ${isOpen ? 'transform rotate-180 text-orange-burnt' : ''}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                    >
                      <div className="px-4 pb-4 pt-1 text-xs text-white/60 leading-relaxed font-sans border-t border-white/5 bg-[#050B18]/20">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Ask;
