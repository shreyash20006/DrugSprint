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
  checkoutUrl: string;
}

export const Store: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');

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
    },
    {
      id: '11',
      title: `Herbal Drug Technology (B.Pharm 6th Sem)`,
      subject: `Herbal Drug Technology`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_3a453bde-95e5-4421-adc0-14fff07a76d5.png?v=1779038436',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/herbal-drug-technology-b-pharm-sem-6',
    },
    {
      id: '12',
      title: `Pharmacology III (B.Pharm 6th Sem)`,
      subject: `Immunopharmacology`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_9fc6e487-4300-4362-9215-61102d659504.png?v=1779038537',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacology-iii-b-pharm-sem-6',
    },
    {
      id: '13',
      title: `Medicinal Chemistry III (B.Pharm 6th Sem)`,
      subject: `Antibiotics`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_ac8a7bee-8d42-459f-aa00-444e9e4b4443.png?v=1779038566',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/medicinal-chemistry-iii-b-pharm-sem-6',
    },
    {
      id: '14',
      title: `Pharmaceutical Jurisprudence (B.Pharm 5th Sem)`,
      subject: `Drug Act`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_6baa92e6-2e28-45af-815c-b3e8a6e71bd1.png?v=1779038596',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-jurisprudence-b-pharm-sem-5',
    },
    {
      id: '15',
      title: `Pharmacognosy & Phytochemistry II (B.Pharm 5th Sem)`,
      subject: `Herbal Drugs`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_288790d4-480d-4af6-a45c-d666baa428d1.png?v=1779038818',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacognosy-phytochemistry-ii-b-pharm-sem-5',
    },
    {
      id: '16',
      title: `Pharmacology II (B.Pharm 5th Sem)`,
      subject: `Chemotherapy`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.34.02PM.jpg?v=1779019464',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacology-ii-b-pharm-sem-5',
    },
    {
      id: '17',
      title: `Industrial Pharmacy I (B.Pharm 5th Sem)`,
      subject: `GMP`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.30.54PM.jpg?v=1779019290',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/industrial-pharmacy-i-b-pharm-sem-5',
    },
    {
      id: '18',
      title: `Medicinal Chemistry II (B.Pharm 5th Sem)`,
      subject: `Medicinal Chemistry`,
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.24.54PM.jpg?v=1779018918',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/medicinal-chemistry-ii-b-pharm-sem-5',
    },
    {
      id: '19',
      title: `Pharmacognosy & Phytochemistry II (B.Pharm 4th Sem)`,
      subject: `Natural Products`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.06.43PM.jpg?v=1779017826',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacognosy-phytochemistry-ii-b-pharm-sem-4',
    },
    {
      id: '20',
      title: `Pharmacology I (B.Pharm 4th Sem)`,
      subject: `ANS Drugs`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.00.33PM.jpg?v=1779017455',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacology-i-b-pharm-sem-4',
    },
    {
      id: '21',
      title: `Physical Pharmaceutics II (B.Pharm 4th Sem)`,
      subject: `Colloids`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.56.29PM.jpg?v=1779017218',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/physical-pharmaceutics-ii-b-pharm-sem-4',
    },
    {
      id: '22',
      title: `Medicinal Chemistry I (B.Pharm 4th Sem)`,
      subject: `Medicinal Chemistry`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.50.52PM.jpg?v=1779016900',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/medicinal-chemistry-i-b-pharm-sem-4',
    },
    {
      id: '23',
      title: `Pharmaceutical Organic Chemistry III (B.Pharm 4th Sem)`,
      subject: `Heterocyclic`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.44.24PM.jpg?v=1779016489',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-organic-chemistry-iii-b-pharm-sem-4',
    },
    {
      id: '24',
      title: `Pharmacognosy & Phytochemistry I (B.Pharm 3rd Sem)`,
      subject: `Herbal`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.39.45PM.jpg?v=1779016212',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacognosy-phytochemistry-i-b-pharm-sem-3',
    },
    {
      id: '25',
      title: `Pharmaceutical Engineering (B.Pharm 3rd Sem)`,
      subject: `Heat Transfer`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.37.44PM.jpg?v=1779016099',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-engineering-b-pharm-sem-3',
    },
    {
      id: '26',
      title: `Pharmaceutical Microbiology (B.Pharm 3rd Sem)`,
      subject: `Pharmaceutical Microbiology`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.35.43PM.jpg?v=1779016022',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-microbiology-b-pharm-sem-3',
    },
    {
      id: '27',
      title: `Physical Pharmaceutics I (B.Pharm 3rd Sem)`,
      subject: `Micromeritics`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.32.20PM.jpg?v=1779015763',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/physical-pharmaceutics-i-b-pharm-sem-3',
    },
    {
      id: '28',
      title: `Pharmaceutical Organic Chemistry II (B.Pharm 3rd Sem)`,
      subject: `Organic Chemistry`,
      price: '₹49',
      year: 'Second Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.28.42PM.jpg?v=1779015548',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-organic-chemistry-ii-b-pharm-sem-3',
    },
    {
      id: '29',
      title: `Environmental Sciences (B.Pharm 2nd Sem)`,
      subject: `Environmental Sciences`,
      price: '₹39',
      year: 'First Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.21.22PM.jpg?v=1779015110',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/environmental-sciences-b-pharm-sem-2',
    },
    {
      id: '30',
      title: `Computer Applications in Pharmacy (B.Pharm 2nd Sem)`,
      subject: `Computer Applications`,
      price: '₹39',
      year: 'First Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at4.18.16PM.jpg?v=1779014919',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/computer-applications-pharmacy-b-pharm-sem-2',
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
                  <a
                    href={book.checkoutUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 bg-[#060D1F] hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-white font-display text-xs sm:text-sm font-bold uppercase tracking-widest rounded-xl transition-all duration-300 border border-orange-burnt/35 hover:border-transparent active:scale-95 shadow-md flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Buy Handbook</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      </div>


    </div>
  );
};

export default Store;
