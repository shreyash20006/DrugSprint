import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Download, Calendar, Eye, ExternalLink, X, FileText, AlertTriangle } from 'lucide-react';
import { DNALoader } from './DNALoader';

interface NoticeCardProps {
  notice: {
    id?: string;
    title: string;
    description: string;
    category: string;
    pdf_url?: string | null;
    external_link?: string | null;
    is_pinned?: boolean;
    created_at?: string;
    date?: string;
    linkText?: string;
    linkUrl?: string;
    views?: number;
  };
}

const renderFormattedDescription = (text: string) => {
  if (!text) return null;

  const lines = text.split(/\n/);

  const renderTextWithBold = (str: string) => {
    const parts = str.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, partIdx) => {
      if (partIdx % 2 === 1) {
        return (
          <strong key={partIdx} className="font-extrabold text-[#FFA500] drop-shadow-[0_0_6px_rgba(255,165,0,0.25)]">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-2 text-white/80">
      {lines.map((line, lineIdx) => {
        let trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} className="h-1.5" />;

        // 1. Numbered or standard bullet items (e.g. "1. ", "- ", "• ")
        const bulletMatch = trimmed.match(/^(\d+\.|-|•|\*)\s*(.*)/);
        if (bulletMatch) {
          const [, bullet, content] = bulletMatch;
          return (
            <div key={lineIdx} className="flex items-start space-x-2 pl-1 my-1.5">
              <span className="text-orange-burnt font-extrabold shrink-0 select-none text-xs sm:text-sm mt-0.5">{bullet}</span>
              <span className="text-xs sm:text-sm leading-relaxed font-sans">{renderTextWithBold(content)}</span>
            </div>
          );
        }

        // 2. Inline lists written horizontally (e.g. "1.Item A 2.Item B...")
        const inlineListRegex = /(\d+\.[\s\S]*?)(?=\d+\.|$)/g;
        const inlineMatches = trimmed.match(inlineListRegex);
        if (inlineMatches && inlineMatches.length > 1) {
          return (
            <div key={lineIdx} className="space-y-1.5 my-2 pl-1">
              {inlineMatches.map((item, itemIdx) => {
                const itemMatch = item.trim().match(/^(\d+\.)\s*(.*)/);
                if (itemMatch) {
                  const [, num, content] = itemMatch;
                  return (
                    <div key={itemIdx} className="flex items-start space-x-2">
                      <span className="text-orange-burnt font-extrabold shrink-0 select-none text-xs sm:text-sm mt-0.5">{num}</span>
                      <span className="text-xs sm:text-sm leading-relaxed font-sans">{renderTextWithBold(content)}</span>
                    </div>
                  );
                }
                return (
                  <p key={itemIdx} className="text-xs sm:text-sm leading-relaxed font-sans pl-3 text-white/70">
                    {renderTextWithBold(item)}
                  </p>
                );
              })}
            </div>
          );
        }

        // 3. Style specific visual labels (e.g. "Theme:", "Venue:")
        const metaFieldMatch = trimmed.match(/^([A-Za-z\s|&]+:)\s*(.*)/);
        if (metaFieldMatch) {
          const [, label, content] = metaFieldMatch;
          const importantLabels = ['venue:', 'theme:', 'date:', 'time:', 'dates:', 'key highlights:', 'important dates:', 'note:'];
          if (importantLabels.some(l => label.toLowerCase().includes(l))) {
            return (
              <p key={lineIdx} className="text-xs sm:text-sm leading-relaxed font-sans my-1.5">
                <strong className="text-orange-burnt font-extrabold mr-1.5 border-b border-orange-burnt/10 pb-0.5 select-none">{label}</strong>
                <span>{renderTextWithBold(content)}</span>
              </p>
            );
          }
        }

        return (
          <p key={lineIdx} className="text-xs sm:text-sm leading-relaxed font-sans">
            {renderTextWithBold(trimmed)}
          </p>
        );
      })}
    </div>
  );
};

export const NoticeCard: React.FC<NoticeCardProps> = ({ notice }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(true);

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Academic': return 'bg-blue-500/10 text-blue-400 border-blue-500/25';
      case 'Event':    return 'bg-orange-burnt/15 text-orange-burnt border-orange-burnt/35';
      case 'Alert':    return 'bg-red-500/10 text-red-400 border-red-500/25';
      default:         return 'bg-gold-accent/15 text-gold-accent border-gold-accent/35';
    }
  };

  const pdfUrl = notice.pdf_url || (notice.linkUrl?.toLowerCase().endsWith('.pdf') ? notice.linkUrl : null);
  const externalLink = notice.external_link || (!notice.linkUrl?.toLowerCase().endsWith('.pdf') ? notice.linkUrl : null);

  const formattedDate = notice.created_at
    ? new Date(notice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : notice.date || 'No Date';

  const openPreview = async () => {
    setEmbedFailed(false);
    setIsPdfLoading(true);
    setIsPreviewOpen(true);
    
    if (notice.id) {
      try {
        await supabase.rpc('increment_notice_views', { notice_id: notice.id });
      } catch (err) {
        // Ignore view increment errors silently
      }
    }
  };

  const handleExternalLink = async () => {
    if (notice.id) {
      try {
        await supabase.rpc('increment_notice_views', { notice_id: notice.id });
      } catch (err) {
        // Ignore view increment errors silently
      }
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        whileHover={{ y: -5 }}
        className="glass-panel glow-card rounded-2xl border border-orange-burnt/25 p-6 relative flex flex-col justify-between bg-[#0D1B3E]/85 backdrop-blur-[16px] shadow-[0_8px_32px_rgba(5,11,24,0.4)]"
      >
        <div>
          {/* Header Badge & Pin */}
          <div className="flex items-center justify-between mb-4">
            {notice.is_pinned ? (
              <div className="flex items-center space-x-1.5 text-orange-burnt animate-pulse">
                <Pin className="w-4 h-4 fill-current transform -rotate-45" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-orange-burnt">Pinned</span>
              </div>
            ) : <div />}
            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryStyles(notice.category)}`}>
              {notice.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display font-bold text-lg text-white mb-2 leading-snug">
            {notice.title}
          </h3>

          {/* Date & Views */}
          <div className="flex items-center space-x-4 text-white/45 text-xs mb-4 font-sans">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-burnt shrink-0" />
              <span>{formattedDate}</span>
            </div>
            {(notice.views !== undefined) && (
              <div className="flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-orange-burnt shrink-0" />
                <span>{notice.views} views</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="text-white/70 text-sm leading-relaxed mb-6 font-sans whitespace-pre-wrap break-words">
            {renderFormattedDescription(notice.description)}
          </div>
        </div>

        {/* Action Buttons with high fidelity glass styles */}
        <div className="space-y-2 pt-4 border-t border-white/5 w-full">
          {pdfUrl && (
            <div className="grid grid-cols-3 gap-2 w-full">
              <button
                onClick={openPreview}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl font-display text-[10px] sm:text-xs font-bold bg-[#0F1E42] hover:bg-orange-burnt text-white transition-all shadow-md border border-white/5 hover:border-transparent active:scale-98"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl font-display text-[10px] sm:text-xs font-bold bg-white/5 hover:bg-white/10 text-white transition-all shadow-md border border-white/5 active:scale-98"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </a>
              <a
                href={pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1.5 py-2.5 px-2 rounded-xl font-display text-[10px] sm:text-xs font-bold bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white transition-all shadow-md active:scale-98"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Get</span>
              </a>
            </div>
          )}

          {externalLink && !pdfUrl && (
            <a
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleExternalLink}
              className="flex items-center justify-center space-x-2 w-full py-3 px-4 rounded-xl font-display text-xs sm:text-sm font-bold bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white shadow-lg active:scale-98 transition-all"
            >
              <span>{notice.linkText || 'Open External Resource'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </motion.div>

      {/* ── PDF Preview Modal (Upgraded with Glassmorphism Dark Layout) ── */}
      <AnimatePresence>
        {isPreviewOpen && pdfUrl && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            {/* Backdrop click closes */}
            <div onClick={() => setIsPreviewOpen(false)} className="absolute inset-0 cursor-default" />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative bg-[#080F25] w-full max-w-4xl h-[88vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10 border border-white/10"
            >
              {/* Modal Header in sleek dark-slate */}
              <div className="bg-[#050B18] text-white px-5 py-4 flex items-center justify-between shrink-0 border-b border-white/5">
                <div className="flex items-center space-x-2 min-w-0">
                  <FileText className="w-4 h-4 text-orange-burnt shrink-0" />
                  <h4 className="font-display font-extrabold text-sm truncate">{notice.title}</h4>
                </div>
                <div className="flex items-center space-x-2 shrink-0 ml-4">
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all border border-white/5 active:scale-95"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open</span>
                  </a>
                  <a
                    href={pdfUrl}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs font-bold transition-all active:scale-95 shadow-md shadow-orange-burnt/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                  <button
                    onClick={() => setIsPreviewOpen(false)}
                    className="p-2 rounded-xl hover:bg-white/5 text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* PDF Viewer Body */}
              <div className="flex-grow relative bg-[#050B18] overflow-hidden">
                {/* Loading spinner */}
                {isPdfLoading && !embedFailed && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050B18] z-10">
                    <div className="mb-4">
                      <DNALoader />
                    </div>
                    <span className="text-xs font-bold tracking-wider font-display uppercase text-white/50">
                      Loading Document PDF...
                    </span>
                  </div>
                )}

                {/* Native browser PDF embed */}
                {!embedFailed ? (
                  <embed
                    key={pdfUrl}
                    src={pdfUrl}
                    type="application/pdf"
                    className="w-full h-full border-none"
                    onLoad={() => setIsPdfLoading(false)}
                    onError={() => { setEmbedFailed(true); setIsPdfLoading(false); }}
                  />
                ) : (
                  /* Fallback UI when browser blocks inline embed */
                  <div className="flex flex-col items-center justify-center h-full text-center px-8 bg-[#050B18]">
                    <div className="w-16 h-16 rounded-2xl bg-orange-burnt/15 flex items-center justify-center mb-4 border border-orange-burnt/25">
                      <AlertTriangle className="w-8 h-8 text-orange-burnt animate-bounce" />
                    </div>
                    <h4 className="font-display font-extrabold text-white text-lg mb-2">
                      Inline Preview Blocked
                    </h4>
                    <p className="text-white/50 text-sm font-sans max-w-sm leading-relaxed mb-6">
                      Your browser's security blocks loading PDFs in small frames. You can open or download the PDF document directly using the buttons below.
                    </p>
                    <div className="flex items-center space-x-3">
                      <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-display text-sm font-bold shadow-md transition-all active:scale-95 border border-white/5"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>Open in New Tab</span>
                      </a>
                      <a
                        href={pdfUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-sm font-bold shadow-md transition-all active:scale-95 border border-white/5"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(NoticeCard);
