import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { Sliders, Upload, ImageIcon, Loader2, Check, RotateCcw, ExternalLink, Sun } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { email: myEmail } = useAuth();
  const toast = useToast();

  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [originalLogo, setOriginalLogo] = useState('');
  const [originalBanner, setOriginalBanner] = useState('');
  const [originalFavicon, setOriginalFavicon] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<'logo' | 'banner' | 'favicon' | null>(null);
  const [logoError, setLogoError] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [faviconError, setFaviconError] = useState('');

  const logoImgRef = useRef<HTMLImageElement>(null);
  const bannerImgRef = useRef<HTMLImageElement>(null);
  const faviconImgRef = useRef<HTMLImageElement>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('settings').select('*');
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => { map[row.key] = row.value; });
      setLogoUrl(map['logo_url'] || '');
      setBannerUrl(map['banner_url'] || '');
      setFaviconUrl(map['favicon_url'] || '');
      setOriginalLogo(map['logo_url'] || '');
      setOriginalBanner(map['banner_url'] || '');
      setOriginalFavicon(map['favicon_url'] || '');
    } catch (err: any) {
      toast.error('❌ Failed to load settings: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const validateUrl = (url: string): boolean => {
    if (!url) return true; // Allow empty (uses fallback)
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const saveSetting = async (key: 'logo_url' | 'banner_url' | 'favicon_url', value: string) => {
    if (value && !validateUrl(value)) {
      if (key === 'logo_url') setLogoError('URL must start with https://');
      else if (key === 'banner_url') setBannerError('URL must start with https://');
      else setFaviconError('URL must start with https://');
      return;
    }
    setLogoError('');
    setBannerError('');
    setFaviconError('');
    setIsSaving(key === 'logo_url' ? 'logo' : key === 'banner_url' ? 'banner' : 'favicon');
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key, value, updated_at: new Date().toISOString() });
      if (error) throw error;
      await logActivity(myEmail, key === 'logo_url' ? 'logo_change' : key === 'banner_url' ? 'banner_change' : 'favicon_change',
        `Updated ${key === 'logo_url' ? 'college logo' : key === 'banner_url' ? 'homepage banner' : 'tab favicon'} to: "${value}"`);
      if (key === 'logo_url') setOriginalLogo(value);
      else if (key === 'banner_url') setOriginalBanner(value);
      else {
        setOriginalFavicon(value);
        // Dynamically update favicon in the DOM of the admin dashboard immediately
        let faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (faviconLink) faviconLink.href = value;
      }
      toast.success(`✅ ${key === 'logo_url' ? 'Logo' : key === 'banner_url' ? 'Banner' : 'Favicon'} updated successfully!`);
    } catch (err: any) {
      toast.error(`❌ Failed to save: ${err.message}`);
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-navy-dark/40">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-orange-burnt" />
        <span className="font-display text-sm">Loading branding settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">

      {/* Header */}
      <div className="flex items-center space-x-3 bg-white border border-navy-dark/10 p-5 rounded-2xl shadow-xs">
        <div className="w-10 h-10 rounded-full bg-orange-burnt/10 flex items-center justify-center text-orange-burnt">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-extrabold text-base text-navy-dark">Portal Branding Settings</h3>
          <p className="text-[10px] text-navy-dark/45 font-sans leading-none mt-0.5">
            Change the college logo and homepage banner image displayed on the public website.
          </p>
        </div>
      </div>

      {/* ── College Logo ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-navy-dark/10 rounded-2xl shadow-xs p-6 space-y-5">
        <div className="flex items-center space-x-2 pb-3 border-b border-navy-dark/5">
          <ImageIcon className="w-4 h-4 text-orange-burnt" />
          <h4 className="font-display font-bold text-sm text-navy-dark">College Logo</h4>
        </div>

        {/* Preview */}
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 rounded-2xl bg-navy-dark/5 border border-navy-dark/10 flex items-center justify-center overflow-hidden shrink-0">
            {logoUrl ? (
              <img
                ref={logoImgRef}
                src={logoUrl}
                alt="Logo Preview"
                className="w-full h-full object-contain"
                onError={() => setLogoError('Image could not be loaded. Check the URL.')}
                onLoad={() => setLogoError('')}
              />
            ) : (
              <ImageIcon className="w-8 h-8 text-navy-dark/20" />
            )}
          </div>
          <div className="text-xs text-navy-dark/50 font-sans leading-relaxed">
            <p className="font-semibold text-navy-dark/70 mb-1">Current Logo URL:</p>
            {originalLogo ? (
              <a href={originalLogo} target="_blank" rel="noopener noreferrer" className="text-orange-burnt hover:underline flex items-center space-x-1 truncate max-w-xs">
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{originalLogo}</span>
              </a>
            ) : (
              <span className="italic text-navy-dark/30">No logo URL set — using default icon</span>
            )}
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60">
            New Logo URL (must be https://)
          </label>
          <input
            type="url"
            value={logoUrl}
            onChange={e => { setLogoUrl(e.target.value); setLogoError(''); }}
            placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
            className={`w-full px-4 py-2.5 rounded-lg border ${logoError ? 'border-red-400 bg-red-50' : 'border-navy-dark/15 focus:border-orange-burnt'} outline-none text-sm font-sans text-navy-dark transition-colors`}
          />
          {logoError && (
            <p className="text-xs text-red-500 font-medium">{logoError}</p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => saveSetting('logo_url', logoUrl)}
            disabled={isSaving === 'logo' || logoUrl === originalLogo}
            className="flex items-center space-x-1.5 px-5 py-2.5 bg-orange-burnt hover:bg-orange-burnt/90 text-white rounded-lg font-display text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-burnt/15"
          >
            {isSaving === 'logo' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></> : <><Check className="w-3.5 h-3.5" /><span>Save Logo</span></>}
          </button>
          <button
            onClick={() => { setLogoUrl(originalLogo); setLogoError(''); }}
            disabled={logoUrl === originalLogo}
            className="flex items-center space-x-1.5 px-4 py-2.5 border border-navy-dark/15 rounded-lg text-navy-dark/60 font-display text-xs font-bold hover:bg-navy-dark/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Homepage Banner ───────────────────────────────────────────────── */}
      <div className="bg-white border border-navy-dark/10 rounded-2xl shadow-xs p-6 space-y-5">
        <div className="flex items-center space-x-2 pb-3 border-b border-navy-dark/5">
          <Sun className="w-4 h-4 text-orange-burnt" />
          <h4 className="font-display font-bold text-sm text-navy-dark">Homepage Hero Banner</h4>
        </div>

        {/* Preview */}
        <div className="w-full h-40 rounded-xl overflow-hidden bg-navy-dark/5 border border-navy-dark/10 flex items-center justify-center relative">
          {bannerUrl ? (
            <img
              ref={bannerImgRef}
              src={bannerUrl}
              alt="Banner Preview"
              className="w-full h-full object-cover"
              onError={() => setBannerError('Image could not be loaded. Check the URL.')}
              onLoad={() => setBannerError('')}
            />
          ) : (
            <div className="text-center text-navy-dark/25">
              <Upload className="w-10 h-10 mx-auto mb-2" />
              <p className="text-xs font-display font-semibold">No banner image set</p>
              <p className="text-[10px] text-navy-dark/20">Paste a Cloudinary URL below</p>
            </div>
          )}
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60">
            Banner Image URL (must be https://)
          </label>
          <input
            type="url"
            value={bannerUrl}
            onChange={e => { setBannerUrl(e.target.value); setBannerError(''); }}
            placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
            className={`w-full px-4 py-2.5 rounded-lg border ${bannerError ? 'border-red-400 bg-red-50' : 'border-navy-dark/15 focus:border-orange-burnt'} outline-none text-sm font-sans text-navy-dark transition-colors`}
          />
          {bannerError && (
            <p className="text-xs text-red-500 font-medium">{bannerError}</p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => saveSetting('banner_url', bannerUrl)}
            disabled={isSaving === 'banner' || bannerUrl === originalBanner}
            className="flex items-center space-x-1.5 px-5 py-2.5 bg-orange-burnt hover:bg-orange-burnt/90 text-white rounded-lg font-display text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-burnt/15"
          >
            {isSaving === 'banner' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></> : <><Check className="w-3.5 h-3.5" /><span>Save Banner</span></>}
          </button>
          <button
            onClick={() => { setBannerUrl(originalBanner); setBannerError(''); }}
            disabled={bannerUrl === originalBanner}
            className="flex items-center space-x-1.5 px-4 py-2.5 border border-navy-dark/15 rounded-lg text-navy-dark/60 font-display text-xs font-bold hover:bg-navy-dark/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Browser Tab Favicon ───────────────────────────────────────────── */}
      <div className="bg-white border border-navy-dark/10 rounded-2xl shadow-xs p-6 space-y-5">
        <div className="flex items-center space-x-2 pb-3 border-b border-navy-dark/5">
          <Upload className="w-4 h-4 text-orange-burnt" />
          <h4 className="font-display font-bold text-sm text-navy-dark">Browser Tab Favicon (Logo)</h4>
        </div>

        {/* Preview */}
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 rounded-xl bg-navy-dark/5 border border-navy-dark/10 flex items-center justify-center overflow-hidden shrink-0">
            {faviconUrl ? (
              <img
                ref={faviconImgRef}
                src={faviconUrl}
                alt="Favicon Preview"
                className="w-8 h-8 object-contain"
                onError={() => setFaviconError('Favicon could not be loaded. Check the URL.')}
                onLoad={() => setFaviconError('')}
              />
            ) : (
              <ImageIcon className="w-6 h-6 text-navy-dark/20" />
            )}
          </div>
          <div className="text-xs text-navy-dark/50 font-sans leading-relaxed">
            <p className="font-semibold text-navy-dark/70 mb-1">Current Favicon URL:</p>
            {originalFavicon ? (
              <a href={originalFavicon} target="_blank" rel="noopener noreferrer" className="text-orange-burnt hover:underline flex items-center space-x-1 truncate max-w-xs">
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{originalFavicon}</span>
              </a>
            ) : (
              <span className="italic text-navy-dark/30">No custom favicon URL set — using default tab icon</span>
            )}
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60">
            New Favicon Image URL (must be https://)
          </label>
          <input
            type="url"
            value={faviconUrl}
            onChange={e => { setFaviconUrl(e.target.value); setFaviconError(''); }}
            placeholder="https://res.cloudinary.com/.../favicon.png"
            className={`w-full px-4 py-2.5 rounded-lg border ${faviconError ? 'border-red-400 bg-red-50' : 'border-navy-dark/15 focus:border-orange-burnt'} outline-none text-sm font-sans text-navy-dark transition-colors`}
          />
          {faviconError && (
            <p className="text-xs text-red-500 font-medium">{faviconError}</p>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => saveSetting('favicon_url', faviconUrl)}
            disabled={isSaving === 'favicon' || faviconUrl === originalFavicon}
            className="flex items-center space-x-1.5 px-5 py-2.5 bg-orange-burnt hover:bg-orange-burnt/90 text-white rounded-lg font-display text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-burnt/15"
          >
            {isSaving === 'favicon' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></> : <><Check className="w-3.5 h-3.5" /><span>Save Favicon</span></>}
          </button>
          <button
            onClick={() => { setFaviconUrl(originalFavicon); setFaviconError(''); }}
            disabled={faviconUrl === originalFavicon}
            className="flex items-center space-x-1.5 px-4 py-2.5 border border-navy-dark/15 rounded-lg text-navy-dark/60 font-display text-xs font-bold hover:bg-navy-dark/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default AdminSettings;
