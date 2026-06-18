import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/admin/Toast';
import {
  Save, Loader2, Sparkles, RotateCw, Video, Type,
  GraduationCap, Eye, EyeOff,
} from 'lucide-react';

interface SettingRow {
  key: string;
  value: string;
}

const DEFAULTS: Record<string, string> = {
  // Master visibility
  hero_text_visible: 'true',
  hero_video_object_fit: 'contain',
  // Council Pulse
  pulse_since_year: '2003',
  pulse_programs: 'B.Pharm · D.Pharm',
  pulse_campus_city: 'Nagpur, Maharashtra',
  pulse_campus_country: 'INDIA',
  // Logo
  hero_logo_rotation_enabled: 'true',
  hero_logo_orbit_enabled: 'true',
  // About
  about_eyebrow: 'Who We Are',
  about_headline_pre: 'Leading the next wave of',
  about_headline_highlight: 'pharmacy pioneers',
  about_headline_post: 'at Nagpur.',
  about_description:
    'The Student Council of TGPCOP is the official voice of 500+ aspiring pharmacists. We balance intensive research with vibrant campus culture — from rural healthcare drives and AURA symposiums to anti-ragging networks and NotesDrive resources.',
  about_bg_video_url: '',
  about_tags: 'Anti-Ragging,Healthcare Drives,NotesDrive,AURA Symposium,Cultural Fests',
};

// ─────────────────────────────────────────────────────────────
// Stable sub-components defined OUTSIDE so they don't remount
// on every parent render (which was causing input focus loss)
// ─────────────────────────────────────────────────────────────

