import React from 'react';
import { Mail, Phone, MapPin, Clock, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export const Contact: React.FC = () => {
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <section className="space-y-1.5 pt-4">
        <div className="flex items-center gap-2">
          <Mail className="w-5 h-5 text-orange-burnt animate-pulse" />
          <span className="font-display text-xs font-bold text-orange-burnt tracking-widest uppercase">
            Get In Touch
          </span>
        </div>
        <h2 className="font-display font-extrabold text-2xl text-white tracking-tight">
          Support Desk
        </h2>
        <p className="font-sans text-sm text-white/60 leading-relaxed">
          Contact the TGPCOP Student Council for payment issues, events coordination, or portal bugs.
        </p>
      </section>

      {/* Info Cards Stack */}
      <div className="space-y-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-start space-x-4 shadow-md"
        >
          <div className="p-3 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl text-orange-burnt shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-sm text-white">Campus Location</h3>
            <p className="text-white/60 text-xs leading-relaxed font-sans">
              Tulsiramji Gaikwad Patil College of Pharmacy (TGPCOP)<br />
              Wardha Road, Mohgaon, Nagpur,<br />
              Maharashtra, India - 441108
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-start space-x-4 shadow-md"
        >
          <div className="p-3 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl text-orange-burnt shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-sm text-white">Support Email</h3>
            <p className="text-orange-burnt text-xs font-mono font-bold">
              <a href="mailto:contact@tgpcopcouncil.online">
                contact@tgpcopcouncil.online
              </a>
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-start space-x-4 shadow-md"
        >
          <div className="p-3 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl text-orange-burnt shrink-0">
            <Phone className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-sm text-white">Contact Phone</h3>
            <p className="text-orange-burnt text-xs font-mono font-bold">
              <a href="tel:+919876543210">
                +91 98765 43210
              </a>
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#0F1E42]/80 backdrop-blur-xl border border-white/10 p-5 rounded-2xl flex items-start space-x-4 shadow-md"
        >
          <div className="p-3 bg-orange-burnt/10 border border-orange-burnt/20 rounded-xl text-orange-burnt shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="font-display font-bold text-sm text-white">Office Hours</h3>
            <p className="text-white/60 text-xs leading-relaxed font-sans">
              9:00 AM — 5:00 PM (Monday to Saturday)<br />
              Average response timeline: Under 24 Hours
            </p>
          </div>
        </motion.div>
      </div>

      {/* Info Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[#0F1E42]/50 border border-white/5 p-5 rounded-2xl space-y-3"
      >
        <div className="flex items-center space-x-2 text-white/90">
          <ShieldAlert className="w-4.5 h-4.5 text-orange-burnt shrink-0" />
          <h4 className="font-display font-bold text-xs uppercase tracking-wide">Academic Payment desk Support</h4>
        </div>
        <p className="text-white/60 text-xs leading-relaxed font-sans">
          This dynamic collection system is maintained by the Student Council. If a transaction fails or you faced double debit, reach out to the support desk above.
        </p>
      </motion.div>
    </div>
  );
};

export default Contact;
