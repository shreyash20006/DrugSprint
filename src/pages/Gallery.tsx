import React from 'react';
import { GalleryGrid } from '../components/GalleryGrid';
import { Images } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

export const Gallery: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24">
      {/* Background Molecular Animations & Tech Elements */}
      <ScienceBackground />
      <div className="absolute top-[20%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      {/* Custom Reusable Science Page Header */}
      <PageHeader
        icon={<Images className="w-6 h-6 animate-pulse" />}
        title="Campus Gallery"
        subtitle="Catch a glimpse of dynamic academic exhibitions, intensive technical symposiums, and sports weeks at TGPCOP Nagpur"
        breadcrumb="Gallery"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Masonry gallery Grid panel */}
        <GalleryGrid />
      </div>
    </div>
  );
};

export default Gallery;
