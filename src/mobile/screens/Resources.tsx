import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Star, ShoppingBag, ExternalLink, X, BookMarked, 
  Layers, Upload, Download, Trash2, Plus, FileText, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useStudentAuth } from '../../lib/StudentAuthProvider';
import { uploadFileToCloudinary } from '../../lib/cloudinary';
import { getCache, setCache } from '../../lib/cache';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

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

interface SharedResource {
  id: string;
  title: string;
  subject: string;
  semester: string;
  academic_year: string;
  file_url: string;
  uploader_id: string;
  uploader_name: string;
  uploader_email: string;
  created_at: string;
}

export const Resources: React.FC = () => {
  const { studentProfile } = useStudentAuth();

  // Tab State: 'shared' | 'premium'
  const [activeTab, setActiveTab] = useState<'shared' | 'premium'>('shared');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');

  // Detail Modal State (Premium Books)
  const [selectedBook, setSelectedBook] = useState<StudyBook | null>(null);

  // Shared Resources State
  const [sharedResources, setSharedResources] = useState<SharedResource[]>([]);
  const [isLoadingShared, setIsLoadingShared] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Upload Drawer State
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadYear, setUploadYear] = useState('First Year');
  const [uploadSemester, setUploadSemester] = useState('Semester 1');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Shopify Books Data
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

  // Fetch shared resources from Supabase with offline cache
  const fetchSharedResources = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoadingShared(true);
    try {
      const { data, error } = await supabase
        .from('study_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const items = data || [];
      setSharedResources(items);
      setCache('resources', items, 60);
    } catch (err: any) {
      console.error('Error fetching shared resources:', err.message);
    } finally {
      setIsLoadingShared(false);
    }
  }, []);

  useEffect(() => {
    const cached = getCache<SharedResource[]>('resources');
    if (cached) {
      setSharedResources(cached);
      setIsLoadingShared(false);
      fetchSharedResources(false);
    } else {
      fetchSharedResources(true);
    }
  }, [fetchSharedResources]);

  const { isRefreshing, pullProgress } = usePullToRefresh({
    onRefresh: () => fetchSharedResources(false),
  });

  // Filters Shared Notes
  const filteredShared = useMemo(() => {
    return sharedResources.filter(res => {
      const matchesSearch = 
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        res.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === 'all' || res.academic_year === selectedYear;
      const matchesSemester = selectedSemester === 'all' || res.semester === selectedSemester;
      return matchesSearch && matchesYear && matchesSemester;
    });
  }, [sharedResources, searchQuery, selectedYear, selectedSemester]);

  // Filters Premium Books
  const filteredPremium = useMemo(() => {
    return studyBooks.filter(book => {
      const matchesSearch = 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        book.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === 'all' || book.year === selectedYear;
      return matchesSearch && matchesYear;
    });
  }, [studyBooks, searchQuery, selectedYear]);

  // Handle PDF select & check constraints
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        setUploadError('Only PDF files are supported.');
        setUploadFile(null);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setUploadError('File size exceeds the 50MB limit.');
        setUploadFile(null);
        return;
      }
      setUploadFile(file);
      setUploadError('');
    }
  };

  // Submit shared notes upload on mobile
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) {
      setUploadError('Please sign in to upload resources.');
      return;
    }
    if (!uploadTitle.trim() || !uploadSubject.trim() || !uploadFile) {
      setUploadError('Please fill in all fields and select a PDF.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // 1. Upload to Cloudinary
      const fileUrl = await uploadFileToCloudinary(uploadFile);

      // 2. Insert to Supabase
      const { error } = await supabase.from('study_resources').insert([
        {
          title: uploadTitle.trim(),
          subject: uploadSubject.trim(),
          academic_year: uploadYear,
          semester: uploadSemester,
          file_url: fileUrl,
          uploader_id: studentProfile.id,
          uploader_name: studentProfile.full_name || 'Anonymous Student',
          uploader_email: studentProfile.email,
        }
      ]);

      if (error) throw error;

      // Reset
      setUploadTitle('');
      setUploadSubject('');
      setUploadFile(null);
      setIsUploadDrawerOpen(false);

      // Refresh
      fetchSharedResources(true);
    } catch (err: any) {
      console.error('Mobile upload failed:', err);
      setUploadError(err.message || 'An error occurred during file upload.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete notes from Supabase
  const handleDeleteResource = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Delete this resource?')) return;
    setIsDeletingId(id);
    try {
      const { error } = await supabase
        .from('study_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setSharedResources(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      console.error('Delete failed:', err.message);
      alert('Failed: ' + err.message);
    } finally {
      setIsDeletingId(null);
    }
  };

  const isPrivilegedUser = (uploaderId: string) => {
    if (!studentProfile) return false;
    if (studentProfile.id === uploaderId) return true;
    return ['super_admin', 'admin', 'developer'].includes(studentProfile.role || '');
  };

  return (
    <div className="space-y-6 pb-6 pt-4 text-white">
      {/* Pull-to-refresh indicator */}
      <AnimatePresence>
        {(isRefreshing || pullProgress > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 40 }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center justify-center"
          >
            <RefreshCw
              className={`w-5 h-5 text-orange-burnt ${isRefreshing ? 'animate-spin' : ''}`}
              style={{ transform: `rotate(${pullProgress * 360}deg)` }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {/* Welcome Hero Section */}
      <section className="space-y-1">
        <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
          Digital Library
        </span>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight leading-tight">
          Syllabus & Study Resources
        </h2>
        <p className="font-sans text-xs text-white/50 leading-relaxed">
          Access peer-shared notes, semester guides, and premium study materials prepared by TGPCOP academics.
        </p>
      </section>

      {/* Tab Selectors */}
      <div className="bg-[#0F1E42]/85 border border-white/5 p-1 rounded-xl flex shadow-md">
        <button
          onClick={() => { setActiveTab('shared'); setSearchQuery(''); }}
          className={`flex-grow text-center py-2.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'shared' ? 'bg-orange-burnt text-white' : 'text-white/45'
          }`}
        >
          📂 Shared Notes
        </button>
        <button
          onClick={() => { setActiveTab('premium'); setSearchQuery(''); }}
          className={`flex-grow text-center py-2.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider transition-all duration-200 ${
            activeTab === 'premium' ? 'bg-orange-burnt text-white' : 'text-white/45'
          }`}
        >
          ⭐ Premium Books
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="space-y-3 pt-1">
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder={activeTab === 'shared' ? "Search shared PDFs..." : "Search premium handbooks..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0F1E42]/80 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/25"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Year Filter */}
          <div className="relative flex items-center bg-[#0F1E42]/80 border border-white/10 rounded-xl px-3 py-2.5">
            <Layers className="w-3.5 h-3.5 text-orange-burnt mr-2 shrink-0" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex-grow bg-transparent text-[11px] text-white outline-none font-semibold cursor-pointer border-none"
            >
              <option value="all" className="bg-[#080F25]">All Years</option>
              <option value="First Year" className="bg-[#080F25]">I Year</option>
              <option value="Second Year" className="bg-[#080F25]">II Year</option>
              <option value="Third Year" className="bg-[#080F25]">III Year</option>
              <option value="Fourth Year" className="bg-[#080F25]">IV Year</option>
            </select>
          </div>

          {/* Semester Filter / Upload Trigger */}
          {activeTab === 'shared' ? (
            <div className="relative flex items-center bg-[#0F1E42]/80 border border-white/10 rounded-xl px-3 py-2.5">
              <Layers className="w-3.5 h-3.5 text-orange-burnt mr-2 shrink-0" />
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="flex-grow bg-transparent text-[11px] text-white outline-none font-semibold cursor-pointer border-none"
              >
                <option value="all" className="bg-[#080F25]">All Sem</option>
                <option value="Semester 1" className="bg-[#080F25]">Sem 1</option>
                <option value="Semester 2" className="bg-[#080F25]">Sem 2</option>
                <option value="Semester 3" className="bg-[#080F25]">Sem 3</option>
                <option value="Semester 4" className="bg-[#080F25]">Sem 4</option>
                <option value="Semester 5" className="bg-[#080F25]">Sem 5</option>
                <option value="Semester 6" className="bg-[#080F25]">Sem 6</option>
                <option value="Semester 7" className="bg-[#080F25]">Sem 7</option>
                <option value="Semester 8" className="bg-[#080F25]">Sem 8</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center justify-center bg-[#0F1E42]/30 border border-white/5 rounded-xl px-3 py-2.5 text-[11px] text-white/40 font-semibold select-none">
              Shopify Store
            </div>
          )}
        </div>

        {/* Upload Notes Button for Shared Notes tab */}
        {activeTab === 'shared' && (
          <button
            onClick={() => {
              if (!studentProfile) {
                alert('Please sign in to upload resources.');
                return;
              }
              setIsUploadDrawerOpen(true);
            }}
            className="w-full py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs font-display font-bold uppercase tracking-wider rounded-xl shadow-lg border border-white/10 flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Notes PDF</span>
          </button>
        )}
      </div>

      {/* Shared Notes List rendering */}
      {activeTab === 'shared' && (
        <div className="space-y-4">
          {isLoadingShared ? (
            <div className="flex flex-col items-center justify-center py-10">
              <Loader2 className="w-8 h-8 text-orange-burnt animate-spin mb-2" />
              <p className="text-xs text-white/50">Fetching student resources...</p>
            </div>
          ) : filteredShared.length === 0 ? (
            <div className="text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center p-6">
              <BookMarked className="w-9 h-9 text-white/10 mb-3" />
              <h3 className="font-display font-bold text-white/60 text-xs">No Shared Notes</h3>
              <p className="text-white/40 text-[11px] mt-1">Be the first to share notes with this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredShared.map((res) => (
                <div
                  key={res.id}
                  className="bg-[#0F1E42]/80 border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-4 relative"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-orange-burnt/10 text-orange-burnt text-[8px] font-bold uppercase px-2 py-0.5 rounded border border-orange-burnt/20">
                        {res.subject}
                      </span>
                      <span className="text-[9px] text-white/40">
                        {res.academic_year} • {res.semester}
                      </span>
                    </div>

                    <h4 className="font-display font-extrabold text-[13px] text-white leading-snug">
                      {res.title}
                    </h4>

                    <div className="text-[10px] text-white/40 font-sans">
                      Uploaded by: <span className="text-white/65 font-medium">{res.uploader_name}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={res.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-grow py-2.5 bg-[#0D1B3E] hover:bg-orange-burnt border border-orange-burnt/20 hover:border-transparent text-white font-display text-[10px] font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-1 active:scale-[0.98] transition-transform"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Note</span>
                    </a>

                    {isPrivilegedUser(res.uploader_id) && (
                      <button
                        disabled={isDeletingId === res.id}
                        onClick={(e) => handleDeleteResource(e, res.id)}
                        className="w-10 h-9.5 bg-red-500/10 hover:bg-red-500 border border-red-500/30 rounded-lg flex items-center justify-center text-red-400 hover:text-white transition-all active:scale-[0.98]"
                      >
                        {isDeletingId === res.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Premium Notes Grid rendering */}
      {activeTab === 'premium' && (
        <div className="grid grid-cols-2 gap-4">
          {filteredPremium.map((book) => (
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
                    <Star className="w-2.5 h-2.5 text-orange-burnt fill-orange-burnt" />
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

          {filteredPremium.length === 0 && (
            <div className="col-span-2 text-center py-12 border border-white/5 rounded-2xl bg-white/[0.01] flex flex-col items-center p-6">
              <BookMarked className="w-9 h-9 text-white/10 mb-3" />
              <h3 className="font-display font-bold text-white/60 text-xs">No Premium Guides</h3>
              <p className="text-white/40 text-xs mt-1">Refine your search tags or selected filter.</p>
            </div>
          )}
        </div>
      )}

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
              className="relative w-full max-h-[85vh] bg-[#080F25] rounded-t-3xl border-t border-white/10 p-6 flex flex-col overflow-y-auto z-10 text-white"
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
                      <span className="block text-[10px] text-white/40 uppercase">Size</span>
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

      {/* Upload Shared Notes Bottom Drawer */}
      <AnimatePresence>
        {isUploadDrawerOpen && (
          <div className="fixed inset-0 z-[9999] flex items-end justify-center p-0 bg-black/80 backdrop-blur-sm">
            <div onClick={() => !isUploading && setIsUploadDrawerOpen(false)} className="absolute inset-0" />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-h-[90vh] bg-[#080F25] rounded-t-3xl border-t border-white/10 p-6 flex flex-col overflow-y-auto z-10 text-white"
            >
              <div className="w-12 h-1.5 bg-white/15 rounded-full mx-auto mb-5" />

              <div className="flex justify-between items-center mb-4">
                <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">
                  Share Study Notes
                </h3>
                <button
                  onClick={() => setIsUploadDrawerOpen(false)}
                  className="p-1 rounded-xl bg-white/5 text-white/60 hover:text-white"
                  disabled={isUploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit} className="space-y-4 pt-2">
                {uploadError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2 text-xs text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Notes Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pharmacology III - Unit 1 Notes"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full bg-[#0F1E42]/85 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt"
                    disabled={isUploading}
                  />
                </div>

                {/* Subject tag */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Subject Tag *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pharmacology, Chemistry"
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full bg-[#0F1E42]/85 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt"
                    disabled={isUploading}
                  />
                </div>

                {/* Year and Semester */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Year *
                    </label>
                    <select
                      value={uploadYear}
                      onChange={(e) => setUploadYear(e.target.value)}
                      className="w-full bg-[#0F1E42]/85 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none"
                      disabled={isUploading}
                    >
                      <option value="First Year">First Year</option>
                      <option value="Second Year">Second Year</option>
                      <option value="Third Year">Third Year</option>
                      <option value="Fourth Year">Fourth Year</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Semester *
                    </label>
                    <select
                      value={uploadSemester}
                      onChange={(e) => setUploadSemester(e.target.value)}
                      className="w-full bg-[#0F1E42]/85 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none"
                      disabled={isUploading}
                    >
                      <option value="Semester 1">Semester 1</option>
                      <option value="Semester 2">Semester 2</option>
                      <option value="Semester 3">Semester 3</option>
                      <option value="Semester 4">Semester 4</option>
                      <option value="Semester 5">Semester 5</option>
                      <option value="Semester 6">Semester 6</option>
                      <option value="Semester 7">Semester 7</option>
                      <option value="Semester 8">Semester 8</option>
                    </select>
                  </div>
                </div>

                {/* File picker */}
                <div className="border border-dashed border-white/15 rounded-2xl bg-[#0F1E42]/30 p-5 flex flex-col items-center justify-center relative cursor-pointer min-h-[100px]">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <FileText className="w-7 h-7 text-white/30 mb-1" />
                  <span className="text-[10px] text-white/60 text-center px-2">
                    {uploadFile ? uploadFile.name : 'Tap to select PDF note file'}
                  </span>
                  <span className="text-[8px] text-white/30 mt-1">Maximum PDF size: 50MB</span>
                </div>

                {/* Submit buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsUploadDrawerOpen(false)}
                    className="flex-1 py-3 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-display font-bold uppercase tracking-wider"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white rounded-xl text-xs font-display font-bold uppercase tracking-wider flex items-center justify-center gap-1 shadow-lg"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Upload Notes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Resources;
