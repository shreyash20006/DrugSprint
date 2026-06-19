import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Search, Upload, Download, Trash2, Plus, 
  FileText, Loader2, Lock, X, AlertCircle 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStudentAuth } from '../lib/StudentAuthProvider';
import { uploadFileToCloudinary } from '../lib/cloudinary';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

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
  const { studentProfile } = useStudentAuth();

  // Tabs: 'shared' | 'premium'
  const [activeTab, setActiveTab] = useState<'shared' | 'premium'>('shared');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedSemester, setSelectedSemester] = useState('all');

  // Shared Notes Data & Loading
  const [sharedResources, setSharedResources] = useState<SharedResource[]>([]);
  const [isLoadingShared, setIsLoadingShared] = useState(true);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Upload Modal State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadSubject, setUploadSubject] = useState('');
  const [uploadYear, setUploadYear] = useState('First Year');
  const [uploadSemester, setUploadSemester] = useState('Semester 1');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Premium Shopify Books List
  const premiumBooks: StudyBook[] = [
    {
      id: '1',
      title: 'Human Anatomy & Physiology II Handwritten Notes | B.Pharm 1st Year 2nd Semester | TGPCOP NOTES',
      subject: 'Anatomy PDF',
      price: '₹149',
      year: 'First Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-14at6.55.57PM.jpg?v=1778765210',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/human-anatomy-physiology-ii-b-pharm-sem-2-tgpcop',
      descriptionHtml: '<p>TGPCOP NOTES presents premium handwritten Human Anatomy &amp; Physiology II notes specially designed for B.Pharm 1st Year 2nd Semester students.</p>'
    },
    {
      id: '2',
      title: 'Pharmaceutical Marketing Management (B.Pharm 8th Sem)',
      subject: 'Management',
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_cdfe768a-a5b9-4009-bccc-b108f011e7dd.png?v=1779039248',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmaceutical-marketing-management-b-pharm-sem-8'
    },
    {
      id: '3',
      title: 'Social & Preventive Pharmacy (B.Pharm 8th Sem)',
      subject: 'Preventive Pharmacy',
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/rn-image_picker_lib_temp_45cde050-16af-4f5b-9c58-9aef9bc70cdd.png?v=1779039055',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/social-preventive-pharmacy-b-pharm-sem-8'
    },
    {
      id: '4',
      title: 'Biostatistics & Research Methodology (B.Pharm 8th Sem)',
      subject: 'Biostatistics',
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.38.23PM.jpg?v=1779019728',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/biostatistics-research-methodology-b-pharm-sem-8'
    },
    {
      id: '5',
      title: 'Novel Drug Delivery System (B.Pharm 7th Sem)',
      subject: 'Nanotechnology',
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.43.20PM.jpg?v=1779020026',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/novel-drug-delivery-system-b-pharm-sem-7'
    },
    {
      id: '6',
      title: 'Pharmacy Practice (B.Pharm 7th Sem)',
      subject: 'Clinical Pharmacy',
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.48.25PM.jpg?v=1779020328',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/pharmacy-practice-b-pharm-sem-7'
    },
    {
      id: '7',
      title: 'Industrial Pharmacy II (B.Pharm 7th Sem)',
      subject: 'Industrial Pharmacy',
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.52.17PM.jpg?v=1779020565',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/industrial-pharmacy-ii-b-pharm-sem-7'
    },
    {
      id: '8',
      title: 'Instrumental Methods of Analysis (B.Pharm 7th Sem)',
      subject: 'Chromatography',
      price: '₹49',
      year: 'Fourth Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.56.40PM.jpg?v=1779020823',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/instrumental-methods-analysis-b-pharm-sem-7'
    },
    {
      id: '9',
      title: 'Quality Assurance (B.Pharm 6th Sem)',
      subject: 'GMP',
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at5.57.54PM.jpg?v=1779020892',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/quality-assurance-b-pharm-sem-6'
    },
    {
      id: '10',
      title: 'Biopharmaceutics & Pharmacokinetics (B.Pharm 6th Sem)',
      subject: 'Biopharmaceutics',
      price: '₹49',
      year: 'Third Year',
      image: 'https://cdn.shopify.com/s/files/1/1000/3998/3418/files/WhatsAppImage2026-05-17at10.35.57PM.jpg?v=1779037603',
      rating: '4.8',
      pages: 150,
      checkoutUrl: 'https://tgpcop-pharma.myshopify.com/products/biopharmaceutics-pharmacokinetics-b-pharm-sem-6'
    }
  ];

  // Fetch Shared Resources from Supabase
  const fetchSharedResources = useCallback(async () => {
    setIsLoadingShared(true);
    try {
      const { data, error } = await supabase
        .from('study_resources')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSharedResources(data || []);
    } catch (err: any) {
      console.error('Error fetching shared resources:', err.message);
    } finally {
      setIsLoadingShared(false);
    }
  }, []);

  useEffect(() => {
    fetchSharedResources();
  }, [fetchSharedResources]);

  // Filter Shared Resources
  const filteredShared = useMemo(() => {
    return sharedResources.filter((res) => {
      const matchesSearch = 
        res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        res.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === 'all' || res.academic_year === selectedYear;
      const matchesSemester = selectedSemester === 'all' || res.semester === selectedSemester;
      return matchesSearch && matchesYear && matchesSemester;
    });
  }, [sharedResources, searchQuery, selectedYear, selectedSemester]);

  // Filter Premium Books
  const filteredPremium = useMemo(() => {
    return premiumBooks.filter((book) => {
      const matchesSearch = 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.subject.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesYear = selectedYear === 'all' || book.year === selectedYear;
      return matchesSearch && matchesYear;
    });
  }, [premiumBooks, searchQuery, selectedYear]);

  // Handle PDF file select & validate
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

  // Submit shared resource upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentProfile) {
      setUploadError('You must be logged in to share study resources.');
      return;
    }
    if (!uploadTitle.trim() || !uploadSubject.trim() || !uploadFile) {
      setUploadError('Please fill in all fields and select a PDF file.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      // 1. Upload to Cloudinary
      const fileUrl = await uploadFileToCloudinary(uploadFile);

      // 2. Save metadata to Supabase
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

      // Reset Form & Close Modal
      setUploadTitle('');
      setUploadSubject('');
      setUploadFile(null);
      setIsUploadModalOpen(false);
      
      // Refresh Lists
      fetchSharedResources();
    } catch (err: any) {
      console.error('Upload operation failed:', err);
      setUploadError(err.message || 'An error occurred during file upload.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete resource handler
  const handleDeleteResource = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this shared resource?')) return;
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
      alert('Failed to delete resource: ' + err.message);
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
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24 text-white">
      <ScienceBackground />
      <div className="absolute top-[20%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <PageHeader
        icon={<BookOpen className="w-6 h-6 text-orange-burnt animate-pulse" />}
        title="Syllabus & Study Resources"
        subtitle="Share and download lecture notes, lab manuals, university handbooks, and B.Pharm syllabus guides."
        breadcrumb="Resources"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* Toggle Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#0D1B3E]/80 border border-white/10 p-1.5 rounded-2xl flex space-x-1 shadow-lg backdrop-blur-md">
            <button
              onClick={() => { setActiveTab('shared'); setSearchQuery(''); }}
              className={`px-6 py-3 rounded-xl font-display text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'shared'
                  ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              📂 Shared Resources
            </button>
            <button
              onClick={() => { setActiveTab('premium'); setSearchQuery(''); }}
              className={`px-6 py-3 rounded-xl font-display text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                activeTab === 'premium'
                  ? 'bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white shadow-md'
                  : 'text-white/60 hover:text-white'
              }`}
            >
              ⭐ Premium Guides
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 mb-10 bg-[#0D1B3E]/85 p-4 rounded-2xl border border-orange-burnt/10 shadow-xl backdrop-blur-md">
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Year Selector */}
            <div className="flex items-center bg-[#060D1F] border border-orange-burnt/25 rounded-xl px-3 py-2 text-xs">
              <span className="text-orange-burnt font-bold uppercase mr-2 tracking-wider">Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-white outline-none cursor-pointer font-semibold"
              >
                <option value="all" className="bg-[#080F25]">All Years</option>
                <option value="First Year" className="bg-[#080F25]">First Year</option>
                <option value="Second Year" className="bg-[#080F25]">Second Year</option>
                <option value="Third Year" className="bg-[#080F25]">Third Year</option>
                <option value="Fourth Year" className="bg-[#080F25]">Fourth Year</option>
              </select>
            </div>

            {/* Semester Selector (Only visible for shared notes) */}
            {activeTab === 'shared' && (
              <div className="flex items-center bg-[#060D1F] border border-orange-burnt/25 rounded-xl px-3 py-2 text-xs">
                <span className="text-orange-burnt font-bold uppercase mr-2 tracking-wider">Semester:</span>
                <select
                  value={selectedSemester}
                  onChange={(e) => setSelectedSemester(e.target.value)}
                  className="bg-transparent text-white outline-none cursor-pointer font-semibold"
                >
                  <option value="all" className="bg-[#080F25]">All Semesters</option>
                  <option value="Semester 1" className="bg-[#080F25]">Semester 1</option>
                  <option value="Semester 2" className="bg-[#080F25]">Semester 2</option>
                  <option value="Semester 3" className="bg-[#080F25]">Semester 3</option>
                  <option value="Semester 4" className="bg-[#080F25]">Semester 4</option>
                  <option value="Semester 5" className="bg-[#080F25]">Semester 5</option>
                  <option value="Semester 6" className="bg-[#080F25]">Semester 6</option>
                  <option value="Semester 7" className="bg-[#080F25]">Semester 7</option>
                  <option value="Semester 8" className="bg-[#080F25]">Semester 8</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between w-full lg:w-auto gap-4">
            {/* Search Input */}
            <div className="relative flex-grow lg:w-80">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-white/35" />
              <input
                type="text"
                placeholder={activeTab === 'shared' ? "Search shared PDFs..." : "Search premium handbooks..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#060D1F] border border-orange-burnt/25 focus:border-orange-burnt rounded-xl py-3 pl-10 pr-4 text-xs text-white placeholder:text-white/30 outline-none transition-all"
              />
            </div>

            {/* Action Buttons */}
            {activeTab === 'shared' && (
              <button
                onClick={() => {
                  if (!studentProfile) {
                    alert('You must be logged in to share study notes.');
                    return;
                  }
                  setIsUploadModalOpen(true);
                }}
                className="px-5 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white text-xs font-display font-bold uppercase tracking-wider rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md flex items-center space-x-1.5 cursor-pointer border border-white/10"
              >
                <Plus className="w-4 h-4" />
                <span>Upload PDF</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Shared Notes Section */}
        {activeTab === 'shared' && (
          <div>
            {isLoadingShared ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-orange-burnt animate-spin mb-4" />
                <p className="text-white/60 font-medium text-sm">Fetching shared resources from database...</p>
              </div>
            ) : filteredShared.length === 0 ? (
              <div className="text-center py-20 bg-[#0D1B3E]/60 rounded-3xl border border-orange-burnt/15 max-w-lg mx-auto p-6">
                <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="font-display font-bold text-white/70 text-lg">No shared notes found</h3>
                <p className="text-white/40 text-sm mt-1">Be the first to upload PDFs for your peers!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredShared.map((res) => (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -4, borderColor: 'rgba(200, 75, 14, 0.4)' }}
                    className="bg-[#0D1B3E]/80 border border-orange-burnt/10 rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative shadow-lg backdrop-blur-md"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span className="bg-orange-burnt/10 text-orange-burnt text-[9px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full border border-orange-burnt/25">
                          {res.subject}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="bg-white/5 text-white/60 text-[9px] font-extrabold px-2 py-1 rounded-full uppercase border border-white/5">
                            {res.academic_year}
                          </span>
                          <span className="bg-white/5 text-white/60 text-[9px] font-extrabold px-2 py-1 rounded-full uppercase border border-white/5">
                            {res.semester}
                          </span>
                        </div>
                      </div>

                      {/* Main details */}
                      <h3 className="font-display font-bold text-white text-base leading-snug line-clamp-2 mb-3">
                        {res.title}
                      </h3>

                      {/* Uploader Meta */}
                      <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between text-[11px] text-white/40 font-sans">
                        <div>
                          <span className="block text-[9px] text-white/20 uppercase font-semibold">Shared by</span>
                          <span className="font-medium text-white/70">{res.uploader_name}</span>
                        </div>
                        <span className="text-[10px] text-white/30 font-semibold self-end">
                          {new Date(res.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 mt-6">
                      <a
                        href={res.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-grow py-3 bg-[#060D1F] hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 border border-orange-burnt/35 hover:border-transparent active:scale-95 shadow-md flex items-center justify-center space-x-1.5"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>

                      {isPrivilegedUser(res.uploader_id) && (
                        <button
                          disabled={isDeletingId === res.id}
                          onClick={() => handleDeleteResource(res.id)}
                          className="w-12 h-11 bg-red-500/10 hover:bg-red-500 border border-red-500/35 hover:border-transparent rounded-xl flex items-center justify-center text-red-400 hover:text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                          title="Delete Notes"
                        >
                          {isDeletingId === res.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4.5 h-4.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Premium Shopify Books Section */}
        {activeTab === 'premium' && (
          <div>
            {filteredPremium.length === 0 ? (
              <div className="text-center py-20 bg-[#0D1B3E]/60 rounded-3xl border border-orange-burnt/15 max-w-lg mx-auto p-6">
                <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="font-display font-bold text-white/70 text-lg">No premium handbooks found</h3>
                <p className="text-white/40 text-sm mt-1">Try resetting search queries or year filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPremium.map((book) => (
                  <motion.div
                    key={book.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{
                      y: -6,
                      borderColor: 'rgba(214, 90, 30, 0.4)',
                      boxShadow: '0 20px 40px -15px rgba(214, 90, 30, 0.25)',
                    }}
                    className="bg-[#0D1B3E]/85 border border-orange-burnt/25 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 relative group h-full shadow-lg"
                  >
                    <div>
                      {/* Cover Banner */}
                      <div className="h-48 overflow-hidden relative border-b border-orange-burnt/10 bg-[#050B18] flex items-center justify-center">
                        <img 
                          src={book.image} 
                          alt={book.title} 
                          className="w-full h-full object-contain p-4 bg-white/5 transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <span className="absolute top-3 left-3 bg-[#F5A623] text-navy-dark text-[8px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-white/10 shadow-md">
                          {book.year}
                        </span>
                        <span className="absolute bottom-3 right-3 bg-orange-burnt text-white text-xs font-display font-extrabold px-3 py-1 rounded-lg border border-white/10 shadow-md">
                          {book.price}
                        </span>
                      </div>

                      {/* Info Details */}
                      <div className="p-6 space-y-2">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-[#F5A623]">
                          {book.subject}
                        </span>
                        <h3 className="font-display font-bold text-white text-base leading-snug line-clamp-2 group-hover:text-orange-burnt transition-colors">
                          {book.title}
                        </h3>
                        <div className="flex items-center space-x-3 text-[10px] text-white/50 font-sans font-semibold pt-1">
                          <span>📖 {book.pages} pages</span>
                          <span>⭐ {book.rating} Rating</span>
                        </div>
                      </div>
                    </div>

                    {/* Shopify Checkout Button */}
                    <div className="p-6 pt-0 mt-auto">
                      <a
                        href={book.checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 bg-[#060D1F] hover:bg-gradient-to-r hover:from-orange-burnt hover:to-[#E06D2B] text-white font-display text-xs font-bold uppercase tracking-widest rounded-xl transition-all duration-300 border border-orange-burnt/35 hover:border-transparent active:scale-95 shadow-md flex items-center justify-center space-x-1.5"
                      >
                        <span>Purchase Handbook</span>
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Upload Shared Notes Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#080F25] border border-white/10 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden relative"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0D1B3E]/50">
                <div className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-orange-burnt" />
                  <h3 className="font-display font-extrabold text-sm uppercase tracking-wider text-white">
                    Share Study Notes
                  </h3>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1 rounded-xl bg-white/5 text-white/60 hover:text-white transition-colors cursor-pointer"
                  disabled={isUploading}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
                {uploadError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-center space-x-2.5 text-xs text-red-400">
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
                    placeholder="e.g. Pharmaceutics I - Unit 2 Handwritten Notes"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full bg-[#0F1E42]/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/20"
                    disabled={isUploading}
                  />
                </div>

                {/* Subject Badge */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                    Subject Tag *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pharmaceutics, Anatomy, Biochemistry"
                    value={uploadSubject}
                    onChange={(e) => setUploadSubject(e.target.value)}
                    className="w-full bg-[#0F1E42]/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors placeholder-white/20"
                    disabled={isUploading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Academic Year */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Academic Year *
                    </label>
                    <select
                      value={uploadYear}
                      onChange={(e) => setUploadYear(e.target.value)}
                      className="w-full bg-[#0F1E42]/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors cursor-pointer"
                      disabled={isUploading}
                    >
                      <option value="First Year" className="bg-[#080F25]">First Year</option>
                      <option value="Second Year" className="bg-[#080F25]">Second Year</option>
                      <option value="Third Year" className="bg-[#080F25]">Third Year</option>
                      <option value="Fourth Year" className="bg-[#080F25]">Fourth Year</option>
                    </select>
                  </div>

                  {/* Semester */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1.5">
                      Semester *
                    </label>
                    <select
                      value={uploadSemester}
                      onChange={(e) => setUploadSemester(e.target.value)}
                      className="w-full bg-[#0F1E42]/80 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-burnt transition-colors cursor-pointer"
                      disabled={isUploading}
                    >
                      <option value="Semester 1" className="bg-[#080F25]">Semester 1</option>
                      <option value="Semester 2" className="bg-[#080F25]">Semester 2</option>
                      <option value="Semester 3" className="bg-[#080F25]">Semester 3</option>
                      <option value="Semester 4" className="bg-[#080F25]">Semester 4</option>
                      <option value="Semester 5" className="bg-[#080F25]">Semester 5</option>
                      <option value="Semester 6" className="bg-[#080F25]">Semester 6</option>
                      <option value="Semester 7" className="bg-[#080F25]">Semester 7</option>
                      <option value="Semester 8" className="bg-[#080F25]">Semester 8</option>
                    </select>
                  </div>
                </div>

                {/* File Picker */}
                <div className="border border-dashed border-white/15 hover:border-orange-burnt/50 transition-colors rounded-2xl bg-[#0F1E42]/30 p-6 flex flex-col items-center justify-center cursor-pointer relative group">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <FileText className="w-8 h-8 text-white/30 group-hover:text-orange-burnt transition-colors mb-2" />
                  <span className="text-[11px] text-white/60 font-semibold text-center">
                    {uploadFile ? uploadFile.name : 'Select or drop your PDF study notes here'}
                  </span>
                  <span className="text-[9px] text-white/30 mt-1">Maximum size allowed: 50MB</span>
                </div>

                {/* Uploader Meta Info */}
                <div className="bg-[#0D1B3E]/30 rounded-xl p-3 flex items-center space-x-2 text-[10px] text-white/40">
                  <Lock className="w-3.5 h-3.5 shrink-0 text-orange-burnt/50" />
                  <span>
                    Sharing as: <strong className="text-white/70">{studentProfile?.full_name}</strong> ({studentProfile?.email})
                  </span>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="flex-1 py-3 border border-white/10 hover:bg-white/5 text-white/80 rounded-xl text-xs font-display font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    disabled={isUploading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white rounded-xl text-xs font-display font-bold uppercase tracking-wider hover:scale-102 active:scale-98 transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Uploading Notes...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Publish Notes</span>
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
