import React from 'react';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

export const Contact: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-20">
      <ScienceBackground />
      <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[50%] -right-[10%] w-[500px] h-[500px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <PageHeader 
        icon={<Mail className="w-6 h-6 animate-pulse" />}
        title="Contact Us"
        subtitle="Get in touch with the TGPCOP Student Council for support, fee verification, or campus coordination."
        breadcrumb="Contact"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact Information Cards */}
          <div className="space-y-6">
            <div className="bg-[#0D1B3E]/85 border border-white/10 backdrop-blur-[16px] rounded-2xl p-6 shadow-xl flex items-start space-x-4">
              <div className="p-3 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl text-orange-burnt">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white mb-1">Campus Location</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Tulsiramji Gaikwad Patil College of Pharmacy (TGPCOP)<br />
                  Wardha Road, Mohgaon, Nagpur,<br />
                  Maharashtra, India - 441108
                </p>
              </div>
            </div>

            <div className="bg-[#0D1B3E]/85 border border-white/10 backdrop-blur-[16px] rounded-2xl p-6 shadow-xl flex items-start space-x-4">
              <div className="p-3 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl text-orange-burnt">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white mb-1">Support Email</h3>
                <p className="text-white/60 text-sm">
                  <a href="mailto:contact@tgpcopcouncil.online" className="hover:text-orange-burnt transition-colors">
                    contact@tgpcopcouncil.online
                  </a>
                </p>
              </div>
            </div>

            <div className="bg-[#0D1B3E]/85 border border-white/10 backdrop-blur-[16px] rounded-2xl p-6 shadow-xl flex items-start space-x-4">
              <div className="p-3 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl text-orange-burnt">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white mb-1">Contact Phone</h3>
                <p className="text-white/60 text-sm">
                  <a href="tel:+919876543210" className="hover:text-orange-burnt transition-colors">
                    +91 98765 43210
                  </a>
                </p>
              </div>
            </div>

            <div className="bg-[#0D1B3E]/85 border border-white/10 backdrop-blur-[16px] rounded-2xl p-6 shadow-xl flex items-start space-x-4">
              <div className="p-3 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl text-orange-burnt">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-white mb-1">Response Time</h3>
                <p className="text-white/60 text-sm leading-relaxed">
                  Support hours: 9:00 AM — 5:00 PM (Monday to Saturday)<br />
                  Average response: Under 24 Hours
                </p>
              </div>
            </div>
          </div>

          {/* Institutional Contact Card */}
          <div className="bg-[#0D1B3E]/85 border border-white/10 backdrop-blur-[16px] rounded-2xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="font-display font-extrabold text-xl text-white uppercase tracking-wider mb-4 pb-2 border-b border-white/10">
                🏫 TGPCOP Student Council
              </h3>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                This payment collection portal is maintained and managed by the Student Council of Tulsiramji Gaikwad Patil College of Pharmacy, Nagpur. We coordinate with the accounts department to verify and record all digital student collections.
              </p>
              <p className="text-white/60 text-sm leading-relaxed">
                If you have faced a transaction debit without a corresponding success status receipt on your email, please do not worry. Reach out to the support desk with your student details and WhatsApp contact number, and we will cross-reference the ledger and manual logs instantly.
              </p>
            </div>
            <div className="mt-8 border-t border-white/10 pt-4 text-xs text-white/40 text-center italic">
              Official Academic Payment desk support channel.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
