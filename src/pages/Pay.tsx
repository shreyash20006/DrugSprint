import React from 'react';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';
import { PaymentForm } from '../components/PaymentForm';

export const Pay: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24 select-none">
      {/* Dynamic particles in background */}
      <ScienceBackground />
      <div className="absolute top-[20%] left-[5%] w-[450px] h-[450px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[60%] right-[5%] w-[400px] h-[400px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      {/* Page Header */}
      <PageHeader
        icon={<CreditCard className="w-6 h-6 animate-pulse" />}
        title="Pay Fees"
        subtitle="Secure online payment system for TGPCOP students and council activities."
        breadcrumb="Pay Fees"
      />

      <div className="relative z-10 max-w-xl mx-auto px-4 sm:px-6 mt-12 space-y-6">
        {/* Security Alert Header */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-start space-x-3 backdrop-blur-md">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500 animate-pulse" />
          <div>
            <p className="font-display font-bold text-sm mb-0.5 text-emerald-400">
              🔒 Official & Secured Gateway
            </p>
            <p className="text-white/60 text-xs font-sans">
              This is the official payment collection portal for Tulsiramji Gaikwad Patil College of Pharmacy. All transactions are fully encrypted.
            </p>
          </div>
        </div>

        {/* Dynamic Payment Form */}
        <PaymentForm />
      </div>
    </div>
  );
};

export default Pay;
