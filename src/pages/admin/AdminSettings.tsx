import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/admin/ProtectedRoute';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { Sliders, Upload, ImageIcon, Loader2, Check, RotateCcw, ExternalLink, Sun, Megaphone } from 'lucide-react';

const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
  const lowerUrl = url.toLowerCase();
  return (
    videoExtensions.some(ext => lowerUrl.endsWith(ext)) ||
    lowerUrl.includes('/video/upload/') ||
    (lowerUrl.includes('res.cloudinary.com/') && lowerUrl.includes('/video/'))
  );
};

export const AdminSettings: React.FC = () => {
  const { email: myEmail } = useAuth();
  const toast = useToast();

  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementEnabled, setAnnouncementEnabled] = useState(false);

  const [originalLogo, setOriginalLogo] = useState('');
  const [originalBanner, setOriginalBanner] = useState('');
  const [originalFavicon, setOriginalFavicon] = useState('');
  const [originalAnnouncementText, setOriginalAnnouncementText] = useState('');
  const [originalAnnouncementEnabled, setOriginalAnnouncementEnabled] = useState(false);

  const [myProfileName, setMyProfileName] = useState('');
  const [myProfilePhone, setMyProfilePhone] = useState('');
  const [myProfileYear, setMyProfileYear] = useState('');
  const [myProfileAvatar, setMyProfileAvatar] = useState('');
  const [originalProfileName, setOriginalProfileName] = useState('');
  const [originalProfilePhone, setOriginalProfilePhone] = useState('');
  const [originalProfileYear, setOriginalProfileYear] = useState('');
  const [originalProfileAvatar, setOriginalProfileAvatar] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<'logo' | 'banner' | 'favicon' | 'announcement' | 'profile' | null>(null);
  const [logoError, setLogoError] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [faviconError, setFaviconError] = useState('');
  const [profileError, setProfileError] = useState('');

  const logoImgRef = useRef<HTMLImageElement>(null);
  const bannerImgRef = useRef<HTMLImageElement>(null);
  const faviconImgRef = useRef<HTMLImageElement>(null);
  const profileImgRef = useRef<HTMLImageElement>(null);

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
      setAnnouncementText(map['announcement_text'] || '');
      setAnnouncementEnabled(map['announcement_enabled'] === 'true');

      setOriginalLogo(map['logo_url'] || '');
      setOriginalBanner(map['banner_url'] || '');
      setOriginalFavicon(map['favicon_url'] || '');
      setOriginalAnnouncementText(map['announcement_text'] || '');
      setOriginalAnnouncementEnabled(map['announcement_enabled'] === 'true');

      // Fetch personal profile details defensively
      const { data: profData } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', myEmail)
        .maybeSingle();

      if (profData) {
        setMyProfileName(profData.name || '');
        setMyProfilePhone(profData.phone || '');
        setMyProfileYear(profData.year || '');
        setMyProfileAvatar(profData.avatar_url || '');

        setOriginalProfileName(profData.name || '');
        setOriginalProfilePhone(profData.phone || '');
        setOriginalProfileYear(profData.year || '');
        setOriginalProfileAvatar(profData.avatar_url || '');
      }
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

  const saveAnnouncement = async () => {
    setIsSaving('announcement');
    try {
      const { error: textError } = await supabase
        .from('settings')
        .upsert({ 
          key: 'announcement_text', 
          value: announcementText, 
          updated_at: new Date().toISOString() 
        });
      if (textError) throw textError;

      const { error: enabledError } = await supabase
        .from('settings')
        .upsert({ 
          key: 'announcement_enabled', 
          value: announcementEnabled ? 'true' : 'false', 
          updated_at: new Date().toISOString() 
        });
      if (enabledError) throw enabledError;

      await logActivity(
        myEmail, 
        'announcement_change', 
        `Updated announcement to: "${announcementText}" (Enabled: ${announcementEnabled})`
      );

      setOriginalAnnouncementText(announcementText);
      setOriginalAnnouncementEnabled(announcementEnabled);

      toast.success('✅ Announcement settings updated successfully!');
    } catch (err: any) {
      toast.error(`❌ Failed to save announcement: ${err.message}`);
    } finally {
      setIsSaving(null);
    }
  };

  const saveProfile = async () => {
    if (myProfileAvatar && !validateUrl(myProfileAvatar)) {
      setProfileError('URL must start with https://');
      return;
    }
    setProfileError('');
    setIsSaving('profile');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: myProfileName,
          phone: myProfilePhone,
          year: myProfileYear,
          avatar_url: myProfileAvatar,
        })
        .eq('email', myEmail);

      if (error) throw error;

      await logActivity(myEmail, 'profile_update', 'Updated personal profile details');

      setOriginalProfileName(myProfileName);
      setOriginalProfilePhone(myProfilePhone);
      setOriginalProfileYear(myProfileYear);
      setOriginalProfileAvatar(myProfileAvatar);

      toast.success('✅ Personal profile updated successfully!');
    } catch (err: any) {
      toast.error(`❌ Failed to save profile: ${err.message}`);
    } finally {
      setIsSaving(null);
    }
  };

  const [isUploading, setIsUploading] = useState<'logo' | 'banner' | 'favicon' | 'profile' | null>(null);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner' | 'favicon' | 'profile'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');
    
    if (!isImage && !isVideo) {
      toast.error('❌ Invalid file type. Please select an image or video file.');
      return;
    }

    if (type === 'favicon' && isVideo) {
      toast.error('❌ Favicon must be an image file.');
      return;
    }

    if (type === 'logo' && isVideo) {
      toast.error('❌ College Logo must be an image file.');
      return;
    }

    const maxSize = isVideo ? 15 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`❌ File size exceeds the limit (${isVideo ? '15MB' : '5MB'}).`);
      return;
    }

    setIsUploading(type);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${type}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('branding')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('branding')
        .getPublicUrl(filePath);

      if (type === 'logo') {
        setLogoUrl(publicUrl);
        setLogoError('');
        toast.success('📷 Logo uploaded! Click "Save Logo" to apply changes.');
      } else if (type === 'banner') {
        setBannerUrl(publicUrl);
        setBannerError('');
        toast.success('🎥 Banner uploaded! Click "Save Banner" to apply changes.');
      } else if (type === 'favicon') {
        setFaviconUrl(publicUrl);
        setFaviconError('');
        toast.success('📷 Favicon uploaded! Click "Save Favicon" to apply changes.');
      } else if (type === 'profile') {
        setMyProfileAvatar(publicUrl);
        setProfileError('');
        toast.success('👤 Profile photo uploaded! Click "Save Profile" to apply changes.');
      }
    } catch (err: any) {
      toast.error(`❌ Upload failed: ${err.message}. Ensure your 'branding' bucket is created in Supabase storage!`);
      console.error(err);
    } finally {
      setIsUploading(null);
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

      {/* ── My Personal Council Profile ───────────────────────────────────── */}
      <div className="bg-white border border-navy-dark/10 rounded-2xl shadow-xs p-6 space-y-5">
        <div className="flex items-center space-x-2 pb-3 border-b border-navy-dark/5">
          <Sliders className="w-4 h-4 text-orange-burnt" />
          <h4 className="font-display font-bold text-sm text-navy-dark">👤 My Council Card Profile</h4>
        </div>

        {/* Profile Card Preview & Details */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-navy-dark/[0.02] border border-navy-dark/5">
          {/* Avatar Preview */}
          <div className="w-20 h-20 rounded-full bg-orange-burnt/10 border border-orange-burnt/20 flex items-center justify-center text-orange-burnt font-display font-extrabold text-2xl shadow-inner shrink-0 overflow-hidden relative">
            {myProfileAvatar ? (
              <img
                ref={profileImgRef}
                src={myProfileAvatar}
                alt="Avatar Preview"
                className="w-full h-full object-cover"
                onError={() => setProfileError('Image could not be loaded. Check the URL.')}
                onLoad={() => setProfileError('')}
              />
            ) : (
              <span>{myProfileName ? myProfileName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '??'}</span>
            )}
          </div>

          {/* Details list */}
          <div className="space-y-1 text-xs text-navy-dark/70 font-sans leading-relaxed text-center sm:text-left flex-grow">
            <h5 className="font-display font-extrabold text-sm text-navy-dark">{myProfileName || 'Unnamed Member'}</h5>
            <p className="font-semibold text-orange-burnt/85 uppercase tracking-wider text-[10px]">
              Role: {myEmail === 'shrey@tgpcopconcil.com' ? 'President' : 'Council Administrator'} ({myEmail})
            </p>
            {myProfileYear && <p>🎓 {myProfileYear}</p>}
            {myProfilePhone && <p>📞 {myProfilePhone}</p>}
          </div>
        </div>

        {/* Form Inputs Grid (2 columns on sm+) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Name Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60">Display Name</label>
            <input
              type="text"
              value={myProfileName}
              onChange={e => setMyProfileName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-xs sm:text-sm font-sans text-navy-dark transition-colors"
            />
          </div>

          {/* Phone Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60">Phone Number</label>
            <input
              type="tel"
              value={myProfilePhone}
              onChange={e => setMyProfilePhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-xs sm:text-sm font-sans text-navy-dark transition-colors"
            />
          </div>

          {/* Year/Class Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60">Course & Year</label>
            <input
              type="text"
              value={myProfileYear}
              onChange={e => setMyProfileYear(e.target.value)}
              placeholder="e.g. B.Pharm III Year"
              className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-xs sm:text-sm font-sans text-navy-dark transition-colors"
            />
          </div>

          {/* Profile Picture Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60">Profile Photo URL (https://)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={myProfileAvatar}
                onChange={e => { setMyProfileAvatar(e.target.value); setProfileError(''); }}
                placeholder="https://res.cloudinary.com/.../your-photo.jpg"
                className={`flex-grow px-4 py-2.5 rounded-lg border ${profileError ? 'border-red-400 bg-red-50' : 'border-navy-dark/15 focus:border-orange-burnt'} outline-none text-xs sm:text-sm font-sans text-navy-dark transition-colors`}
              />
              <label className="flex items-center justify-center px-4 py-2.5 bg-navy-dark hover:bg-orange-burnt text-white rounded-lg cursor-pointer transition-colors shrink-0 select-none text-xs font-bold font-display shadow-xs active:scale-98">
                {isUploading === 'profile' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1.5" />
                    <span>Upload</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleFileUpload(e, 'profile')}
                  className="hidden"
                  disabled={isUploading !== null}
                />
              </label>
            </div>
          </div>
        </div>

        {profileError && (
          <p className="text-xs text-red-500 font-medium mt-1">{profileError}</p>
        )}

        {/* Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={saveProfile}
            disabled={isSaving === 'profile' || (myProfileName === originalProfileName && myProfilePhone === originalProfilePhone && myProfileYear === originalProfileYear && myProfileAvatar === originalProfileAvatar)}
            className="flex items-center space-x-1.5 px-5 py-2.5 bg-orange-burnt hover:bg-orange-burnt/90 text-white rounded-lg font-display text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-burnt/15"
          >
            {isSaving === 'profile' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></> : <><Check className="w-3.5 h-3.5" /><span>Save Profile</span></>}
          </button>
          <button
            onClick={() => {
              setMyProfileName(originalProfileName);
              setMyProfilePhone(originalProfilePhone);
              setMyProfileYear(originalProfileYear);
              setMyProfileAvatar(originalProfileAvatar);
              setProfileError('');
            }}
            disabled={myProfileName === originalProfileName && myProfilePhone === originalProfilePhone && myProfileYear === originalProfileYear && myProfileAvatar === originalProfileAvatar}
            className="flex items-center space-x-1.5 px-4 py-2.5 border border-navy-dark/15 rounded-lg text-navy-dark/60 font-display text-xs font-bold hover:bg-navy-dark/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
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
          <div className="flex gap-2">
            <input
              type="url"
              value={logoUrl}
              onChange={e => { setLogoUrl(e.target.value); setLogoError(''); }}
              placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
              className={`flex-grow px-4 py-2.5 rounded-lg border ${logoError ? 'border-red-400 bg-red-50' : 'border-navy-dark/15 focus:border-orange-burnt'} outline-none text-sm font-sans text-navy-dark transition-colors`}
            />
            <label className="flex items-center justify-center px-4 py-2.5 bg-navy-dark hover:bg-orange-burnt text-white rounded-lg cursor-pointer transition-colors shrink-0 select-none text-xs font-bold font-display shadow-xs active:scale-98">
              {isUploading === 'logo' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1.5" />
                  <span>Upload</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileUpload(e, 'logo')}
                className="hidden"
                disabled={isUploading !== null}
              />
            </label>
          </div>
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
            isVideoUrl(bannerUrl) ? (
              <video
                src={bannerUrl}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
                onError={() => setBannerError('Video could not be loaded. Check the URL.')}
                onPlay={() => setBannerError('')}
              />
            ) : (
              <img
                ref={bannerImgRef}
                src={bannerUrl}
                alt="Banner Preview"
                className="w-full h-full object-cover"
                onError={() => setBannerError('Image could not be loaded. Check the URL.')}
                onLoad={() => setBannerError('')}
              />
            )
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
            Banner Image or Video URL (must be https://)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={bannerUrl}
              onChange={e => { setBannerUrl(e.target.value); setBannerError(''); }}
              placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
              className={`flex-grow px-4 py-2.5 rounded-lg border ${bannerError ? 'border-red-400 bg-red-50' : 'border-navy-dark/15 focus:border-orange-burnt'} outline-none text-sm font-sans text-navy-dark transition-colors`}
            />
            <label className="flex items-center justify-center px-4 py-2.5 bg-navy-dark hover:bg-orange-burnt text-white rounded-lg cursor-pointer transition-colors shrink-0 select-none text-xs font-bold font-display shadow-xs active:scale-98">
              {isUploading === 'banner' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1.5" />
                  <span>Upload</span>
                </>
              )}
              <input
                type="file"
                accept="image/*,video/*"
                onChange={e => handleFileUpload(e, 'banner')}
                className="hidden"
                disabled={isUploading !== null}
              />
            </label>
          </div>
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
          <div className="flex gap-2">
            <input
              type="url"
              value={faviconUrl}
              onChange={e => { setFaviconUrl(e.target.value); setFaviconError(''); }}
              placeholder="https://res.cloudinary.com/.../favicon.png"
              className={`flex-grow px-4 py-2.5 rounded-lg border ${faviconError ? 'border-red-400 bg-red-50' : 'border-navy-dark/15 focus:border-orange-burnt'} outline-none text-sm font-sans text-navy-dark transition-colors`}
            />
            <label className="flex items-center justify-center px-4 py-2.5 bg-navy-dark hover:bg-orange-burnt text-white rounded-lg cursor-pointer transition-colors shrink-0 select-none text-xs font-bold font-display shadow-xs active:scale-98">
              {isUploading === 'favicon' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-1.5" />
                  <span>Upload</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={e => handleFileUpload(e, 'favicon')}
                className="hidden"
                disabled={isUploading !== null}
              />
            </label>
          </div>
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

      {/* ── Announcement Bar Settings ────────────────────────────────────── */}
      <div className="bg-white border border-navy-dark/10 rounded-2xl shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-navy-dark/5">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-4 h-4 text-orange-burnt" />
            <h4 className="font-display font-bold text-sm text-navy-dark">📢 Live Announcement Bar</h4>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={announcementEnabled}
              onChange={e => setAnnouncementEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-navy-dark/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-burnt" />
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-navy-dark/60">
              {announcementEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        {/* Announcement Text Input */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-navy-dark/60">
            Announcement Ticker Text (displayed at the very top of the website)
          </label>
          <textarea
            value={announcementText}
            onChange={e => setAnnouncementText(e.target.value)}
            placeholder="🎉 Welcome to the official TGPCOP Student Council Portal! Admissions are open for the academic year 2026-2027. Apply now!"
            rows={3}
            maxLength={300}
            className="w-full px-4 py-2.5 rounded-lg border border-navy-dark/15 focus:border-orange-burnt outline-none text-sm font-sans text-navy-dark transition-colors resize-none"
          />
          <div className="flex justify-between text-[9px] text-navy-dark/40 font-bold uppercase tracking-wider">
            <span>Maximum 300 characters</span>
            <span>{announcementText.length} / 300 chars</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={saveAnnouncement}
            disabled={isSaving === 'announcement' || (announcementText === originalAnnouncementText && announcementEnabled === originalAnnouncementEnabled)}
            className="flex items-center space-x-1.5 px-5 py-2.5 bg-orange-burnt hover:bg-orange-burnt/90 text-white rounded-lg font-display text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-burnt/15"
          >
            {isSaving === 'announcement' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></> : <><Check className="w-3.5 h-3.5" /><span>Save Announcement</span></>}
          </button>
          <button
            onClick={() => {
              setAnnouncementText(originalAnnouncementText);
              setAnnouncementEnabled(originalAnnouncementEnabled);
            }}
            disabled={announcementText === originalAnnouncementText && announcementEnabled === originalAnnouncementEnabled}
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