const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-xl bg-[#050B18]/60 border border-white/10 text-sm text-white font-sans focus:outline-none focus:border-orange-burnt/55 focus:bg-[#050B18]/85 transition-all';

interface SectionCardProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, description, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
    className="rounded-2xl bg-[#0D1B3E]/55 border border-white/[0.06] backdrop-blur-md p-6"
  >
    <div className="flex items-start gap-3 mb-5">
      <div className="w-9 h-9 rounded-lg bg-orange-burnt/12 border border-orange-burnt/25 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-display font-extrabold text-sm text-white tracking-tight">{title}</h3>
        {description && (
          <p className="text-[11px] text-white/45 font-sans mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
    <div className="space-y-4">{children}</div>
  </motion.div>
);

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">{label}</label>
    {children}
    {hint && <p className="text-[10px] text-white/35 font-sans">{hint}</p>}
  </div>
);

interface ToggleProps {
  value: string;
  onChange: (v: string) => void;
  label: string;
  description?: string;
  testId?: string;
}

const Toggle: React.FC<ToggleProps> = ({ value, onChange, label, description, testId }) => {
  const active = value === 'true';
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
      <div className="flex-1 pr-4">
        <p className="text-sm font-display font-bold text-white">{label}</p>
        {description && <p className="text-xs text-white/45 font-sans mt-0.5">{description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(active ? 'false' : 'true')}
        data-testid={testId || `toggle-${label.toLowerCase().replace(/\s/g, '-')}`}
        className={`relative w-12 h-6 rounded-full border transition-colors shrink-0 ${
          active
            ? 'bg-orange-burnt/85 border-orange-burnt'
            : 'bg-white/[0.04] border-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all ${
            active ? 'left-[26px]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export const AdminHomepageSettings: React.FC = () => {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>(DEFAULTS);
  const [studentCount, setStudentCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [settingsRes, studentsRes] = await Promise.all([
          supabase.from('settings').select('key, value'),
          supabase.from('student_verifications').select('*', { count: 'exact', head: true }),
        ]);

        if (settingsRes.data) {
          const fetched: Record<string, string> = { ...DEFAULTS };
          (settingsRes.data as SettingRow[]).forEach((row) => {
            if (Object.prototype.hasOwnProperty.call(DEFAULTS, row.key)) {
              fetched[row.key] = row.value ?? DEFAULTS[row.key];
            }
          });
          setValues(fetched);
        }
        setStudentCount(studentsRes.count || 0);
      } catch (err: any) {
        toast.error('Failed to load settings: ' + err?.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const set = (key: string, val: string) => setValues((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const rows = Object.entries(values).map(([key, value]) => ({
        key,
        value,
        updated_at: now,
      }));
      const { error } = await supabase.from('settings').upsert(rows, { onConflict: 'key' });
      if (error) throw error;
      toast.success('Homepage settings saved!');
    } catch (err: any) {
      toast.error('Save failed: ' + err?.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-white/55">
        <Loader2 className="w-9 h-9 text-orange-burnt animate-spin mb-4" strokeWidth={2.2} />
        <p className="font-display text-xs tracking-[0.22em] uppercase font-bold">Loading settings…</p>
      </div>
    );
  }

  const isTextVisible = values.hero_text_visible === 'true';

  return (
    <div className="space-y-6 max-w-5xl" data-testid="admin-homepage-settings">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-orange-burnt text-[10px] font-extrabold tracking-[0.22em] uppercase font-display">
            <span className="w-5 h-[1.5px] bg-orange-burnt" />
            <span>Live Edit · Auto-pushes to homepage</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl sm:text-3xl text-white tracking-tight leading-tight">
            Homepage Settings
          </h1>
          <p className="text-white/55 text-sm font-sans">
            Edit hero, Council Pulse, About section, logo behaviour and background media — changes appear live.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          data-testid="save-homepage-settings"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:scale-[1.02] text-white font-display text-xs font-bold uppercase tracking-[0.18em] rounded-xl shadow-lg disabled:opacity-60 transition-all"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
              Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" strokeWidth={2.4} />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Live data preview */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-500/8 to-transparent border border-emerald-500/25 p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
          <GraduationCap className="w-4 h-4 text-emerald-400" strokeWidth={2.2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.2em]">Live Database</p>
          <p className="text-sm text-white font-display font-bold">
            {studentCount} verified students currently in DB
          </p>
        </div>
      </div>

      {/* HERO VISIBILITY — Master Toggle */}
      <SectionCard
        title="Hero — Master Visibility"
        icon={isTextVisible ? <Eye className="w-4 h-4 text-orange-burnt" strokeWidth={2.4} /> : <EyeOff className="w-4 h-4 text-orange-burnt" strokeWidth={2.4} />}
        description="Hide ALL hero text, logo & CTAs — keep only the background video looping. Cinema-screen mode."
      >
        <Toggle
          value={values.hero_text_visible}
          onChange={(v) => set('hero_text_visible', v)}
          label="Show Hero Text & Logo"
          description={
            isTextVisible
              ? 'Currently SHOWING: Title, badge, CTAs, Council Pulse, logo'
              : 'Currently HIDDEN: Only background video plays — perfect for video showcase'
          }
          testId="toggle-hero-text-visible"
        />

        <Field label="Background Video — Aspect Fit" hint="Cover crops to fill • Contain shows full video natively (recommended for video bg)">
          <div className="grid grid-cols-2 gap-2">
            {(['contain', 'cover'] as const).map((fit) => (
              <button
                type="button"
                key={fit}
                onClick={() => set('hero_video_object_fit', fit)}
                data-testid={`fit-${fit}`}
                className={`px-3 py-2.5 rounded-xl border text-xs font-display font-bold uppercase tracking-[0.18em] transition-all ${
                  values.hero_video_object_fit === fit
                    ? 'bg-orange-burnt/15 border-orange-burnt/55 text-orange-burnt'
                    : 'bg-white/[0.03] border-white/[0.06] text-white/60 hover:text-white hover:border-white/15'
                }`}
              >
                {fit === 'contain' ? 'Contain · Natural' : 'Cover · Fill Screen'}
              </button>
            ))}
          </div>
        </Field>
      </SectionCard>

      {/* COUNCIL PULSE */}
      <SectionCard
        title="Council Pulse Panel"
        icon={<Sparkles className="w-4 h-4 text-orange-burnt" strokeWidth={2.4} />}
        description="Right-side panel on hero — Since year, programs, campus location."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Since (Year)" hint="e.g. 2003">
            <input
              type="text"
              value={values.pulse_since_year}
              onChange={(e) => set('pulse_since_year', e.target.value)}
              className={INPUT_CLASS}
              data-testid="pulse-since-year"
            />
          </Field>
          <Field label="Active Programs" hint="Use · as separator">
            <input
              type="text"
              value={values.pulse_programs}
              onChange={(e) => set('pulse_programs', e.target.value)}
              className={INPUT_CLASS}
              data-testid="pulse-programs"
            />
          </Field>
          <Field label="Campus City">
            <input
              type="text"
              value={values.pulse_campus_city}
              onChange={(e) => set('pulse_campus_city', e.target.value)}
              className={INPUT_CLASS}
              data-testid="pulse-campus-city"
            />
          </Field>
          <Field label="Country Label" hint="Shows in caps below city">
            <input
              type="text"
              value={values.pulse_campus_country}
              onChange={(e) => set('pulse_campus_country', e.target.value)}
              className={INPUT_CLASS}
              data-testid="pulse-campus-country"
            />
          </Field>
        </div>
      </SectionCard>

      {/* LOGO BEHAVIOUR */}
      <SectionCard
        title="Hero Logo Behaviour"
        icon={<RotateCw className="w-4 h-4 text-orange-burnt" strokeWidth={2.4} />}
        description="Control the animated TGPCOP logo on hero & navbar."
      >
        <Toggle
          value={values.hero_logo_rotation_enabled}
          onChange={(v) => set('hero_logo_rotation_enabled', v)}
          label="Spinning Gradient Ring"
          description="The conic gradient ring rotating behind the logo. Disable for a static badge look."
        />
        <Toggle
          value={values.hero_logo_orbit_enabled}
          onChange={(v) => set('hero_logo_orbit_enabled', v)}
          label="Orbiting Particles"
          description="6 orange & gold particles orbiting around the hero logo."
        />
      </SectionCard>

      {/* ABOUT SECTION */}
      <SectionCard
        title="About Section Content"
        icon={<Type className="w-4 h-4 text-orange-burnt" strokeWidth={2.4} />}
        description="The 'Leading the next wave of pharmacy pioneers at Nagpur' block."
      >
        <Field label="Eyebrow (small tag above headline)">
          <input
            type="text"
            value={values.about_eyebrow}
            onChange={(e) => set('about_eyebrow', e.target.value)}
            className={INPUT_CLASS}
            data-testid="about-eyebrow"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Headline — start">
            <input
              type="text"
              value={values.about_headline_pre}
              onChange={(e) => set('about_headline_pre', e.target.value)}
              className={INPUT_CLASS}
              data-testid="about-headline-pre"
            />
          </Field>
          <Field label="Headline — orange highlight">
            <input
              type="text"
              value={values.about_headline_highlight}
              onChange={(e) => set('about_headline_highlight', e.target.value)}
              className={`${INPUT_CLASS} text-orange-burnt`}
              data-testid="about-headline-highlight"
            />
          </Field>
          <Field label="Headline — end">
            <input
              type="text"
              value={values.about_headline_post}
              onChange={(e) => set('about_headline_post', e.target.value)}
              className={INPUT_CLASS}
              data-testid="about-headline-post"
            />
          </Field>
        </div>

        <Field label="Description Paragraph">
          <textarea
            value={values.about_description}
            onChange={(e) => set('about_description', e.target.value)}
            rows={4}
            className={`${INPUT_CLASS} resize-y leading-relaxed`}
            data-testid="about-description"
          />
        </Field>

        <Field label="Tag Chips" hint="Comma-separated. Each becomes a chip with sparkle icon.">
          <input
            type="text"
            value={values.about_tags}
            onChange={(e) => set('about_tags', e.target.value)}
            className={INPUT_CLASS}
            data-testid="about-tags"
          />
        </Field>
      </SectionCard>

      {/* BG VIDEO */}
      <SectionCard
        title="About Section Background Video"
        icon={<Video className="w-4 h-4 text-orange-burnt" strokeWidth={2.4} />}
        description="Optional looping video behind the About section. MP4/WebM/Cloudinary URL."
      >
        <Field
          label="Video URL"
          hint="Direct video URL (.mp4 / .webm) or Cloudinary video URL. Leave blank to disable."
        >
          <input
            type="url"
            value={values.about_bg_video_url}
            onChange={(e) => set('about_bg_video_url', e.target.value)}
            placeholder="https://res.cloudinary.com/.../video/upload/v.../campus.mp4"
            className={INPUT_CLASS}
            data-testid="about-bg-video-url"
          />
        </Field>

        {values.about_bg_video_url && (
          <div className="rounded-xl border border-white/[0.06] overflow-hidden bg-black">
            <video
              src={values.about_bg_video_url}
              className="w-full max-h-64 object-contain"
              autoPlay
              loop
              muted
              playsInline
            />
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/45 px-3 py-2 bg-white/[0.02]">
              Live Preview · Natural aspect ratio
            </p>
          </div>
        )}
      </SectionCard>

      {/* Sticky save button at bottom */}
      <div className="flex justify-end pt-4 border-t border-white/[0.04]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-burnt to-[#E06D2B] hover:scale-[1.02] text-white font-display text-sm font-bold uppercase tracking-[0.18em] rounded-xl shadow-lg disabled:opacity-60 transition-all"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.4} />
              Saving…
            </>
          ) : (
            <>
              <Save className="w-4 h-4" strokeWidth={2.4} />
              Save All Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminHomepageSettings;
