import React from 'react';
import { RotateCcw } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

export const Refunds: React.FC = () => {
  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-20">
      <ScienceBackground />
      <div className="absolute top-[20%] -left-[10%] w-[500px] h-[500px] rounded-full ambient-orb-orange z-0 pointer-events-none" />
      <div className="absolute top-[50%] -right-[10%] w-[500px] h-[500px] rounded-full ambient-orb-gold z-0 pointer-events-none" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <PageHeader 
        icon={<RotateCcw className="w-6 h-6 animate-pulse" />}
        title="Refunds & Cancellations"
        subtitle="Policy outlining cancellation request timelines, refund execution, and dispute resolution."
        breadcrumb="Refunds"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 relative z-10">
        <div className="bg-[#0D1B3E]/85 border border-white/10 backdrop-blur-[16px] rounded-2xl p-8 shadow-xl text-white space-y-6">
          
          <div>
            <h3 className="font-display font-bold text-lg text-orange-burnt mb-2">1. Cancellation Requests</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              We understand that academic schedules or campus events might clash with personal emergencies. If you have registered and paid for an event (such as cultural events, industrial tours, or pharmacotherapy quizzes) and wish to cancel your slot:
            </p>
            <ul className="list-disc list-inside text-white/70 text-sm leading-relaxed mt-2 pl-4 space-y-1">
              <li>Cancellation requests must be submitted at least **48 Hours** prior to the scheduled event start.</li>
              <li>Requests received within 48 hours of the event start will not be eligible for standard cancellation.</li>
              <li>To cancel, email your digital receipt, transaction ID, and registered details to <a href="mailto:president@tgpcop.com" className="hover:text-orange-burnt transition-colors">president@tgpcop.com</a>.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg text-orange-burnt mb-2">2. Fee Refund Policy</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Approved cancellations will receive a full refund of the registration fee, minus any transaction charges levied by the third-party payment gateway. Refunds are processed back to the original source card, bank account, or UPI handle.
            </p>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg text-orange-burnt mb-2">3. Study Store & Materials</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              For payments related to study store printouts, handbook templates, or question banks:
            </p>
            <ul className="list-disc list-inside text-white/70 text-sm leading-relaxed mt-2 pl-4 space-y-1">
              <li>Digital download items or handbooks already processed cannot be cancelled or refunded under any ordinary circumstances.</li>
              <li>If the printed physical material received by the student contains binding damage or blank pages, we will provide a free physical replacement copy at the council office desk within 2 working days. No cash refunds will be executed for printed materials.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg text-orange-burnt mb-2">4. Double Debits & Transaction Drops</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              If your bank account was debited multiple times or an extra amount was processed due to technical latency during checkout:
            </p>
            <ul className="list-disc list-inside text-white/70 text-sm leading-relaxed mt-2 pl-4 space-y-1">
              <li>The excess debited amount is usually reversed automatically by your bank within 3 working days.</li>
              <li>If the reversal does not occur, please submit an issue request through the contact page with your bank statement transaction ID. Once verified, we will trigger a refund request immediately.</li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg text-orange-burnt mb-2">5. Refund Processing Timeline</h3>
            <p className="text-white/70 text-sm leading-relaxed">
              Once an approved refund is triggered in our Cashfree portal dashboard, the processing timeline depends entirely on the banking rails and your bank.
            </p>
            <ul className="list-disc list-inside text-white/70 text-sm leading-relaxed mt-2 pl-4 space-y-1">
              <li>**Card Payments**: 5 to 7 working days.</li>
              <li>**UPI Checkout**: 2 to 3 working days.</li>
              <li>**Net Banking**: 4 to 5 working days.</li>
            </ul>
          </div>

          <div className="border-t border-white/10 pt-4 flex justify-between items-center text-xs text-white/40 font-semibold italic">
            <span>Last Updated: May 31, 2026</span>
            <span>TGPCOP Campus Accounts Desk</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Refunds;
