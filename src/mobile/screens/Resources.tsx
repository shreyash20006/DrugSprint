import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Star, ShoppingBag, 
  ExternalLink, X, BookMarked, Layers 
} from 'lucide-react';

interface StudyBook {
  id: string;
  title: string;
  subject: string;
  price: string;
  year: string;
  image: string;
  rating: string;
  pages: number;
  checkoutUrl: string;
  descriptionHtml?: string;
}

export const Resources: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedBook, setSelectedBook] = useState<StudyBook | null>(null);

  // Exact study books list cloned from Store.tsx to ensure database consistency
  const studyBooks: StudyBook[] = [
    {
      id: '1',
      title: `Human Anatomy & Physiology II Handwritten Notes | B.Pharm 1st Year 2nd Semester | TGPCOP NOTES`,
      subject: `Anatomy PDF`,
      price: '₹149',
      year: 'First Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-14at6.55.57PM.jpg?v=1778765210',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/human-anatomy-physiology-ii-b-pharm-sem-2-tgpcop',
      descriptionHtml: "<p>TGPCOP NOTES presents premium handwritten Human Anatomy &amp; Physiology II notes specially designed for B.Pharm 1st Year 2nd Semester students.</p>\n<p>Prepared in an easy revision format with colorful diagrams, labeled charts, and important university questions.</p>",
    },
    {
      id: '2',
      title: `Pharmaceutical Marketing Management (B.Pharm 8th Sem)`,
      subject: `Management`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_cdfe768a-a5b9-4009-bccc-b108f011e7dd.png?v=1779039248',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-marketing-management-b-pharm-sem-8',
      descriptionHtml: "<p>Premium notes covering pharmaceutical sales, marketing strategies, product management and healthcare marketing concepts.</p>",
    },
    {
      id: '3',
      title: `Social & Preventive Pharmacy (B.Pharm 8th Sem)`,
      subject: `Preventive Pharmacy`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_45cde050-16af-4f5b-9c58-9aef9bc70cdd.png?v=1779039055',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/social-preventive-pharmacy-b-pharm-sem-8',
      descriptionHtml: "<p>Comprehensive notes including public health, epidemiology, national health programs and preventive healthcare concepts.</p>",
    },
    {
      id: '4',
      title: `Biostatistics & Research Methodology (B.Pharm 8th Sem)`,
      subject: `Biostatistics`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.38.23PM.jpg?v=1779019728',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/biostatistics-research-methodology-b-pharm-sem-8',
      descriptionHtml: "<p>Easy handwritten notes covering sampling, probability, hypothesis testing and research designs.</p>",
    },
    {
      id: '5',
      title: `Novel Drug Delivery System (B.Pharm 7th Sem)`,
      subject: `Nanotechnology`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.43.20PM.jpg?v=1779020026',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/novel-drug-delivery-system-b-pharm-sem-7',
      descriptionHtml: "<p>NDDS notes including liposomes, nanoparticles, transdermal systems and advanced drug delivery tech.</p>",
    },
    {
      id: '6',
      title: `Pharmacy Practice (B.Pharm 7th Sem)`,
      subject: `Clinical Pharmacy`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.48.25PM.jpg?v=1779020328',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacy-practice-b-pharm-sem-7',
      descriptionHtml: "<p>Complete notes covering clinical pharmacy, patient counseling, hospital pharmacy and prescription handling.</p>",
    },
    {
      id: '7',
      title: `Industrial Pharmacy II (B.Pharm 7th Sem)`,
      subject: `Industrial Pharmacy`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.52.17PM.jpg?v=1779020565',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/industrial-pharmacy-ii-b-pharm-sem-7',
      descriptionHtml: "<p>Detailed industrial pharmacy notes including scale-up techniques, technology transfer, and validation.</p>",
    },
    {
      id: '8',
      title: `Instrumental Methods of Analysis (B.Pharm 7th Sem)`,
      subject: `Chromatography`,
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.56.40PM.jpg?v=1779020823',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/instrumental-methods-analysis-b-pharm-sem-7',
      descriptionHtml: "<p>Instrumental methods notes covering spectroscopy, chromatography, and analytical chemistry.</p>",
    },
    {
      id: '9',
      title: `Quality Assurance (B.Pharm 6th Sem)`,
      subject: `GMP`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.57.54PM.jpg?v=1779020892',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/quality-assurance-b-pharm-sem-6',
      descriptionHtml: "<p>Complete quality assurance notes covering GMP, SOP systems, audits, and validations.</p>",
    },
    {
      id: '10',
      title: `Biopharmaceutics & Pharmacokinetics (B.Pharm 6th Sem)`,
      subject: `Biopharmaceutics`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at10.35.57PM.jpg?v=1779037603',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/biopharmaceutics-pharmacokinetics-b-pharm-sem-6',
      descriptionHtml: "<p>Biopharmaceutics notes covering ADME, compartment models, and bioavailability calculation.</p>",
    }
  ];

  const filteredBooks = useMemo(() => {
    return studyBooks.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            book.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === 'all' || book.year === selectedYear;
      return matchesSearch && matchesYear;
    });
  }, [searchQuery, selectedYear]);

  return (
    <div className="space-y-6 pb-6 pt-4">
      {/* Welcome Hero Section */}
      <section className="space-y-1">
        <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
          Digital Library
        </span>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight leading-tight">
          Syllabus & Study Resources
        </h2>
        <p className="font-sans text-xs text-white/50 leading-relaxed">
          Access exam guides, syllabus PDFs, and professional handwritten B.Pharm notes prepared by TGPCOP academics.
        </p>
      </section>

      {/* Filter and Search Section */}
      <div className="space-y-3 pt-2">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Search syllabus or subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F1E42]/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/25"
          />
        </div>

        {/* Year Selector Dropdown */}
        <div className="relative flex items-center bg-[#0F1E42]/80 border border-white/10 rounded-xl px-3 py-3">
          <Layers className="w-4 h-4 text-orange-burnt mr-2 shrink-0" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="flex-grow bg-transparent text-xs text-white outline-none font-semibold cursor-pointer border-none"
          >
            <option value="all" className="bg-[#080F25] text-white">All Academic Years</option>
            <option value="First Year" className="bg-[#080F25] text-white">B.Pharm I Year</option>
            <option value="Second Year" className="bg-[#080F25] text-white">B.Pharm II Year</option>
            <option value="Third Year" className="bg-[#080F25] text-white">B.Pharm III Year</option>
            <option value="Fourth Year" className="bg-[#080F25] text-white">B.Pharm IV Year</option>
          </select>
        </div>
      </div>

      {/* Study notes Grid */}
      <div className="grid grid-cols-2 gap-4">
        {filteredBooks.map((book) => (
          <div
            key={book.id}
            onClick={() => setSelectedBook(book)}
            className="bg-[#0F1E42]/80 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between transition-all active:scale-[0.98] shadow-md relative group cursor-pointer"
          >
            {/* Image Thumbnail */}
            <div className="relative w-full h-28 bg-[#0D1B3E]">
              <img
                src={book.image}
                alt={book.title}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute top-2 left-2 bg-orange-burnt text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {book.subject}
              </div>
            </div>

            {/* Book Info */}
            <div className="p-3 space-y-1.5 flex-grow flex flex-col justify-between">
              <div>
                <h4 className="font-display font-extrabold text-[11px] text-white line-clamp-2 leading-tight">
                  {book.title}
                </h4>
                <div className="flex items-center gap-1.5 mt-1 text-[9px] text-white/50 font-semibold font-sans">
                  <Star className="w-2.5 h-2.5 text-gold-accent fill-gold-accent" />
                  <span>{book.rating}</span>
                  <span>•</span>
                  <span>{book.pages} pages</span>
                </div>
              </div>

              {/* Price and CTA */}
              <div className="flex justify-between items-center border-t border-white/5 pt-2 mt-2">
                <span className="text-sm font-display font-extrabold text-orange-burnt">
                  {book.price}
                </span>
                <span className="text-[9px] font-display font-bold uppercase tracking-wider text-orange-burnt/75 flex items-center gap-0.5">
                  Get <ShoppingBag className="w-2.5 h-2.5" />
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredBooks.length === 0 && (
          <div className="col-span-2 text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center p-6">
            <BookMarked className="w-9 h-9 text-white/10 mb-3 animate-pulse" />
            <h3 className="font-display font-bold text-white/60 text-xs">No Resources Found</h3>
            <p className="text-white/40 text-xs mt-1">Refine your search tags or selected class filter.</p>
          </div>
        )}
      </div>

      {/* Book details Bottom Drawer Modal */}
      <AnimatePresence>
        {selectedBook && (
          <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 bg-black/75 backdrop-blur-sm">
            <div onClick={() => setSelectedBook(null)} className="absolute inset-0" />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-h-[85vh] bg-[#080F25] rounded-t-3xl border-t border-white/10 p-6 flex flex-col overflow-y-auto z-10"
            >
              <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mb-5" />

              <div className="flex justify-between items-start mb-4">
                <h3 className="font-display font-extrabold text-sm text-white max-w-[280px] leading-snug">
                  {selectedBook.title}
                </h3>
                <button
                  onClick={() => setSelectedBook(null)}
                  className="p-1 rounded-xl bg-white/5 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cover & Quick Specs */}
              <div className="flex gap-4 mb-4">
                <div className="w-24 h-32 rounded-xl bg-[#0D1B3E] overflow-hidden border border-white/10 shrink-0">
                  <img
                    src={selectedBook.image}
                    alt={selectedBook.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-2 text-xs text-white/70">
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase">Subject Category</span>
                    <span className="font-bold text-white">{selectedBook.subject}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-white/40 uppercase">Academic Class</span>
                    <span className="font-bold text-white">{selectedBook.year}</span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="block text-[10px] text-white/40 uppercase">Format</span>
                      <span className="font-bold text-emerald-400">Digital PDF</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-white/40 uppercase">Document Size</span>
                      <span className="font-bold text-white">{selectedBook.pages} Pages</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="border-t border-white/5 pt-4 my-2 text-xs text-white/60 leading-relaxed font-sans">
                <span className="block text-[10px] font-bold text-orange-burnt uppercase tracking-wider mb-1">
                  About Notes Package
                </span>
                <div dangerouslySetInnerHTML={{ __html: selectedBook.descriptionHtml || '' }} />
              </div>

              {/* Buy Checkout Redirect Button */}
              <a
                href={selectedBook.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-6 border border-white/10"
              >
                <span>Purchase Notes ({selectedBook.price})</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Resources;
