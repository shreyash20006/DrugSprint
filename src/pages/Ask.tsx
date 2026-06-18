import React from 'react';
import { AskForm } from '../components/AskForm';
import { HelpCircle } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

export const Ask: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-20">
      {/* Background canvas molecules and grid overlay */}
      <ScienceBackground />
      <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[50%] -right-[10%] w-[500px] h-[500px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      {/* Reusable premium science page header */}
      <PageHeader 
        icon={<HelpCircle className="w-6 h-6 animate-pulse" />}
        title="Ask the Council"
        subtitle="Have queries regarding examinations, mid-sems, sports registrations, library timings, or anti-ragging? Send it here."
        breadcrumb="Ask Portal"
      />

      {/* Dynamic Form and FAQs Accordion */}
      <div className="relative z-10 mt-12">
        <AskForm />
      </div>
    </div>
  );
};

export default Ask;
