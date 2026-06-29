import { Link } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { sendAdminNotification } from '../lib/brevo';
import { 
  Heart, Calendar, MapPin, Gift, Award, CheckCircle2, 
  AlertTriangle, ArrowLeft, Loader2, User, Phone, Mail, 
  GraduationCap, Sparkles, ShieldCheck, HeartHandshake
} from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { ScienceBackground } from '../components/ScienceBackground';

export const BloodDonation: React.FC = () => {
  const eventId = 'b100dda7-ea02-4026-b104-d0ae7e11fe26'; // Fixed UUID for the event
  const [event, setEvent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'duplicate' | 'full' | 'error'>('idle');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [year, setYear] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
        if (!error && data) setEvent(data);
      } catch (err) {
        console.error('Error fetching blood donation event:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvent();
  }, []);

  const capacity = event?.capacity || 200;
  const registeredCount = event?.registered_count || 0;
  const seatsLeft = Math.max(0, capacity - registeredCount);
  const progressPercent = Math.min(100, (registeredCount / capacity) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !year) return;
    setIsSubmitting(true);
    setStatus('idle');

    try {
      // Check duplicate
      const { data: existing } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('email', email)
        .maybeSingle();

      if (existing) {
        setStatus('duplicate');
        setIsSubmitting(false);
        return;
      }

      // Insert registration
      const { error: insertError } = await supabase.from('event_registrations').insert({
        event_id: eventId,
        full_name: fullName,
        email,
        whatsapp,
        year,
      });

      if (insertError) throw insertError;

      // Update event registered count
      const newCount = registeredCount + 1;
      await supabase
        .from('events')
        .update({ registered_count: newCount })
        .eq('id', eventId);

      setEvent(prev => prev ? { ...prev, registered_count: newCount } : null);
      setStatus('success');

      // Send confirmation notification
      try {
        await sendAdminNotification({
          subject: `🩸 Blood Donor Registration: ${fullName}`,
          title: 'New Blood Donor Registered',
          bodyHtml: `
            <p>A new donor has signed up for the <b>Blood Donation Drive 2026</b>!</p>
            <hr style="border:0;border-top:1px solid rgba(255,255,255,0.1);margin:15px 0;" />
            <ul>
              <li><b>Full Name:</b> ${fullName}</li>
              <li><b>Academic Year:</b> ${year}</li>
              <li><b>Email:</b> ${email}</li>
              <li><b>WhatsApp/Contact:</b> ${whatsapp || 'N/A'}</li>
            </ul>
          `,
        });
      } catch (err) {
        console.warn('Failed to send admin notification:', err);
      }

    } catch (err: any) {
      console.error('Registration error:', err);
      setStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050B18] overflow-hidden pb-24 pt-32 animate-in fade-in duration-500">
      <ScienceBackground />
      {/* Ambient orbs */}
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] rounded-full ambient-orb-orange z-0 pointer-events-none opacity-40" />
      <div className="absolute bottom-[20%] left-[10%] w-[350px] h-[350px] rounded-full ambient-orb-gold z-0 pointer-events-none opacity-40" />
      <div className="absolute inset-0 grid-bg-overlay opacity-15 z-0 pointer-events-none" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <Link to="/events" className="inline-flex items-center space-x-1.5 text-white/50 hover:text-orange-burnt font-display text-xs sm:text-sm font-extrabold mb-8 transition-all hover:-translate-x-0.5">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Events</span>
        </Link>

        {/* Campaign Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-red-500/20 shadow-2xl bg-[#090E23]/60 backdrop-blur-md p-8 sm:p-12 mb-12">
          {/* Decorative Blood Drop Background Vector */}
          <div className="absolute right-8 bottom-0 opacity-10 pointer-events-none">
            <Heart className="w-64 h-64 text-red-600 fill-current animate-pulse" />
          </div>

          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-xs font-bold uppercase tracking-widest">
              <Heart className="w-3.5 h-3.5 animate-bounce fill-current" />
              <span>DONATE BLOOD, DONATE LIFE</span>
            </div>
            
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl text-white leading-tight">
              Blood Donation Drive 2026
            </h1>
            
            <p className="font-display text-xl text-orange-burnt font-bold">
              Be a Hero. Save a Life.
            </p>
            
            <p className="font-sans text-sm sm:text-base text-white/70 leading-relaxed max-w-2xl">
              This is to inform all students that a Blood Donation Drive is being organized by 
              Tulsiramji Gaikwad-Patil College of Pharmacy (TGPCOP) on 1 July 2026. 
              All eligible donors are encouraged to come forward. Send your details today and be a lifesaver!
            </p>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-6 pt-4 text-xs sm:text-sm font-semibold text-white/90">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                <span>Date: 1 July 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                <span>Venue: TGPCOP Campus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Why Donate & Rewards (7 columns) */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Why Donate Blood Card */}
            <div className="glass-panel border border-white/5 rounded-2xl p-6 sm:p-8 bg-[#0F1E42]/10 space-y-6">
              <h2 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
                <HeartHandshake className="w-5 h-5 text-red-500" />
                <span>Why Donate Blood?</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                  <span className="text-xl">❤️</span>
                  <h3 className="font-display font-bold text-sm text-white">Save Up to 3 Lives</h3>
                  <p className="font-sans text-xs text-white/50 leading-relaxed">
                    1 single donation can save up to 3 lives. Your contribution has a massive impact!
                  </p>
                </div>
                
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                  <span className="text-xl">🚑</span>
                  <h3 className="font-display font-bold text-sm text-white">Helps in Emergencies</h3>
                  <p className="font-sans text-xs text-white/50 leading-relaxed">
                    Supports crucial surgeries, trauma cases, and patients fighting cancer or blood disorders.
                  </p>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                  <span className="text-xl">🤝</span>
                  <h3 className="font-display font-bold text-sm text-white">Support Your Community</h3>
                  <p className="font-sans text-xs text-white/50 leading-relaxed">
                    Strengthen local medical reserves and inspire your fellow students to do the same.
                  </p>
                </div>

                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                  <span className="text-xl">🩺</span>
                  <h3 className="font-display font-bold text-sm text-white">Good for Your Health</h3>
                  <p className="font-sans text-xs text-white/50 leading-relaxed">
                    Helps in maintaining healthy iron levels, improves cardiovascular health, and stimulates new blood cell production.
                  </p>
                </div>
              </div>

              <div className="border-t border-white/5 pt-4 flex items-center justify-between text-xs text-white/60">
                <span className="font-bold text-red-400">1 DONATION CAN SAVE 2-3 LIVES!</span>
                <span>All eligible donors are welcome.</span>
              </div>
            </div>

            {/* Donor Incentives / Rewards */}
            <div className="glass-panel border border-white/5 rounded-2xl p-6 sm:p-8 bg-[#0F1E42]/10 space-y-6">
              <h2 className="font-display font-extrabold text-lg text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-orange-burnt" />
                <span>After Donation, You Will Receive:</span>
              </h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-orange-burnt/10 border border-orange-burnt/25 flex items-center justify-center text-orange-burnt shrink-0">
                    <span className="font-bold text-xs">1</span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-white">Energy Refreshments</h4>
                    <p className="font-sans text-xs text-white/50 leading-relaxed">
                      Healthy post-donation drinks and snacks to help you recover your energy immediately.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-orange-burnt/10 border border-orange-burnt/25 flex items-center justify-center text-orange-burnt shrink-0">
                    <span className="font-bold text-xs">2</span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-white">Water Bottle / Office Tiffin Box</h4>
                    <p className="font-sans text-xs text-white/50 leading-relaxed">
                      A premium, customized utility souvenir gift as a token of appreciation from the council.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-orange-burnt/10 border border-orange-burnt/25 flex items-center justify-center text-orange-burnt shrink-0">
                    <span className="font-bold text-xs">3</span>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-sm text-white">Blood Donation Card</h4>
                    <p className="font-sans text-xs text-white/50 leading-relaxed">
                      Applicable in future emergency needs for discounts or priority allocation when the donor or their immediate family requires blood.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Registration Form (5 columns) */}
          <div className="lg:col-span-5">
            <div className="glass-panel glow-card border border-white/5 rounded-2xl p-6 sm:p-8 bg-[#0F1E42]/10 space-y-6 relative">
              <div className="flex items-center space-x-2 pb-4 border-b border-white/5">
                <Sparkles className="w-5 h-5 text-red-500 animate-pulse" />
                <h2 className="font-display font-extrabold text-lg text-white">Register as a Donor</h2>
              </div>

              {/* Progress of targets */}
              {!isLoading && event && (
                <div className="space-y-1 bg-white/[0.02] p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-white/40">
                    <span>Registered Donors</span>
                    <span>{registeredCount} / {capacity}</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <div className="text-[10px] text-right text-red-400 font-bold">
                    {seatsLeft} donor slots left!
                  </div>
                </div>
              )}

              {/* Form Content / Success Screen */}
              <AnimatePresence mode="wait">
                {status === 'success' ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-6 space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto text-emerald-400">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-extrabold text-lg text-white">Thank You, Hero! 🎉</h3>
                    <p className="font-sans text-xs text-white/70 leading-relaxed">
                      Your registration for the Blood Donation Drive is confirmed. You are officially registered to save lives.
                    </p>
                    <p className="font-sans text-[10px] text-white/40">
                      A confirmation email has been sent to <strong>{email}</strong>.
                    </p>
                  </motion.div>
                ) : (
                  <motion.form 
                    key="form"
                    onSubmit={handleSubmit} 
                    className="space-y-4"
                  >
                    {status === 'duplicate' && (
                      <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs font-semibold flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>You are already registered under this email!</span>
                      </div>
                    )}
                    {status === 'error' && (
                      <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>An error occurred. Please try again later.</span>
                      </div>
                    )}

                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="text"
                          required
                          value={fullName}
                          onChange={e => setFullName(e.target.value)}
                          placeholder="e.g. John Doe"
                          className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-xl pl-10 pr-4 py-3 text-white text-xs sm:text-sm font-sans outline-none transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          placeholder="e.g. john@example.com"
                          className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-xl pl-10 pr-4 py-3 text-white text-xs sm:text-sm font-sans outline-none transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* Contact Number */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">
                        Contact / WhatsApp Number *
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                          type="tel"
                          required
                          value={whatsapp}
                          onChange={e => setWhatsapp(e.target.value)}
                          placeholder="e.g. +91 9876543210"
                          className="w-full bg-white/5 border border-white/10 focus:border-red-500/50 rounded-xl pl-10 pr-4 py-3 text-white text-xs sm:text-sm font-sans outline-none transition-all duration-300"
                        />
                      </div>
                    </div>

                    {/* Academic Class/Year */}
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 ml-1">
                        Class / Academic Year *
                      </label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <select
                          required
                          value={year}
                          onChange={e => setYear(e.target.value)}
                          className="w-full bg-[#080F25] border border-white/10 focus:border-red-500/50 rounded-xl pl-10 pr-10 py-3 text-white text-xs sm:text-sm font-sans outline-none transition-all duration-300 appearance-none"
                        >
                          <option value="">Select Academic Year</option>
                          <option value="D.Pharm I">D.Pharm I Year</option>
                          <option value="D.Pharm II">D.Pharm II Year</option>
                          <option value="B.Pharm I">B.Pharm I Year</option>
                          <option value="B.Pharm II">B.Pharm II Year</option>
                          <option value="B.Pharm III">B.Pharm III Year</option>
                          <option value="B.Pharm IV">B.Pharm IV Year</option>
                          <option value="M.Pharm">M.Pharm</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">▼</div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || seatsLeft <= 0}
                      className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white font-display text-xs sm:text-sm font-bold uppercase tracking-wider shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 active:scale-98 transition-all hover:shadow-red-500/20 border border-white/5"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending Details...</span>
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 fill-current animate-pulse" />
                          <span>BE A HERO. SAVE A LIFE.</span>
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default BloodDonation;
