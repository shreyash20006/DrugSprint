import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Download, Calendar, Eye, ExternalLink, X, Loader2 } from 'lucide-react';

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
    date?: string; // Static fallback
    linkText?: string;
    linkUrl?: string;
  };
}

export const NoticeCard: React.FC<NoticeCardProps> = ({ notice }) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(true);

  // Category-specific styles
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Academic':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'Event':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'Alert':
        return 'bg-red-50 text-red-600 border-red-200';
      case 'General':
      default:
        return 'bg-amber-50 text-amber-600 border-amber-200';
    }
  };

  const pdfUrl = notice.pdf_url || (notice.linkUrl?.toLowerCase().endsWith('.pdf') ? notice.linkUrl : null);
  const externalLink = notice.external_link || (!notice.linkUrl?.toLowerCase().endsWith('.pdf') ? notice.linkUrl : null);

  const formattedDate = notice.created_at
    ? new Date(notice.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : notice.date || 'No Date';

  return (
    <>
      <motion.div
        layout // Framer Motion layout transition on list filter rearranging!
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        whileHover={{ y: -5, boxShadow: '0 15px 30px -10px rgba(0, 0, 0, 0.1)' }}
        className="bg-white rounded-xl shadow-sm border border-navy-dark/5 p-6 relative flex flex-col justify-between"
      >
        <div>
          {/* Header Badging & Pin */}
          <div className="flex items-center justify-between mb-4">
            {notice.is_pinned ? (
              <div className="flex items-center space-x-1.5 text-orange-burnt">
                <Pin className="w-5 h-5 fill-current transform -rotate-45" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-navy-dark/40">Pinned</span>
              </div>
            ) : (
              <div />
            )}
            
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryStyles(notice.category)}`}>
              {notice.category}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-display font-bold text-lg sm:text-xl text-navy-dark mb-2 leading-snug">
            {notice.title}
          </h3>

          {/* Date Row */}
          <div className="flex items-center space-x-1.5 text-navy-dark/50 text-xs mb-4">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>

          {/* Description Body */}
          <p className="text-navy-dark/85 text-sm sm:text-base leading-relaxed mb-6 font-sans">
            {notice.description}
          </p>
        </div>

        {/* Action Buttons Panel */}
        <div className="space-y-2 pt-2 border-t border-navy-dark/5 w-full">
          {pdfUrl && (
            <div className="grid grid-cols-3 gap-2 w-full">
              {/* Preview PDF */}
              <button
                onClick={() => {
                  setIsPdfLoading(true);
                  setIsPreviewOpen(true);
                }}
                className="flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg font-display text-xs font-bold bg-navy-dark hover:bg-orange-burnt text-white transition-colors shadow-sm"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>

              {/* Open PDF */}
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg font-display text-xs font-bold border border-navy-dark/15 hover:border-orange-burnt text-navy-dark hover:text-orange-burnt transition-colors bg-white shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open</span>
              </a>

              {/* Download PDF */}
              <a
                href={pdfUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center space-x-1.5 py-2 px-2 rounded-lg font-display text-xs font-bold bg-orange-burnt hover:bg-orange-burnt/90 text-white transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            </div>
          )}

          {externalLink && !pdfUrl && (
            <a
              href={externalLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center space-x-2 w-full py-2.5 px-4 rounded-lg font-display text-sm font-semibold bg-navy-dark hover:bg-orange-burnt text-white shadow-md transition-colors"
            >
              <span>{notice.linkText || 'Open External Resource'}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </motion.div>

      {/* PDF View Modal Overlay */}
      <AnimatePresence>
        {isPreviewOpen && pdfUrl && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
            {/* Backdrop Click Closes Modal */}
            <div 
              onClick={() => setIsPreviewOpen(false)}
              className="absolute inset-0 cursor-default"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-white w-full max-w-4xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl flex flex-col z-10"
            >
              {/* Header */}
              <div className="bg-navy-dark text-white p-4.5 flex items-center justify-between shrink-0 border-b border-white/5">
                <h4 className="font-display font-extrabold text-sm sm:text-base truncate pr-4">
                  📄 Notice Document Preview: {notice.title}
                </h4>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors"
                  aria-label="Close document preview"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PDF Viewer Frame */}
              <div className="flex-grow w-full h-full relative bg-gray-light">
                {isPdfLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-navy-dark/60 bg-white">
                    <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-2" />
                    <span className="text-xs font-semibold tracking-wider font-display uppercase">
                      Loading Document Preview...
                    </span>
                  </div>
                )}
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(pdfUrl)}&embedded=true`}
                  className="w-full h-full border-none"
                  onLoad={() => setIsPdfLoading(false)}
                  title="PDF Notice Document Preview"
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default NoticeCard;
