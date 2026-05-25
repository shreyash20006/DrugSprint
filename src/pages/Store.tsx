import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Search, ShoppingBag } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';
import { useToast } from '../components/admin/Toast';

interface StudyBook {
  id: string;
  title: string;
  subject: string;
  price: string;
  year: string;
  image: string;
  rating: string;
  pages: number;
}

export const Store: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [purchaseBook, setPurchaseBook] = useState<StudyBook | null>(null);
  const toast = useToast();

  const studyBooks: StudyBook[] = [
    {
      id: '1',
      title: 'Organic Chemistry for Pharmacists',
      subject: 'Pharmaceutical Chemistry',
      price: '₹249',
      year: 'First Year',
      image: 'https://images.unsplash.com/photo-1532187643603-ba119ca4109e?q=80&w=600&auto=format&fit=crop',
      rating: '4.8',
      pages: 340,
    },
    {
      id: '2',
      title: 'Pathophysiology & Disease Dynamics',
      subject: 'Pharmacology',
      price: '₹399',
      year: 'Second Year',
      image: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=600&auto=format&fit=crop',
      rating: '4.9',
      pages: 420,
    },
    {
      id: '3',
      title: 'Novel Drug Delivery Systems',
      subject: 'Pharmaceutics',
      price: '₹459',
      year: 'Fourth Year',
      image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=600&auto=format&fit=crop',
      rating: '5.0',
      pages: 510,
    },
    {
      id: '4',
      title: 'Biopharmaceutics & Pharmacokinetics',
      subject: 'Pharmaceutics',
      price: '₹349',
      year: 'Third Year',
      image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=600&auto=format&fit=crop',
      rating: '4.7',
      pages: 380,
    },
    {
      id: '5',
      title: 'Medicinal Chemistry & Molecular Structure',
      subject: 'Pharmaceutical Chemistry',
      price: '₹419',
      year: 'Third Year',
      image: 'https://images.unsplash.com/photo-1617155093730-a8bf47be792d?q=80&w=600&auto=format&fit=crop',
      rating: '4.8',
      pages: 460,
    },
    {
      id: '6',
      title: 'Pharmacognosy & Phytochemistry Basics',
      subject: 'Pharmacognosy',
      price: '₹299',
      year: 'Second Year',
      image: 'https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?q=80&w=600&auto=format&fit=crop',
      rating: '4.6',
      pages: 295,
    },
  ];

  const filteredBooks = React.useMemo(() => studyBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesYear = selectedYear === 'all' || book.year.toLowerCase() === selectedYear.toLowerCase();
    return matchesSearch && matchesYear;
  }), [searchQuery, selectedYear]);

  const handleYearSelect = React.useCallback((yearOpt: string) => {
    setSelectedYear(yearOpt === 'All' ? 'all' : yearOpt);
  }, []);

  const handleBuy = (book: StudyBook) => {
    setPurchaseBook(book);
  };

  const confirmPurchase = () => {
    toast.success(`Order placed successfully for ${purchaseBook?.title}! Material sent to your email.`);
    setPurchaseBook(null);
  };

  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24">
      {/* Dynamic Molecular canvas background */}
      <ScienceBackground />

      {/* Page Header */}
      <PageHeader 
        icon={<BookOpen className="w-6 h-6 text-orange-burnt" />}
        title="Study Store"
        subtitle="Download premium pharmacy syllabus handbooks, exam keys, and scientific laboratory guides."
        breadcrumb="Store"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-16">
        
        {/* Navigation Filters & Search bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-5 mb-10 bg-[#0D1B3E]/85 p-3 sm:p-4 rounded-2xl border border-orange-burnt/10 shadow-xl backdrop-blur-md">
          
          {/* Year select tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {['All', 'First Year', 'Second Year', 'Third Year', 'Fourth Year'].map((yearOpt) => {
              const active = (yearOpt === 'All' && selectedYear === 'all') || 
                (yearOpt.toLowerCase() === selectedYear.toLowerCase());
              return (
                <button
                  key={yearOpt}
                  onClick={() => handleYearSelect(yearOpt)}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-display font-bold uppercase tracking-wider transition-all select-none ${
                    active 
                      ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white shadow-md shadow-orange-burnt/25'
                      : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent hover:border-orange-burnt/20'
                  }`}
                >
                  {yearOpt}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-white/35" />
            <input 
              type="text"
              placeholder="Search reference guides..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[#060D1F] border border-orange-burnt/25 focus:border-orange-burnt rounded-xl py-3.5 pl-11 pr-4 text-xs sm:text-sm text-white placeholder:text-white/30 outline-none transition-all focus:ring-1 focus:ring-orange-burnt/25"
            />
          </div>
        </div>

        {/* Study Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-20 bg-[#0D1B3E]/60 rounded-3xl border border-orange-burnt/15 max-w-lg mx-auto">
            <ShoppingBag className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h3 className="font-display font-bold text-white/70 text-lg">No syllabus materials found</h3>
            <p className="text-white/40 text-sm mt-1">Try tweaking your search term or year filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">
            {filteredBooks.map((book, idx) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
                whileHover={{
                  y: -8,
                  borderColor: 'rgba(214, 90, 30, 0.45)',
                  boxShadow: '0 20px 40px -15px rgba(214, 90, 30, 0.35)',
                }}
                className="bg-[#0D1B3E]/85 border border-orange-burnt/25 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 relative group h-full shadow-lg"
              >
                <div>
                  {/* Zooming Book Cover Banner */}
                  <div className="h-48 sm:h-52 overflow-hidden relative border-b border-orange-burnt/10 bg-[#050B18]">
                    <img 
                      src={book.image} 
                      alt={book.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                    />
                    
                    {/* Hover black sheet */}
                    <div className="absolute inset-0 bg-[#050B18]/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]" />

                    {/* Gold Year pill top-left */}
                    <span className="absolute top-3.5 left-3.5 bg-gradient-to-r from-[#F5A623] to-[#E09D2B] text-navy-dark text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-white/10 shadow-lg">
                      {book.year}
                    </span>

                    {/* Orange Price Tag bottom-right */}
                    <span className="absolute bottom-3.5 right-3.5 bg-orange-burnt text-white text-xs font-display font-extrabold px-3 py-1 rounded-lg border border-white/10 shadow-lg">
                      {book.price}
                    </span>
                  </div>

                  {/* Book Metadata details */}
                  <div className="p-6 space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5A623]">
                      {book.subject}
                    </span>
                    <h3 className="font-display font-bold text-white text-lg group-hover:text-orange-burnt transition-colors line-clamp-2 leading-snug">
                      {book.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-[11px] text-white/50 font-sans">
                      <span>📖 {book.pages} pages</span>
                      <span>⭐ {book.rating} Rating</span>
                    </div>
                  </div>
                </div>

                {/* Purchase Button row */}
                <div className="p-6 pt-0 mt-auto">
                  <button
                    onClick={() => handleBuy(book)}
                    className="w-full py-3 bg-[#060D1F] hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-white font-display text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl transition-all duration-300 border border-orange-burnt/35 hover:border-transparent active:scale-95 shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Buy Handbook</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Elegant Checkout Modal dialog */}
      <AnimatePresence>
        {purchaseBook && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPurchaseBook(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 pointer-events-auto"
            />

            {/* Modal card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 30 }}
              transition={{ type: 'spring', stiffness: 350, damping: 28 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md px-4 z-[51] pointer-events-auto"
            >
              <div className="bg-[#0D1B3E] border border-orange-burnt/35 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
                
                {/* Visual Icon */}
                <div className="w-14 h-14 bg-orange-burnt/10 rounded-full border border-orange-burnt/25 flex items-center justify-center text-orange-burnt mx-auto animate-pulse">
                  <ShoppingBag className="w-7 h-7" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#F5A623]">Confirm Checkout</span>
                  <h3 className="font-display font-extrabold text-white text-xl leading-tight">
                    {purchaseBook.title}
                  </h3>
                  <p className="text-white/50 text-xs font-sans max-w-sm mx-auto">
                    The premium reference material package will be securely dispatched to your registered student email address.
                  </p>
                </div>

                {/* Amount strip */}
                <div className="bg-[#050B18] rounded-2xl p-4 flex items-center justify-between border border-white/5 text-xs sm:text-sm font-semibold">
                  <span className="text-white/60">Handbook price:</span>
                  <span className="text-orange-burnt font-display font-extrabold text-base">{purchaseBook.price}</span>
                </div>

                {/* Buttons row */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setPurchaseBook(null)}
                    className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 border border-white/5 active:scale-95 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPurchase}
                    className="flex-1 py-3.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-orange-burnt/15 active:scale-95 transition-all cursor-pointer"
                  >
                    Complete
                  </button>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Store;
