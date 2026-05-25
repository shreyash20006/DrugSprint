import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, ChevronDown, HelpCircle, MessageSquare } from 'lucide-react';
import { councilMembers } from '../data/council';
import { supabase } from '../lib/supabase';
import { useStudentAuth } from '../lib/StudentAuthProvider';
import { sendQuestionEmail } from '../lib/brevo';
import { DNALoader } from './DNALoader';

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

export const AskForm: React.FC = () => {
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

  // Pre-fill from student auth if available
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

  // Pre-fill 'directedTo' if the search parameter changes
  useEffect(() => {
    if (defaultTo) {
      setFormData((prev) => ({ ...prev, directedTo: defaultTo }));
    }
  }, [defaultTo]);

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.question) return;

    setIsSubmitting(true);
    try {
      // 1. Insert query into Supabase
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

      // Find targeted member's email
      const targetedMember = councilMembers.find((m) => m.name === formData.directedTo);
      const memberEmail = targetedMember ? targetedMember.email : "sb108750@gmail.com";

      // 2. Trigger Brevo SMTP email alert
      await sendQuestionEmail({
        studentName: formData.name,
        studentYear: formData.year,
        directedTo: formData.directedTo,
        questionText: formData.question,
        memberEmail: memberEmail
      });

      setIsSubmitted(true);

      // 3. Reset form after 3 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          name: '',
          email: '',
          year: 'B.Pharm I Year',
          directedTo: 'General Council',
          question: ''
        });
      }, 3000);

    } catch (err: any) {
      alert(`Error submitting inquiry: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 max-w-7xl mx-auto px-4 py-8">
      
      {/* 1. LEFT SIDE: Ask the Council Form Card (lg:span-7) */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        className="lg:col-span-7"
      >
        <div className="glass-panel rounded-2xl shadow-xl p-8 relative overflow-hidden border border-orange-burnt/25 bg-[#0D1B3E]/85 backdrop-blur-[16px] shadow-[0_8px_32px_rgba(5,11,24,0.5)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-burnt/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-burnt/10 border border-orange-burnt/20 flex items-center justify-center text-orange-burnt">
              <MessageSquare className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-display font-bold text-2xl text-white">Send Your Inquiry</h2>
              <p className="text-xs text-white/60">Your submissions are reviewed directly by the student council leadership.</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.form
                key="ask-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-orange-burnt/20 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt bg-[#0F1E42]/60 outline-none text-white text-sm sm:text-base transition-colors shadow-inner font-sans placeholder-white/30"
                  />
                </div>

                {/* Student Email */}
                <div>
                  <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Your Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    required
                    readOnly={!!studentProfile}
                    placeholder="your.email@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-3 rounded-xl border border-orange-burnt/20 outline-none text-white text-sm sm:text-base transition-colors shadow-inner font-sans placeholder-white/30 ${
                      studentProfile 
                        ? 'bg-white/5 cursor-not-allowed text-white/60' 
                        : 'bg-[#0F1E42]/60 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt'
                    }`}
                  />
                  {studentProfile && (
                    <p className="text-[10px] text-white/40 mt-1">
                      Using your registered Google Login email. Questions asked will appear in your Student Profile.
                    </p>
                  )}
                </div>

                {/* Academic Year dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="year" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Your Year
                    </label>
                    <select
                      id="year"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-orange-burnt/20 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt bg-[#0F1E42]/60 outline-none text-white text-sm sm:text-base transition-colors shadow-inner font-sans"
                    >
                      <option className="bg-[#0D1B3E] text-white">B.Pharm I Year</option>
                      <option className="bg-[#0D1B3E] text-white">B.Pharm II Year</option>
                      <option className="bg-[#0D1B3E] text-white">B.Pharm III Year</option>
                      <option className="bg-[#0D1B3E] text-white">B.Pharm IV Year</option>
                    </select>
                  </div>

                  {/* Direct Question to dropdown */}
                  <div>
                    <label htmlFor="directedTo" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                      Direct Question To
                    </label>
                    <select
                      id="directedTo"
                      value={formData.directedTo}
                      onChange={(e) => setFormData({ ...formData, directedTo: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-orange-burnt/20 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt bg-[#0F1E42]/60 outline-none text-white text-sm sm:text-base transition-colors shadow-inner font-sans"
                    >
                      <option className="bg-[#0D1B3E] text-white" value="General Council">General Council</option>
                      {councilMembers.map((member) => (
                        <option className="bg-[#0D1B3E] text-white" key={member.name} value={member.name}>
                          {member.role.split(' ')[0]} - {member.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Question Text Area */}
                <div>
                  <label htmlFor="question" className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                    Your Question / Grievance
                  </label>
                  <textarea
                    id="question"
                    required
                    rows={5}
                    placeholder="Provide detailed information regarding your query or feedback..."
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-orange-burnt/20 focus:border-orange-burnt focus:ring-1 focus:ring-orange-burnt bg-[#0F1E42]/60 outline-none text-white text-sm sm:text-base transition-colors resize-none shadow-inner font-sans placeholder-white/30"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group flex items-center justify-center space-x-2 w-full py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:shadow-orange-burnt/25 hover:-translate-y-0.5 text-white font-display font-bold uppercase tracking-wider rounded-xl text-sm sm:text-base shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/5"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-3">
                      <DNALoader />
                      <span>Submitting Question...</span>
                    </div>
                  ) : (
                    <>
                      <span>Submit Question</span>
                      <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-bounce" />
                <h3 className="font-display font-bold text-2xl text-white mb-2">Submitted Successfully!</h3>
                <p className="text-white/75 text-sm sm:text-base max-w-sm mb-4">
                  ✅ Question submitted successfully! The council will get back to you soon.
                </p>
                <span className="text-xs text-white/40 italic">Resetting form...</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* 2. RIGHT SIDE: FAQs Section (lg:span-5) */}
      <div className="lg:col-span-5 flex flex-col justify-start space-y-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-burnt/10 border border-orange-burnt/20 flex items-center justify-center text-orange-burnt shrink-0">
            <HelpCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="font-display font-bold text-2xl text-white">Campus FAQs</h2>
            <p className="text-xs text-white/60">Find rapid answers to standard college queries.</p>
          </div>
        </div>

        {/* FAQs Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="bg-[#0D1B3E]/85 backdrop-blur-[16px] rounded-xl border border-orange-burnt/20 overflow-hidden transition-all duration-300 hover:border-orange-burnt/40 shadow-[0_4px_24px_rgba(5,11,24,0.3)]"
              >
                {/* Accordion header button */}
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-5 text-left flex items-center justify-between font-display font-bold text-sm sm:text-base text-white hover:text-orange-burnt transition-colors outline-none"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-orange-burnt/70 transition-transform duration-300 ${
                      isOpen ? 'transform rotate-180 text-orange-burnt' : ''
                    }`}
                  />
                </button>

                {/* Accordion expanding body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div className="px-5 pb-5 pt-1 text-sm text-white/70 leading-relaxed font-sans border-t border-orange-burnt/10 bg-[#0F1E42]/30">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AskForm;
