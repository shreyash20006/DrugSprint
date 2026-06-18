import React, { useState } from 'react';
import { ShieldCheck, FileText, Eye, Lock, Database, Globe } from 'lucide-react';

const TABS = [
  { id: 'privacy', label: 'Privacy', icon: Lock },
  { id: 'terms', label: 'Terms', icon: FileText },
];

export const Terms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Legal Center
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Policies & Terms
        </h2>
      </section>

      {/* Tab Switcher */}
      <div className="flex bg-[#0F1E42]/80 border border-white/5 rounded-xl p-1 w-full max-w-[240px]">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 flex items-center justify-center space-x-1.5 py-2 rounded-lg text-xs font-display font-bold transition-all ${
              activeTab === tab.id
                ? 'bg-orange-burnt text-white'
                : 'text-white/50 hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'privacy' ? (
        <div className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-white/5">
            <Lock className="w-4.5 h-4.5 text-orange-burnt" />
            <div>
              <h2 className="font-display font-extrabold text-sm text-white">Privacy Policy</h2>
              <p className="text-white/40 text-[9px] font-sans">Effective Date: June 1, 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-white/70 text-xs leading-relaxed font-sans">
            <div>
              <h3 className="font-display font-bold text-xs text-orange-burnt mb-1.5 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5" /> <span>1. Info We Collect</span>
              </h3>
              <p>We collect student names, college details, email IDs, WhatsApp numbers, Google account meta-tokens, and transaction status logs. No bank/card information is saved.</p>
            </div>

            <div>
              <h3 className="font-display font-bold text-xs text-orange-burnt mb-1.5 flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5" /> <span>2. How We Use It</span>
              </h3>
              <p>To verify campus identities, process fee checkouts, deliver notices or payment confirmations, and maintain operational logs.</p>
            </div>

            <div>
              <h3 className="font-display font-bold text-xs text-orange-burnt mb-1.5 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5" /> <span>3. Third Parties</span>
              </h3>
              <p>Supabase (DB & Auth), Cashfree (Gateway), Brevo (Email alerts), Cloudinary (Assets hosting), Vercel (Hosting).</p>
            </div>

            <div>
              <h3 className="font-display font-bold text-xs text-orange-burnt mb-1.5 flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> <span>4. Data Security</span>
              </h3>
              <p>We enforce SSL HTTPS encryption, Supabase Row-Level Security (RLS) filters, and secure Google OAuth access control layers.</p>
            </div>

            <div className="border-t border-white/5 pt-3">
              <h3 className="font-display font-bold text-xs text-white mb-2">Support desk Contact</h3>
              <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5 space-y-1">
                <p className="text-white font-bold text-[10px]">TGPCOP Student Council</p>
                <p className="text-orange-burnt font-mono text-[10px]">contact@tgpcopcouncil.online</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex items-center space-x-3 pb-3 border-b border-white/5">
            <FileText className="w-4.5 h-4.5 text-orange-burnt" />
            <div>
              <h2 className="font-display font-extrabold text-sm text-white">Terms & Conditions</h2>
              <p className="text-white/40 text-[9px] font-sans">Last Updated: June 1, 2026</p>
            </div>
          </div>

          <div className="space-y-4 text-white/70 text-xs leading-relaxed font-sans">
            <div>
              <h3 className="font-display font-bold text-xs text-orange-burnt mb-1.5">1. Authorized Use</h3>
              <p>This dynamic payment desk and student portal is strictly for registered students of Tulsiramji Gaikwad Patil College of Pharmacy Nagpur.</p>
            </div>

            <div>
              <h3 className="font-display font-bold text-xs text-orange-burnt mb-1.5">2. Fees & Currency</h3>
              <p>All pricing listed in the checkout forms are compiled in Indian Rupees (INR). Event tickets or store printouts are subject to direct checkout amounts.</p>
            </div>

            <div>
              <h3 className="font-display font-bold text-xs text-orange-burnt mb-1.5">3. Payment Executions</h3>
              <p>Payments are executed in real-time. Council staff holds no liability for banking network downtimes at double debit checkpoints.</p>
            </div>

            <div>
              <h3 className="font-display font-bold text-xs text-orange-burnt mb-1.5">4. Governing Law</h3>
              <p>These policies are governed by state regulations of Maharashtra, India. Any disputes are under exclusive jurisdiction in Nagpur.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Terms;
