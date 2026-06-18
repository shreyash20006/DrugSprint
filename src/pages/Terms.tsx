import React, { useState } from 'react';
import { ShieldCheck, FileText, Eye, Lock, Database, Globe, Mail } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

const TABS = [
  { id: 'privacy', label: 'Privacy Policy', icon: Lock },
  { id: 'terms', label: 'Terms & Conditions', icon: FileText },
];

export const Terms: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>('privacy');

  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-20">
      <ScienceBackground />
      <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[50%] -right-[10%] w-[500px] h-[500px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <PageHeader 
        icon={<ShieldCheck className="w-6 h-6 animate-pulse" />}
        title="Legal Policies"
        subtitle="Privacy Policy and Terms & Conditions governing the TGPCOP Student Council Portal."
        breadcrumb="Legal"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10">

        {/* Tab Switcher */}
        <div className="flex bg-[#0D1B3E]/60 border border-white/10 rounded-xl p-1 mb-8 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 px-5 py-2.5 rounded-lg text-sm font-display font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-orange-burnt text-white shadow-md'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Privacy Policy Tab */}
        {activeTab === 'privacy' && (
          <div className="bg-[#0D1B3E]/85 border border-white/10 backdrop-blur-[16px] rounded-2xl p-8 shadow-xl text-white space-y-6">

            <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-orange-burnt/10 border border-orange-burnt/20 flex items-center justify-center">
                <Lock className="w-5 h-5 text-orange-burnt" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-xl text-white">Privacy Policy</h2>
                <p className="text-white/40 text-xs font-sans">Effective Date: June 1, 2026</p>
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2 flex items-center space-x-2">
                <Eye className="w-4 h-4" /> <span>1. Information We Collect</span>
              </h3>
              <p className="text-white/70 text-sm leading-relaxed mb-2">
                When you use the TGPCOP Student Council Portal, we may collect the following information:
              </p>
              <ul className="list-disc list-inside text-white/70 text-sm leading-relaxed pl-4 space-y-1">
                <li><strong className="text-white/90">Personal Identity:</strong> Full name, college enrollment number, academic year, and branch/division.</li>
                <li><strong className="text-white/90">Contact Details:</strong> Email address and WhatsApp mobile number provided during registration or payment.</li>
                <li><strong className="text-white/90">Google Account Info:</strong> When you sign in via Google OAuth, we receive your email address, profile name, and profile picture from Google. We do <em>not</em> receive your Google password.</li>
                <li><strong className="text-white/90">Payment Metadata:</strong> Transaction ID, payment status, and amount (processed via Cashfree). We do <strong className="text-white/90">not</strong> store card numbers, CVVs, UPI PINs, or net banking credentials.</li>
                <li><strong className="text-white/90">Usage Data:</strong> Pages visited, actions performed in the admin panel (for authorized staff only), and timestamps.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2 flex items-center space-x-2">
                <Database className="w-4 h-4" /> <span>2. How We Use Your Information</span>
              </h3>
              <ul className="list-disc list-inside text-white/70 text-sm leading-relaxed pl-4 space-y-1">
                <li>To verify your identity as a registered TGPCOP student or authorized council member.</li>
                <li>To process event registrations, fee collections, and payment receipts.</li>
                <li>To send transactional email notifications (receipts, confirmations, notices) via Brevo.</li>
                <li>To enable role-based access for council staff to manage portal content.</li>
                <li>To maintain audit logs of administrative actions for institutional governance.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2 flex items-center space-x-2">
                <Globe className="w-4 h-4" /> <span>3. Third-Party Services</span>
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                We use the following trusted third-party services, each governed by their own privacy policies:
              </p>
              <ul className="list-disc list-inside text-white/70 text-sm leading-relaxed mt-2 pl-4 space-y-1">
                <li><strong className="text-white/90">Supabase</strong> — Database and authentication hosting (GDPR compliant).</li>
                <li><strong className="text-white/90">Google OAuth</strong> — Secure sign-in for authorized council members.</li>
                <li><strong className="text-white/90">Cashfree</strong> — PCI-DSS compliant payment gateway for Indian transactions.</li>
                <li><strong className="text-white/90">Brevo (Sendinblue)</strong> — Transactional email delivery.</li>
                <li><strong className="text-white/90">Cloudinary</strong> — Secure media/image hosting for gallery content.</li>
                <li><strong className="text-white/90">Vercel</strong> — Application hosting and deployment.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4" /> <span>4. Data Security</span>
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                All data is transmitted over HTTPS (TLS encryption). Supabase applies Row-Level Security (RLS) policies to ensure that users can only access data they are authorized to view. Admin panel access is restricted to authenticated Google Workspace and Google account holders with assigned roles.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2">5. Data Retention</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Student registration and payment records are retained for the current academic year plus one additional year for audit compliance. Google OAuth session tokens are managed by Supabase and expire automatically. You may request deletion of your personal data by contacting us at the email below.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2">6. Your Rights</h3>
              <ul className="list-disc list-inside text-white/70 text-sm leading-relaxed pl-4 space-y-1">
                <li>Right to access the personal data we hold about you.</li>
                <li>Right to request correction of inaccurate information.</li>
                <li>Right to request deletion of your personal data (subject to legal/audit obligations).</li>
                <li>Right to withdraw consent for non-essential data processing at any time.</li>
              </ul>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2 flex items-center space-x-2">
                <Mail className="w-4 h-4" /> <span>7. Contact Us</span>
              </h3>
              <p className="text-white/70 text-sm leading-relaxed">
                For any privacy-related queries, data access requests, or concerns, please contact:
              </p>
              <div className="mt-2 p-3 bg-white/[0.03] rounded-lg border border-white/5 text-sm space-y-1">
                <p className="text-white font-bold">TGPCOP Student Council</p>
                <p className="text-white/60">Tulsiramji Gaikwad Patil College of Pharmacy, Nagpur</p>
                <p className="text-orange-burnt font-mono">contact@tgpcopcouncil.online</p>
                <p className="text-white/60">Website: <a href="https://www.tgpcopcouncil.online" className="text-orange-burnt hover:underline">www.tgpcopcouncil.online</a></p>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xs text-white/40 font-semibold italic">
              <span>Effective: June 1, 2026</span>
              <span>TGPCOP Student Council</span>
            </div>
          </div>
        )}

        {/* Terms & Conditions Tab */}
        {activeTab === 'terms' && (
          <div className="bg-[#0D1B3E]/85 border border-white/10 backdrop-blur-[16px] rounded-2xl p-8 shadow-xl text-white space-y-6">

            <div className="flex items-center space-x-3 pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-xl bg-orange-burnt/10 border border-orange-burnt/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-orange-burnt" />
              </div>
              <div>
                <h2 className="font-display font-extrabold text-xl text-white">Terms & Conditions</h2>
                <p className="text-white/40 text-xs font-sans">Last Updated: June 1, 2026</p>
              </div>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2">1. Introduction</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Welcome to the TGPCOP Student Council payment gateway portal. These Terms and Conditions govern your use of this digital portal for payment of NSS fees, academic quiz registrations, industrial visit collections, study materials purchase, and other council fees. By using this service, you agree to comply with and be bound by these terms.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2">2. Authorized Use & Student Identity</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                This payment collection system is strictly for students currently registered under Tulsiramji Gaikwad Patil College of Pharmacy (TGPCOP), Nagpur. When completing a payment transaction, you must provide your true legal name, current academic year, active email ID, and WhatsApp mobile number. Providing false identity credentials will result in payment cancellation and campus disciplinary procedures.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2">3. Transaction Currency & Pricing</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                All transaction values, event ticket fees, registration amounts, and store items listed on this website are denominated and processed strictly in <strong className="text-white/90">Indian Rupees (INR)</strong>. The total fee to be paid will be shown on the checkout portal before finalizing the payment session.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2">4. Payment Gateway & Third-Party Processing</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                We leverage Cashfree Payment Gateway to execute dynamic online checkout flows. We do not store or compile direct credit/debit card numbers, CVVs, net banking credentials, or UPI PINs on our servers. Processing security is managed in compliance with PCI-DSS guidelines by Cashfree.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2">5. Google OAuth & Account Access</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                Council staff members access the admin panel via Google OAuth (Sign in with Google). By signing in, you authorize TGPCOP Student Council to receive your basic Google profile information (name, email, profile picture). This information is used solely for authentication and role assignment within the portal. We do not post to your Google account or access any other Google services.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2">6. Limitation of Liability</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                The TGPCOP Student Council holds no liability for transaction failures occurring due to bank downtime, network connection drops at checkout, or invalid customer credentials. If your account was debited but the ledger logs a pending status, please contact support before attempting another transaction.
              </p>
            </div>

            <div>
              <h3 className="font-display font-bold text-base text-orange-burnt mb-2">7. Governing Law</h3>
              <p className="text-white/70 text-sm leading-relaxed">
                These terms are governed by and construed in accordance with the laws of Maharashtra, India. Any disputes arising from transactions on this website are subject to the exclusive jurisdiction of the competent courts in Nagpur, Maharashtra.
              </p>
            </div>

            <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xs text-white/40 font-semibold italic">
              <span>Last Updated: June 1, 2026</span>
              <span>TGPCOP Campus Admin Desk</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Terms;
