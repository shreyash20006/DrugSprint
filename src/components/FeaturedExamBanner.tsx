import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, AlertTriangle, Download, X, Eye } from 'lucide-react';

export const FeaturedExamBanner = () => {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const targetDate = new Date('2026-06-18T10:00:00+05:30');
  const endDate = new Date('2026-07-04T00:00:00+05:30'); // Keep until July 3

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          d: Math.floor(difference / (1000 * 60 * 60 * 24)),
          h: Math.floor((difference / (1000 * 60 * 60)) % 24),
          m: Math.floor((difference / 1000 / 60) % 60),
          s: Math.floor((difference / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (new Date() > endDate) return null;

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-[#0D1B3E]/90 to-navy-dark border border-orange-burnt/40 rounded-2xl p-5 shadow-[0_8px_32px_rgba(224,109,43,0.15)] relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-burnt/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-orange-burnt/20 transition-all duration-700" />
        
        <div className="flex flex-col gap-5 items-start relative z-10">
          <div className="w-full space-y-3">
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5 bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Important Academic Update</span>
              </span>
              <span className="flex items-center space-x-1.5 bg-orange-burnt/10 text-orange-burnt border border-orange-burnt/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                <Calendar className="w-3.5 h-3.5" />
                <span>Examination Schedule</span>
              </span>
            </div>

            <h2 className="text-lg font-display font-extrabold text-white leading-tight">
              B.Pharm Supplementary Examination Summer 2026
            </h2>
            
            <p className="text-white/70 text-xs font-sans">
              Revised Supplementary Semester Examination Summer 2026.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Organization</span>
                <p className="text-sm text-white font-medium">DBATU, Lonere</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Duration</span>
                <p className="text-sm text-white font-medium">18 June - 03 July 2026</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Exam Timings</span>
                <p className="text-sm text-white font-medium flex items-center">
                  <Clock className="w-4 h-4 text-orange-burnt mr-1.5" />
                  10:00 AM – 1:00 PM
                </p>
              </div>
            </div>
          </div>

          <div className="w-full bg-[#050B18]/50 border border-white/5 p-4 rounded-xl shrink-0 flex flex-col items-center">
            {timeLeft ? (
              <>
                <span className="text-[10px] text-white/50 uppercase font-bold tracking-widest mb-3">Exams Starting In</span>
                <div className="flex items-center space-x-3 mb-5">
                  {[
                    { label: 'Days', value: timeLeft.d },
                    { label: 'Hrs', value: timeLeft.h },
                    { label: 'Min', value: timeLeft.m },
                    { label: 'Sec', value: timeLeft.s }
                  ].map((t, i) => (
                    <div key={i} className="flex flex-col items-center">
                      <div className="bg-white/5 border border-white/10 w-12 h-12 rounded-lg flex items-center justify-center text-lg font-display font-bold text-orange-burnt shadow-inner">
                        {t.value.toString().padStart(2, '0')}
                      </div>
                      <span className="text-[9px] text-white/40 uppercase mt-1.5 font-bold">{t.label}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-orange-burnt font-display font-bold text-lg mb-4 text-center px-4">Exams are currently ongoing</div>
            )}

            <div className="flex flex-col gap-2 w-full">
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center space-x-2 hover:scale-102 active:scale-95 transition-all shadow-lg shadow-orange-burnt/20"
              >
                <Eye className="w-4 h-4" />
                <span>View Timetable</span>
              </button>
              <button 
                onClick={() => {
                  alert("Download link will be active once the official PDF is uploaded to the server storage.");
                }}
                className="w-full bg-white/5 border border-white/10 text-white hover:text-orange-burnt hover:border-orange-burnt/30 text-xs font-bold uppercase tracking-wider py-2.5 rounded-xl flex items-center justify-center space-x-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Schedule</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050B18]/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-navy-dark border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-[#080F25]">
                <h3 className="text-white font-display font-bold">DBATU Supplementary Timetable 2026</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/50 hover:text-white transition-colors p-1 bg-white/5 rounded-lg hover:bg-white/10">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-[#050B18]">
                <div className="space-y-6 text-white font-sans text-sm">
                  <div className="p-4 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl text-orange-burnt flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-xs">
                      Official PDF document placeholder. Below is the parsed text version of the schedule for quick reference.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { date: '18 June 2026', items: ['Sem III – Pharmaceutical Organic Chemistry II', 'Sem VII – Instrumental Methods of Analysis'] },
                      { date: '19 June 2026', items: ['Sem I – Human Anatomy and Physiology I', 'Sem V – Medicinal Chemistry II'] },
                      { date: '20 June 2026', items: ['Sem III – Physical Pharmaceutics I', 'Sem VII – Industrial Pharmacy II'] },
                      { date: '22 June 2026', items: ['Sem V – Industrial Pharmacy I'] },
                      { date: '23 June 2026', items: ['Sem III – Pharmaceutical Microbiology', 'Sem VII – Pharmacy Practice'] },
                      { date: '24 June 2026', items: ['Sem I – Pharmaceutics I', 'Sem V – Pharmacology II'] },
                      { date: '25 June 2026', items: ['Sem III – Pharmaceutical Engineering', 'Sem VII – Novel Drug Delivery System'] },
                      { date: '29 June 2026', items: ['Sem I – Pharmaceutical Inorganic Chemistry', 'Sem V – Pharmacognosy and Phytochemistry II'] },
                      { date: '30 June 2026', items: ['Sem V – Pharmaceutical Jurisprudence'] },
                      { date: '01 July 2026', items: ['Sem I – Pharmaceutical Analysis I'] },
                      { date: '02 July 2026', items: ['Sem I – Communication Skills'] },
                      { date: '03 July 2026', items: ['Sem I – Remedial Biology', 'Sem I – Remedial Mathematics'] },
                    ].map((day, idx) => (
                      <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-orange-burnt/30 transition-colors">
                        <h4 className="font-bold text-orange-burnt mb-3 flex items-center space-x-2 border-b border-white/5 pb-2">
                          <Calendar className="w-4 h-4" /> <span>{day.date}</span>
                        </h4>
                        <ul className="list-disc list-outside ml-4 space-y-1.5 text-white/70 text-xs">
                          {day.items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
