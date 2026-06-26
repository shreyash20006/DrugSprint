import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calendar, Users, MapPin, Clock, Download,
  Loader2, CheckCircle2, AlertTriangle, CreditCard,
  Tag, FileText, Phone, Mail, GraduationCap, User,
  ChevronRight, Star, Info, ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useStudentAuth } from '../lib/StudentAuthProvider';
import { initiatePayment } from '../lib/cashfree';
import { sendAdminNotification } from '../lib/brevo';

const generateRegistrationId = () => {
  const prefix = 'TGPCOP';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
};

const generateOrderId = () => {
  return `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
};

export const ServiceDetail: React.FC = () => {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { studentProfile } = useStudentAuth();

  const [service, setService] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'payment' | 'success' | 'duplicate' | 'full' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [registrationId, setRegistrationId] = useState('');

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    college: 'TGPCOP Nagpur',
    branch: '',
    year: '',
    prn: '',
    gender: '',
    address: '',
  });

  useEffect(() => {
    if (studentProfile) {
      setForm(prev => ({
        ...prev,
        full_name: studentProfile.full_name || '',
        email: studentProfile.email || '',
        phone: studentProfile.phone || '',
        year: studentProfile.year || '',
        prn: studentProfile.prn || '',
      }));
    }
  }, [studentProfile]);

  useEffect(() => {
    const fetch = async () => {
      if (!serviceId) return;
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('services').select('*').eq('id', serviceId).single();
        if (error) throw error;
        setService(data);
      } catch {
        setService(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [serviceId]);

  const isFree = !service?.price || service.price === 0;
  const seatsLeft = service?.max_seats ? service.max_seats - (service.registered_count || 0) : null;
  const isClosed = service?.status === 'closed' || service?.status === 'sold_out' ||
    (service?.max_seats && (service.registered_count || 0) >= service.max_seats);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !serviceId) return;
    setStatus('submitting');
    setErrorMsg('');

    try {
      if (seatsLeft !== null && seatsLeft <= 0) { setStatus('full'); return; }

      // Duplicate check
      const { data: existing } = await supabase.from('registrations')
        .select('id').eq('service_id', serviceId).eq('email', form.email).maybeSingle();
      if (existing) { setStatus('duplicate'); return; }

      const regId = generateRegistrationId();
      const orderId = generateOrderId();

      if (isFree) {
        // Free: insert directly
        const { error } = await supabase.from('registrations').insert({
          service_id: serviceId,
          registration_id: regId,
          order_id: orderId,
          full_name: form.full_name,
          email: form.email,
          phone: form.phone,
          college: form.college,
          branch: form.branch,
          year: form.year,
          prn: form.prn || null,
          gender: form.gender,
          address: form.address,
          payment_status: 'completed',
          amount_paid: 0,
          user_id: studentProfile?.id || null,
        });
        if (error) throw error;
        // Increment count
        await supabase.from('services').update({ registered_count: (service.registered_count || 0) + 1 }).eq('id', serviceId);
        setRegistrationId(regId);
        setStatus('success');
        await sendConfirmationEmail(regId, 0);
        return;
      }

      // Paid: initiate Cashfree
      setStatus('payment');
      const result = await initiatePayment({
        studentName: form.full_name,
        studentEmail: form.email,
        studentPhone: form.phone,
        amount: service.discount_price || service.price,
        purpose: service.name,
        description: `Registration for ${service.name}`,
        recordId: serviceId,
      });

      const paymentId = result?.razorpay_payment_id || result?.cfOrderId || orderId;

      // Insert registration
      const { error: regErr } = await supabase.from('registrations').insert({
        service_id: serviceId,
        registration_id: regId,
        order_id: orderId,
        payment_id: paymentId,
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        college: form.college,
        branch: form.branch,
        year: form.year,
        prn: form.prn || null,
        gender: form.gender,
        address: form.address,
        payment_status: 'completed',
        amount_paid: service.discount_price || service.price,
        user_id: studentProfile?.id || null,
      });
      if (regErr) throw regErr;

      // Increment count
      await supabase.from('services').update({ registered_count: (service.registered_count || 0) + 1 }).eq('id', serviceId);

      // Log to payments table
      await supabase.from('payments').insert({
        student_name: form.full_name,
        student_email: form.email,
        student_phone: form.phone,
        student_year: form.year,
        purpose: service.name,
        amount: service.discount_price || service.price,
        payment_id: paymentId,
        status: 'completed',
        receipt_sent: false,
      });

      setRegistrationId(regId);
      setStatus('success');
      await sendConfirmationEmail(regId, service.discount_price || service.price);
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err.message || 'Registration failed. Please try again.');
      setStatus('error');
    }
  };

  const sendConfirmationEmail = async (regId: string, amount: number) => {
    try {
      await sendAdminNotification({
        subject: `✅ Registration Confirmed: ${service?.name}`,
        title: 'Registration Successful',
        bodyHtml: `<p>Dear <b>${form.full_name}</b>,</p>
          <p>Your registration for <b>${service?.name}</b> has been confirmed.</p>
          <p><b>Registration ID:</b> ${regId}</p>
          <p><b>Amount Paid:</b> ${amount === 0 ? 'Free' : '₹' + amount}</p>
          <p>Thank you for registering with TGPCOP Student Council.</p>`,
      });
    } catch { /* non-critical */ }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] pt-32 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[var(--pw-purple)] animate-spin" />
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] pt-32 flex flex-col items-center justify-center text-center px-4">
        <AlertTriangle className="w-12 h-12 text-[var(--pw-orange)] mb-4" />
        <h2 className="font-display font-extrabold text-2xl text-[var(--text-primary)] mb-2">Service Not Found</h2>
        <p className="text-[var(--text-secondary)] text-sm mb-6">This service does not exist or has been removed.</p>
        <Link to="/services" className="flex items-center gap-2 text-[var(--pw-purple)] font-display font-bold text-sm hover:underline">
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </Link>
      </div>
    );
  }

  // Success screen
  if (status === 'success') {
    return (
      <div className="min-h-screen bg-[var(--bg-base)] pt-32 pb-20 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[var(--bg-card)] border border-emerald-500/25 rounded-2xl p-8 max-w-md w-full text-center shadow-2xl"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 animate-pulse" />
          </div>
          <h2 className="font-display font-extrabold text-2xl text-[var(--text-primary)] mb-2">Registration Confirmed! 🎉</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-4">
            You have successfully registered for <strong>{service.name}</strong>.
          </p>
          <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 mb-6">
            <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Registration ID</span>
            <span className="font-mono font-bold text-[var(--pw-purple)] text-sm">{registrationId}</span>
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-6">
            A confirmation has been sent to <strong>{form.email}</strong>. Keep your Registration ID safe for reference.
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/services')}
              className="flex-1 py-3 rounded-xl border border-[var(--border-mid)] text-[var(--text-secondary)] font-display text-xs font-bold uppercase tracking-wide hover:bg-[var(--bg-surface)] transition-colors"
            >
              Browse More
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex-1 py-3 rounded-xl bg-[var(--pw-purple)] text-white font-display text-xs font-bold uppercase tracking-wide hover:bg-[var(--pw-purple-dark)] transition-colors"
            >
              My Registrations
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] pt-28 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <Link to="/services" className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--pw-purple)] font-display text-sm font-bold mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Services
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Service Info */}
          <div className="lg:col-span-3 space-y-6">
            {/* Banner */}
            {(service.banner_image || service.thumbnail) && (
              <div className="h-64 rounded-2xl overflow-hidden border border-[var(--border-subtle)]">
                <img src={service.banner_image || service.thumbnail} alt={service.name} className="w-full h-full object-cover" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border bg-[var(--pw-purple)]/10 text-[var(--pw-purple)] border-[var(--pw-purple)]/25">
                  {service.category}
                </span>
                {service.is_featured && (
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded-full bg-[var(--pw-yellow)] text-[#0D0B1E] flex items-center gap-1">
                    <Star className="w-2.5 h-2.5" /> Featured
                  </span>
                )}
              </div>
              <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-[var(--text-primary)] leading-tight mb-3">
                {service.name}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{service.description}</p>
            </div>

            {/* Meta info grid */}
            <div className="grid grid-cols-2 gap-3">
              {service.registration_close && (
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-3">
                  <Clock className="w-4 h-4 text-[var(--pw-purple)] shrink-0" />
                  <div>
                    <span className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Deadline</span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {new Date(service.registration_close).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              )}
              {service.max_seats && (
                <div className="flex items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-3">
                  <Users className="w-4 h-4 text-[var(--pw-purple)] shrink-0" />
                  <div>
                    <span className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Seats Left</span>
                    <span className="text-xs font-bold text-[var(--text-primary)]">
                      {Math.max(0, service.max_seats - (service.registered_count || 0))} / {service.max_seats}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Secure badge */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 text-xs">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Secure payment powered by Cashfree · SSL encrypted · Instant confirmation</span>
            </div>
          </div>

          {/* Right: Registration Form */}
          <div className="lg:col-span-2">
            <div className="bg-[var(--bg-card)] border border-[var(--border-mid)] rounded-2xl p-6 sticky top-28" style={{ boxShadow: 'var(--card-shadow)' }}>
              {/* Price */}
              <div className="mb-5 pb-5 border-b border-[var(--border-subtle)]">
                <span className="block text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Registration Fee</span>
                {isFree ? (
                  <span className="font-display font-extrabold text-2xl text-[var(--pw-green)]">Free</span>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="font-display font-extrabold text-2xl text-[var(--pw-purple)]">₹{service.discount_price || service.price}</span>
                    {service.discount_price && service.discount_price < service.price && (
                      <span className="text-sm text-[var(--text-muted)] line-through">₹{service.price}</span>
                    )}
                  </div>
                )}
                {service.currency && <span className="text-[10px] text-[var(--text-muted)]">{service.currency}</span>}
              </div>

              {/* Status alerts */}
              <AnimatePresence>
                {status === 'duplicate' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-500 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    You have already registered with this email address.
                  </motion.div>
                )}
                {status === 'full' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Sorry, all seats have been filled.
                  </motion.div>
                )}
                {status === 'error' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-3 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    {errorMsg || 'An error occurred. Please try again.'}
                  </motion.div>
                )}
              </AnimatePresence>

              {isClosed ? (
                <div className="text-center py-6 text-[var(--text-muted)] text-sm font-display font-bold">
                  Registrations are closed for this service.
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-3">
                  {/* Full Name */}
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <input required type="text" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})}
                        placeholder="Your full name"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-mid)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs outline-none focus:border-[var(--pw-purple)] transition-colors" />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                        placeholder="your@email.com"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-mid)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs outline-none focus:border-[var(--pw-purple)] transition-colors" />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Phone Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <input required type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                        placeholder="+91 9876543210"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-mid)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs outline-none focus:border-[var(--pw-purple)] transition-colors" />
                    </div>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Academic Year *</label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <select required value={form.year} onChange={e => setForm({...form, year: e.target.value})}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[var(--border-mid)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs outline-none focus:border-[var(--pw-purple)] transition-colors appearance-none">
                        <option value="">Select Year</option>
                        <option>D.Pharm I Year</option>
                        <option>D.Pharm II Year</option>
                        <option>B.Pharm I Year</option>
                        <option>B.Pharm II Year</option>
                        <option>B.Pharm III Year</option>
                        <option>B.Pharm IV Year</option>
                        <option>M.Pharm</option>
                      </select>
                    </div>
                  </div>

                  {/* PRN (optional) */}
                  <div>
                    <label className="block text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1.5">PRN (optional)</label>
                    <input type="text" value={form.prn} onChange={e => setForm({...form, prn: e.target.value})}
                      placeholder="University PRN number"
                      className="w-full px-3 py-2.5 rounded-xl border border-[var(--border-mid)] bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs outline-none focus:border-[var(--pw-purple)] transition-colors" />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={status === 'submitting' || status === 'payment'}
                    className="w-full py-3.5 rounded-xl bg-[var(--pw-purple)] hover:bg-[var(--pw-purple-dark)] text-white font-display text-xs font-bold uppercase tracking-wide shadow-md disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-2"
                  >
                    {(status === 'submitting' || status === 'payment') ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> {status === 'payment' ? 'Processing Payment...' : 'Submitting...'}</>
                    ) : isFree ? (
                      <><CheckCircle2 className="w-4 h-4" /> Register for Free</>
                    ) : (
                      <><CreditCard className="w-4 h-4" /> Pay ₹{service.discount_price || service.price} & Register</>
                    )}
                  </button>

                  <p className="text-center text-[9px] text-[var(--text-muted)] leading-relaxed pt-1">
                    By registering, you agree to our <Link to="/terms" className="text-[var(--pw-purple)] hover:underline">Terms</Link> and <Link to="/refunds" className="text-[var(--pw-purple)] hover:underline">Refund Policy</Link>.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
