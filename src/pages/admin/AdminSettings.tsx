import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/admin/ProtectedRoute';
import QRCode from 'react-qr-code';
import { useToast } from '../../components/admin/Toast';
import { logActivity } from '../../lib/logs';
import { Sliders, Upload, ImageIcon, Loader2, Check, RotateCcw, ExternalLink, Sun, Megaphone, QrCode, Copy, CreditCard, Trash2, Fingerprint } from 'lucide-react';

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

  // --- Hero Text Settings ---
  const [heroBadgeText, setHeroBadgeText] = useState('');
  const [heroTitleText1, setHeroTitleText1] = useState('');
  const [heroTitleText2, setHeroTitleText2] = useState('');
  const [heroSubtitleText, setHeroSubtitleText] = useState('');
  const [heroButtonText, setHeroButtonText] = useState('');
  const [heroButtonLink, setHeroButtonLink] = useState('');
  const [heroButtonEnabled, setHeroButtonEnabled] = useState(true);
  const [heroAskButtonEnabled, setHeroAskButtonEnabled] = useState(true);
  const [heroNoticeButtonEnabled, setHeroNoticeButtonEnabled] = useState(true);

  const [originalHeroBadgeText, setOriginalHeroBadgeText] = useState('');
  const [originalHeroTitleText1, setOriginalHeroTitleText1] = useState('');
  const [originalHeroTitleText2, setOriginalHeroTitleText2] = useState('');
  const [originalHeroSubtitleText, setOriginalHeroSubtitleText] = useState('');
  const [originalHeroButtonText, setOriginalHeroButtonText] = useState('');
  const [originalHeroButtonLink, setOriginalHeroButtonLink] = useState('');
  const [originalHeroButtonEnabled, setOriginalHeroButtonEnabled] = useState(true);
  const [originalHeroAskButtonEnabled, setOriginalHeroAskButtonEnabled] = useState(true);
  const [originalHeroNoticeButtonEnabled, setOriginalHeroNoticeButtonEnabled] = useState(true);
  // --------------------------

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
  const [isSaving, setIsSaving] = useState<'logo' | 'banner' | 'favicon' | 'announcement' | 'profile' | 'hero_text' | null>(null);
  const [logoError, setLogoError] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [faviconError, setFaviconError] = useState('');
  const [profileError, setProfileError] = useState('');

  const logoImgRef = useRef<HTMLImageElement>(null);
  const bannerImgRef = useRef<HTMLImageElement>(null);
  const faviconImgRef = useRef<HTMLImageElement>(null);
  const profileImgRef = useRef<HTMLImageElement>(null);

  // Passkeys State
  const [passkeys, setPasskeys] = useState<any[]>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [showPasskeyForm, setShowPasskeyForm] = useState(false);

  const fetchPasskeys = async () => {
    setIsLoadingPasskeys(true);
    try {
      const { data, error } = await supabase.auth.passkey.list();
      if (error) throw error;
      setPasskeys(data || []);
    } catch (err: any) {
      console.error('Error fetching passkeys:', err);
    } finally {
      setIsLoadingPasskeys(false);
    }
  };

  const handleRegisterPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasskeyName.trim()) return;
    setIsRegisteringPasskey(true);
    try {
      const { data, error } = await supabase.auth.registerPasskey();
      if (error) throw error;
      
      // Post-register: rename credential to friendlyName
      if (data?.id) {
        await supabase.auth.passkey.update({
          passkeyId: data.id,
          friendlyName: newPasskeyName.trim()
        });
      }
      
      toast.success('✅ Passkey registered successfully!');
      setNewPasskeyName('');
      setShowPasskeyForm(false);
      fetchPasskeys();
    } catch (err: any) {
      console.error('Error registering passkey:', err);
      let errMsg = err.message || 'Passkey registration failed.';
      if (err.name === 'NotAllowedError' || errMsg.includes('abort') || errMsg.includes('cancel')) {
        errMsg = 'Passkey registration cancelled.';
      }
      toast.error('❌ ' + errMsg);
    } finally {
      setIsRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (passkeyId: string) => {
    if (!window.confirm('Are you sure you want to delete this passkey? You won\'t be able to use it to sign in anymore.')) return;
    try {
      const { error } = await supabase.auth.passkey.delete({ passkeyId });
      if (error) throw error;
      toast.success('✅ Passkey deleted successfully!');
      fetchPasskeys();
    } catch (err: any) {
      console.error('Error deleting passkey:', err);
      toast.error('❌ Failed to delete passkey: ' + err.message);
    }
  };

  // Payment Purposes State
  const [purposes, setPurposes] = useState<any[]>([]);
  const [purposesLoading, setPurposesLoading] = useState(true);
  const [isPurposesModalOpen, setIsPurposesModalOpen] = useState(false);
  const [newPurposeName, setNewPurposeName] = useState('');
  const [newPurposeAmount, setNewPurposeAmount] = useState<number>(10);
  const [isSavingPurpose, setIsSavingPurpose] = useState(false);
  const [sharePurpose, setSharePurpose] = useState<any | null>(null);
  const [copiedPurposeId, setCopiedPurposeId] = useState<string | null>(null);

  const fetchPurposes = async () => {
    setPurposesLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_purposes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurposes(data || []);
    } catch (err: any) {
      console.warn('Payment purposes table not ready or empty:', err.message);
    } finally {
      setPurposesLoading(false);
    }
  };

  const handleAddPurpose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurposeName.trim()) return;

    setIsSavingPurpose(true);
    try {
      const { error } = await supabase
        .from('payment_purposes')
        .insert({
          name: newPurposeName,
          amount: newPurposeAmount
        });

      if (error) throw error;
      toast.success('✅ Predefined purpose added!');
      setNewPurposeName('');
      setNewPurposeAmount(10);
      setIsPurposesModalOpen(false);
      fetchPurposes();
    } catch (err: any) {
      toast.error('❌ Action failed: ' + err.message);
    } finally {
      setIsSavingPurpose(false);
    }
  };

  const handleDeletePurpose = async (id: string) => {
    if (!window.confirm('Delete this predefined payment purpose? This will not affect existing payments.')) return;

    try {
      const { error } = await supabase
        .from('payment_purposes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('✅ Predefined purpose deleted!');
      fetchPurposes();
    } catch (err: any) {
      toast.error('❌ Action failed: ' + err.message);
    }
  };

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

      setHeroBadgeText(map['hero_badge_text'] ?? 'Tulsiramji Gaikwad Patil College of Pharmacy');
      setHeroTitleText1(map['hero_title_text_1'] ?? 'TGPCOP');
      setHeroTitleText2(map['hero_title_text_2'] ?? 'Student Council');
      setHeroSubtitleText(map['hero_subtitle_text'] ?? 'Your Voice. Our Future. | Together Towards Excellence');
      setHeroButtonText(map['hero_button_text'] ?? '');
      setHeroButtonLink(map['hero_button_link'] ?? '');
      setHeroButtonEnabled(map['hero_button_enabled'] !== 'false');
      setHeroAskButtonEnabled(map['hero_ask_button_enabled'] !== 'false');
      setHeroNoticeButtonEnabled(map['hero_notice_button_enabled'] !== 'false');

      setOriginalLogo(map['logo_url'] || '');
      setOriginalBanner(map['banner_url'] || '');
      setOriginalFavicon(map['favicon_url'] || '');
      setOriginalAnnouncementText(map['announcement_text'] || '');
      setOriginalAnnouncementEnabled(map['announcement_enabled'] === 'true');

      setOriginalHeroBadgeText(map['hero_badge_text'] ?? 'Tulsiramji Gaikwad Patil College of Pharmacy');
      setOriginalHeroTitleText1(map['hero_title_text_1'] ?? 'TGPCOP');
      setOriginalHeroTitleText2(map['hero_title_text_2'] ?? 'Student Council');
      setOriginalHeroSubtitleText(map['hero_subtitle_text'] ?? 'Your Voice. Our Future. | Together Towards Excellence');
      setOriginalHeroButtonText(map['hero_button_text'] ?? '');
      setOriginalHeroButtonLink(map['hero_button_link'] ?? '');
      setOriginalHeroButtonEnabled(map['hero_button_enabled'] !== 'false');
      setOriginalHeroAskButtonEnabled(map['hero_ask_button_enabled'] !== 'false');
      setOriginalHeroNoticeButtonEnabled(map['hero_notice_button_enabled'] !== 'false');

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

  useEffect(() => { 
    fetchSettings(); 
    fetchPurposes();
    fetchPasskeys();
  }, []);

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

  const saveHeroText = async () => {
    setIsSaving('hero_text');
    try {
      const updates = [
        { key: 'hero_badge_text', value: heroBadgeText, updated_at: new Date().toISOString() },
        { key: 'hero_title_text_1', value: heroTitleText1, updated_at: new Date().toISOString() },
        { key: 'hero_title_text_2', value: heroTitleText2, updated_at: new Date().toISOString() },
        { key: 'hero_subtitle_text', value: heroSubtitleText, updated_at: new Date().toISOString() },
        { key: 'hero_button_text', value: heroButtonText, updated_at: new Date().toISOString() },
        { key: 'hero_button_link', value: heroButtonLink, updated_at: new Date().toISOString() },
        { key: 'hero_button_enabled', value: heroButtonEnabled ? 'true' : 'false', updated_at: new Date().toISOString() },
        { key: 'hero_ask_button_enabled', value: heroAskButtonEnabled ? 'true' : 'false', updated_at: new Date().toISOString() },
        { key: 'hero_notice_button_enabled', value: heroNoticeButtonEnabled ? 'true' : 'false', updated_at: new Date().toISOString() }
      ];

      const { error } = await supabase.from('settings').upsert(updates);
      if (error) throw error;

      await logActivity(myEmail, 'hero_text_change', 'Updated homepage hero text settings');

      setOriginalHeroBadgeText(heroBadgeText);
      setOriginalHeroTitleText1(heroTitleText1);
      setOriginalHeroTitleText2(heroTitleText2);
      setOriginalHeroSubtitleText(heroSubtitleText);
      setOriginalHeroButtonText(heroButtonText);
      setOriginalHeroButtonLink(heroButtonLink);
      setOriginalHeroButtonEnabled(heroButtonEnabled);
      setOriginalHeroAskButtonEnabled(heroAskButtonEnabled);
      setOriginalHeroNoticeButtonEnabled(heroNoticeButtonEnabled);

      toast.success('✅ Hero text settings updated successfully!');
    } catch (err: any) {
      toast.error(`❌ Failed to save hero text: ${err.message}`);
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
      <div className="flex items-center justify-center py-32 text-white/40">
        <Loader2 className="w-8 h-8 animate-spin mr-3 text-orange-burnt" />
        <span className="font-display text-sm">Loading branding settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">

      {/* Header */}
      <div className="flex items-center space-x-3 bg-[#0D1B3E]/40 backdrop-blur-md border border-white/10 p-5 rounded-2xl shadow-lg">
        <div className="w-10 h-10 rounded-full bg-orange-burnt/10 flex items-center justify-center text-orange-burnt">
          <Sliders className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-display font-extrabold text-base text-white">Portal Branding Settings</h3>
          <p className="text-[10px] text-white/40 font-sans leading-none mt-0.5">
            Change the college logo and homepage banner image displayed on the public website.
          </p>
        </div>
      </div>

      {/* ── My Personal Council Profile ───────────────────────────────────── */}
      <div className="bg-[#0D1B3E]/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6 space-y-5">
        <div className="flex items-center space-x-2 pb-3 border-b border-white/5">
          <Sliders className="w-4 h-4 text-orange-burnt" />
          <h4 className="font-display font-bold text-sm text-white">👤 My Council Card Profile</h4>
        </div>

        {/* Profile Card Preview & Details */}
        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-white/5 border border-white/5">
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
          <div className="space-y-1 text-xs text-white/60 font-sans leading-relaxed text-center sm:text-left flex-grow">
            <h5 className="font-display font-extrabold text-sm text-white">{myProfileName || 'Unnamed Member'}</h5>
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
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Display Name</label>
            <input
              type="text"
              value={myProfileName}
              onChange={e => setMyProfileName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 outline-none text-xs sm:text-sm font-sans text-white transition-colors placeholder:text-white/20"
            />
          </div>

          {/* Phone Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Phone Number</label>
            <input
              type="tel"
              value={myProfilePhone}
              onChange={e => setMyProfilePhone(e.target.value)}
              placeholder="e.g. +91 98765 43210"
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 outline-none text-xs sm:text-sm font-sans text-white transition-colors placeholder:text-white/20"
            />
          </div>

          {/* Year/Class Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Course & Year</label>
            <input
              type="text"
              value={myProfileYear}
              onChange={e => setMyProfileYear(e.target.value)}
              placeholder="e.g. B.Pharm III Year"
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 outline-none text-xs sm:text-sm font-sans text-white transition-colors placeholder:text-white/20"
            />
          </div>

          {/* Profile Picture Input */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Profile Photo URL (https://)</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={myProfileAvatar}
                onChange={e => { setMyProfileAvatar(e.target.value); setProfileError(''); }}
                placeholder="https://res.cloudinary.com/.../your-photo.jpg"
                className={`flex-grow px-4 py-2.5 rounded-lg border bg-white/5 text-white placeholder:text-white/20 outline-none text-xs sm:text-sm font-sans transition-colors ${profileError ? 'border-red-400' : 'border-white/10 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50'}`}
              />
              <label className="flex items-center justify-center px-4 py-2.5 bg-white/5 hover:bg-orange-burnt border border-white/10 text-white rounded-lg cursor-pointer transition-colors shrink-0 select-none text-xs font-bold font-display shadow-xs active:scale-98">
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
            className="flex items-center space-x-1.5 px-4 py-2.5 border border-white/10 rounded-lg text-white/60 font-display text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Passkey Settings (WebAuthn) ─────────────────────────────────── */}
      <div className="bg-[#0D1B3E]/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6 space-y-5">
        <div className="flex items-center space-x-2 pb-3 border-b border-white/5">
          <Fingerprint className="w-4 h-4 text-orange-burnt animate-pulse" />
          <h4 className="font-display font-bold text-sm text-white">👤 Passkeys Security (WebAuthn)</h4>
        </div>

        <p className="text-xs text-white/60 leading-relaxed font-sans">
          Add biometrics, hardware keys, or platform authenticators to log in instantly and password-free.
        </p>

        {/* Enrolled Passkeys List */}
        {isLoadingPasskeys ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-orange-burnt" />
          </div>
        ) : passkeys.length > 0 ? (
          <div className="space-y-2.5">
            <span className="block text-[10px] font-bold text-white/40 uppercase tracking-wider pl-1">
              Enrolled Devices ({passkeys.length})
            </span>
            {passkeys.map((pk) => (
              <div key={pk.id} className="flex items-center justify-between bg-white/5 border border-white/5 px-4 py-3 rounded-xl text-xs sm:text-sm font-sans">
                <div className="flex items-center space-x-3">
                  <Fingerprint className="w-5 h-5 text-orange-burnt shrink-0" />
                  <div className="min-w-0">
                    <span className="block font-semibold text-white truncate">{pk.friendly_name || 'Unnamed Passkey'}</span>
                    <span className="block text-[10px] text-white/40">
                      Added {new Date(pk.created_at).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePasskey(pk.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Delete Passkey"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-4 text-center rounded-xl bg-white/[0.02] border border-white/5 text-xs text-white/40 font-sans">
            No passkeys registered yet.
          </div>
        )}

        {/* Enrollment Interface */}
        {showPasskeyForm ? (
          <form onSubmit={handleRegisterPasskey} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-white/55 uppercase mb-1 pl-1">Passkey Name / Label</label>
              <input
                type="text"
                required
                value={newPasskeyName}
                onChange={(e) => setNewPasskeyName(e.target.value)}
                placeholder="e.g. My Office Mac, Windows Hello"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none focus:border-orange-burnt transition-colors placeholder:text-white/20"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setShowPasskeyForm(false); setNewPasskeyName(''); }}
                className="flex-1 py-2.5 rounded-lg border border-white/10 hover:bg-white/5 text-white/70 text-xs font-bold font-display uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isRegisteringPasskey || !newPasskeyName.trim()}
                className="flex-1 py-2.5 rounded-lg bg-orange-burnt hover:bg-orange-burnt/90 text-white text-xs font-bold font-display uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isRegisteringPasskey ? 'Enrolling...' : 'Register'}
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowPasskeyForm(true)}
            className="w-full py-2.5 rounded-lg border border-white/10 hover:border-orange-burnt bg-white/5 hover:bg-orange-burnt/10 text-white font-display text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <span>➕ Register Passkey Device</span>
          </button>
        )}
      </div>

      {/* ── College Logo ─────────────────────────────────────────────────── */}
      <div className="bg-[#0D1B3E]/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6 space-y-5">
        <div className="flex items-center space-x-2 pb-3 border-b border-white/5">
          <ImageIcon className="w-4 h-4 text-orange-burnt" />
          <h4 className="font-display font-bold text-sm text-white">College Logo</h4>
        </div>

        {/* Preview */}
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
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
              <ImageIcon className="w-8 h-8 text-white/20" />
            )}
          </div>
          <div className="text-xs text-white/40 font-sans leading-relaxed">
            <p className="font-semibold text-white/60 mb-1">Current Logo URL:</p>
            {originalLogo ? (
              <a href={originalLogo} target="_blank" rel="noopener noreferrer" className="text-orange-burnt hover:underline flex items-center space-x-1 truncate max-w-xs">
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{originalLogo}</span>
              </a>
            ) : (
              <span className="italic text-white/20">No logo URL set — using default icon</span>
            )}
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
            New Logo URL (must be https://)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={logoUrl}
              onChange={e => { setLogoUrl(e.target.value); setLogoError(''); }}
              placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
              className={`flex-grow px-4 py-2.5 rounded-lg border bg-white/5 text-white placeholder:text-white/20 outline-none text-sm font-sans transition-colors ${logoError ? 'border-red-400' : 'border-white/10 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50'}`}
            />
            <label className="flex items-center justify-center px-4 py-2.5 bg-white/5 hover:bg-orange-burnt border border-white/10 text-white rounded-lg cursor-pointer transition-colors shrink-0 select-none text-xs font-bold font-display shadow-xs active:scale-98">
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
            className="flex items-center space-x-1.5 px-4 py-2.5 border border-white/10 rounded-lg text-white/60 font-display text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Homepage Banner ───────────────────────────────────────────────── */}
      <div className="bg-[#0D1B3E]/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6 space-y-5">
        <div className="flex items-center space-x-2 pb-3 border-b border-white/5">
          <Sun className="w-4 h-4 text-orange-burnt" />
          <h4 className="font-display font-bold text-sm text-white">Homepage Hero Banner</h4>
        </div>

        {/* Preview */}
        <div className="w-full h-40 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center relative">
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
            <div className="text-center text-white/30">
              <Upload className="w-10 h-10 mx-auto mb-2 text-white/20" />
              <p className="text-xs font-display font-semibold">No banner image set</p>
              <p className="text-[10px] text-white/20">Paste a Cloudinary URL below</p>
            </div>
          )}
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
            Banner Image or Video URL (must be https://)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={bannerUrl}
              onChange={e => { setBannerUrl(e.target.value); setBannerError(''); }}
              placeholder="https://res.cloudinary.com/your-cloud/image/upload/..."
              className={`flex-grow px-4 py-2.5 rounded-lg border bg-white/5 text-white placeholder:text-white/20 outline-none text-sm font-sans transition-colors ${bannerError ? 'border-red-400' : 'border-white/10 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50'}`}
            />
            <label className="flex items-center justify-center px-4 py-2.5 bg-white/5 hover:bg-orange-burnt border border-white/10 text-white rounded-lg cursor-pointer transition-colors shrink-0 select-none text-xs font-bold font-display shadow-xs active:scale-98">
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
            className="flex items-center space-x-1.5 px-4 py-2.5 border border-white/10 rounded-lg text-white/60 font-display text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Hero Text Settings ────────────────────────────────────────────── */}
      <div className="bg-[#0D1B3E]/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6 space-y-5">
        <div className="flex items-center space-x-2 pb-3 border-b border-white/5">
          <Megaphone className="w-4 h-4 text-orange-burnt" />
          <h4 className="font-display font-bold text-sm text-white">Homepage Hero Text & Custom Button</h4>
        </div>
        <p className="text-[10px] text-white/40 font-sans leading-relaxed">
          Leave any field completely blank to hide it from the homepage.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Badge Text (Top)</label>
            <input
              type="text"
              value={heroBadgeText}
              onChange={e => setHeroBadgeText(e.target.value)}
              placeholder="e.g. Tulsiramji Gaikwad Patil College of Pharmacy"
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-orange-burnt/50 outline-none text-xs sm:text-sm font-sans text-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Title Line 1</label>
            <input
              type="text"
              value={heroTitleText1}
              onChange={e => setHeroTitleText1(e.target.value)}
              placeholder="e.g. TGPCOP"
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-orange-burnt/50 outline-none text-xs sm:text-sm font-sans text-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Title Line 2 (Highlighted)</label>
            <input
              type="text"
              value={heroTitleText2}
              onChange={e => setHeroTitleText2(e.target.value)}
              placeholder="e.g. Student Council"
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-orange-burnt/50 outline-none text-xs sm:text-sm font-sans text-white transition-colors"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Subtitle</label>
            <input
              type="text"
              value={heroSubtitleText}
              onChange={e => setHeroSubtitleText(e.target.value)}
              placeholder="e.g. Your Voice. Our Future. | Together Towards Excellence"
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-orange-burnt/50 outline-none text-xs sm:text-sm font-sans text-white transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Custom Button Text</label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={heroButtonText}
                onChange={e => setHeroButtonText(e.target.value)}
                placeholder="Leave blank to hide"
                className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-orange-burnt/50 outline-none text-xs sm:text-sm font-sans text-white transition-colors"
                disabled={!heroButtonEnabled}
              />
              <button
                onClick={() => setHeroButtonEnabled(!heroButtonEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${heroButtonEnabled ? 'bg-orange-burnt' : 'bg-white/20'}`}
                role="switch"
                aria-checked={heroButtonEnabled}
              >
                <span className="sr-only">Enable Button</span>
                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${heroButtonEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">Custom Button Link</label>
            <select
              value={heroButtonLink}
              onChange={e => setHeroButtonLink(e.target.value)}
              disabled={!heroButtonEnabled}
              className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-orange-burnt/50 outline-none text-xs sm:text-sm font-sans text-white transition-colors"
            >
              <option value="" className="bg-[#0D1B3E] text-white">Select a page...</option>
              <option value="/" className="bg-[#0D1B3E] text-white">Home</option>
              <option value="/council" className="bg-[#0D1B3E] text-white">Council</option>
              <option value="/ask" className="bg-[#0D1B3E] text-white">Ask a Question</option>
              <option value="/notices" className="bg-[#0D1B3E] text-white">Notices</option>
              <option value="/events" className="bg-[#0D1B3E] text-white">Events</option>
              <option value="/media" className="bg-[#0D1B3E] text-white">Gallery</option>
              <option value="/contact" className="bg-[#0D1B3E] text-white">Contact</option>
              <option value="/terms" className="bg-[#0D1B3E] text-white">Terms</option>
              <option value="/refunds" className="bg-[#0D1B3E] text-white">Refunds</option>
              <option value="/pay" className="bg-[#0D1B3E] text-white">Pay</option>
            </select>
          </div>

          <div className="space-y-1.5 sm:col-span-2 pt-2 border-t border-white/5">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-3">Default Buttons</label>
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setHeroAskButtonEnabled(!heroAskButtonEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${heroAskButtonEnabled ? 'bg-orange-burnt' : 'bg-white/20'}`}
                  role="switch"
                  aria-checked={heroAskButtonEnabled}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${heroAskButtonEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm font-sans text-white/80">Show "Ask a Question" Button</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setHeroNoticeButtonEnabled(!heroNoticeButtonEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${heroNoticeButtonEnabled ? 'bg-orange-burnt' : 'bg-white/20'}`}
                  role="switch"
                  aria-checked={heroNoticeButtonEnabled}
                >
                  <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${heroNoticeButtonEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
                <span className="text-sm font-sans text-white/80">Show "Notice Board" Button</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={saveHeroText}
            disabled={isSaving === 'hero_text' || (heroBadgeText === originalHeroBadgeText && heroTitleText1 === originalHeroTitleText1 && heroTitleText2 === originalHeroTitleText2 && heroSubtitleText === originalHeroSubtitleText && heroButtonText === originalHeroButtonText && heroButtonLink === originalHeroButtonLink && heroButtonEnabled === originalHeroButtonEnabled && heroAskButtonEnabled === originalHeroAskButtonEnabled && heroNoticeButtonEnabled === originalHeroNoticeButtonEnabled)}
            className="flex items-center space-x-1.5 px-5 py-2.5 bg-orange-burnt hover:bg-orange-burnt/90 text-white rounded-lg font-display text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-orange-burnt/15"
          >
            {isSaving === 'hero_text' ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Saving...</span></> : <><Check className="w-3.5 h-3.5" /><span>Save Hero Texts</span></>}
          </button>
          <button
            onClick={() => {
              setHeroBadgeText(originalHeroBadgeText);
              setHeroTitleText1(originalHeroTitleText1);
              setHeroTitleText2(originalHeroTitleText2);
              setHeroSubtitleText(originalHeroSubtitleText);
              setHeroButtonText(originalHeroButtonText);
              setHeroButtonLink(originalHeroButtonLink);
              setHeroButtonEnabled(originalHeroButtonEnabled);
              setHeroAskButtonEnabled(originalHeroAskButtonEnabled);
              setHeroNoticeButtonEnabled(originalHeroNoticeButtonEnabled);
            }}
            disabled={heroBadgeText === originalHeroBadgeText && heroTitleText1 === originalHeroTitleText1 && heroTitleText2 === originalHeroTitleText2 && heroSubtitleText === originalHeroSubtitleText && heroButtonText === originalHeroButtonText && heroButtonLink === originalHeroButtonLink && heroButtonEnabled === originalHeroButtonEnabled && heroAskButtonEnabled === originalHeroAskButtonEnabled && heroNoticeButtonEnabled === originalHeroNoticeButtonEnabled}
            className="flex items-center space-x-1.5 px-4 py-2.5 border border-white/10 rounded-lg text-white/60 font-display text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Browser Tab Favicon ───────────────────────────────────────────── */}
      <div className="bg-[#0D1B3E]/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6 space-y-5">
        <div className="flex items-center space-x-2 pb-3 border-b border-white/5">
          <Upload className="w-4 h-4 text-orange-burnt" />
          <h4 className="font-display font-bold text-sm text-white">Browser Tab Favicon (Logo)</h4>
        </div>

        {/* Preview */}
        <div className="flex items-center space-x-5">
          <div className="w-14 h-14 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
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
              <ImageIcon className="w-6 h-6 text-white/20" />
            )}
          </div>
          <div className="text-xs text-white/40 font-sans leading-relaxed">
            <p className="font-semibold text-white/60 mb-1">Current Favicon URL:</p>
            {originalFavicon ? (
              <a href={originalFavicon} target="_blank" rel="noopener noreferrer" className="text-orange-burnt hover:underline flex items-center space-x-1 truncate max-w-xs">
                <ExternalLink className="w-3 h-3 shrink-0" />
                <span className="truncate">{originalFavicon}</span>
              </a>
            ) : (
              <span className="italic text-white/20">No custom favicon URL set — using default tab icon</span>
            )}
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
            New Favicon Image URL (must be https://)
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={faviconUrl}
              onChange={e => { setFaviconUrl(e.target.value); setFaviconError(''); }}
              placeholder="https://res.cloudinary.com/.../favicon.png"
              className={`flex-grow px-4 py-2.5 rounded-lg border bg-white/5 text-white placeholder:text-white/20 outline-none text-sm font-sans transition-colors ${faviconError ? 'border-red-400' : 'border-white/10 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50'}`}
            />
            <label className="flex items-center justify-center px-4 py-2.5 bg-white/5 hover:bg-orange-burnt border border-white/10 text-white rounded-lg cursor-pointer transition-colors shrink-0 select-none text-xs font-bold font-display shadow-xs active:scale-98">
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
            className="flex items-center space-x-1.5 px-4 py-2.5 border border-white/10 rounded-lg text-white/60 font-display text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Announcement Bar Settings ────────────────────────────────────── */}
      <div className="bg-[#0D1B3E]/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center space-x-2">
            <Megaphone className="w-4 h-4 text-orange-burnt" />
            <h4 className="font-display font-bold text-sm text-white">📢 Live Announcement Bar</h4>
          </div>
          <label className="relative inline-flex items-center cursor-pointer select-none">
            <input
              type="checkbox"
              checked={announcementEnabled}
              onChange={e => setAnnouncementEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#0D1B3E] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[#0D1B3E] after:border-white/10 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-burnt" />
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-white/40">
              {announcementEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        </div>

        {/* Announcement Text Input */}
        <div className="space-y-2">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40">
            Announcement Ticker Text (displayed at the very top of the website)
          </label>
          <textarea
            value={announcementText}
            onChange={e => setAnnouncementText(e.target.value)}
            placeholder="🎉 Welcome to the official TGPCOP Student Council Portal! Admissions are open for the academic year 2026-2027. Apply now!"
            rows={3}
            maxLength={300}
            className="w-full px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 focus:border-orange-burnt/50 focus:ring-1 focus:ring-orange-burnt/50 outline-none text-sm font-sans text-white transition-colors resize-none placeholder:text-white/20"
          />
          <div className="flex justify-between text-[9px] text-white/30 font-bold uppercase tracking-wider">
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
            className="flex items-center space-x-1.5 px-4 py-2.5 border border-white/10 rounded-lg text-white/60 font-display text-xs font-bold hover:bg-white/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ── Payment Purposes Manager ────────────────────────────────────── */}
      <div className="bg-[#0D1B3E]/40 backdrop-blur-md border border-white/10 rounded-2xl shadow-lg p-6 space-y-5 select-none">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4 text-orange-burnt" />
            <h4 className="font-display font-bold text-sm text-white">💳 Predefined Payment Purposes</h4>
          </div>
          <button
            onClick={() => setIsPurposesModalOpen(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white rounded-lg font-display text-[10px] font-bold uppercase tracking-wider hover:shadow-[0_4px_12px_rgba(214,90,30,0.3)] transition-all cursor-pointer hover:-translate-y-px active:scale-95 shadow-sm"
          >
            ➕ Add New Purpose
          </button>
        </div>

        {purposesLoading ? (
          <div className="py-8 text-center text-white/40 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-orange-burnt" />
            <span>Loading active purposes...</span>
          </div>
        ) : purposes.length === 0 ? (
          <div className="py-8 text-center text-white/30 text-xs italic">
            No predefined payment purposes configured. Predefined purposes will sync instantly with student Pay page.
          </div>
        ) : (
          <div className="overflow-x-auto border border-white/10 rounded-xl overflow-hidden bg-white/5">
            <table className="w-full text-xs">
              <thead className="bg-white/5 text-white/40 font-bold uppercase tracking-wider text-[9px] border-b border-white/10">
                <tr>
                  <th className="text-left px-4 py-2.5">Purpose Name</th>
                  <th className="text-left px-4 py-2.5">Amount</th>
                  <th className="text-right px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                {purposes.map((p) => {
                  const shareUrl = `${window.location.origin}/pay?purpose=${encodeURIComponent(p.name)}&amount=${p.amount}`;
                  const isCopied = copiedPurposeId === p.id;

                  const handleCopy = () => {
                    navigator.clipboard.writeText(shareUrl);
                    setCopiedPurposeId(p.id);
                    toast.success('📋 Direct link copied!');
                    setTimeout(() => setCopiedPurposeId(null), 2000);
                  };

                  return (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-2.5 font-semibold">{p.name}</td>
                      <td className="px-4 py-2.5 font-bold text-orange-burnt">₹{p.amount}</td>
                      <td className="px-4 py-2.5 text-right space-x-1.5 shrink-0">
                        {/* Copy Link */}
                        <button
                          onClick={handleCopy}
                          title="Copy Direct Payment Link"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-white/10 hover:border-orange-burnt hover:bg-orange-burnt/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        {/* QR Code */}
                        <button
                          onClick={() => setSharePurpose(p)}
                          title="View QR Code Scanner"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-white/10 hover:border-orange-burnt hover:bg-orange-burnt/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() => handleDeletePurpose(p.id)}
                          title="Delete Purpose"
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md border border-red-500/20 hover:border-red-500 hover:bg-red-500/10 text-red-400 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Purpose Modal */}
      {isPurposesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="bg-[#0D1B3E] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-display font-extrabold text-sm text-white border-b border-white/10 pb-2 mb-4 uppercase tracking-wide flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-orange-burnt" />
              <span>Add Predefined Purpose</span>
            </h3>
            <form onSubmit={handleAddPurpose} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Purpose Name*</label>
                <input
                  type="text"
                  value={newPurposeName}
                  onChange={(e) => setNewPurposeName(e.target.value)}
                  placeholder="e.g. Pharma Quiz 2026"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 focus:border-orange-burnt/50 outline-none text-xs font-sans text-white bg-white/5 placeholder:text-white/20"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/40 mb-1">Amount (INR)*</label>
                <input
                  type="number"
                  value={newPurposeAmount}
                  onChange={(e) => setNewPurposeAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  placeholder="e.g. 50"
                  className="w-full px-3 py-2 rounded-lg border border-white/10 focus:border-orange-burnt/50 outline-none text-xs font-sans text-white bg-white/5 placeholder:text-white/20"
                  required
                  min="0"
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurposesModalOpen(false)}
                  className="flex-1 py-2 text-xs font-display font-bold border border-white/10 hover:bg-white/5 text-white/60 rounded-lg cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPurpose}
                  className="flex-1 py-2 bg-gradient-to-r from-orange-burnt to-[#E06D2B] text-white font-display text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center space-x-1"
                >
                  {isSavingPurpose ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>Save Purpose</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Share Purposes QR Code Modal */}
      {sharePurpose && (() => {
        const generatedUrl = `${window.location.origin}/pay?purpose=${encodeURIComponent(sharePurpose.name)}&amount=${sharePurpose.amount}`;
        const handleCopyLink = () => {
          navigator.clipboard.writeText(generatedUrl);
          toast.success('📋 Payment link copied to clipboard!');
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <div className="bg-[#0D1B3E] border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-200 text-white">
              <h3 className="font-display font-extrabold text-sm text-white border-b border-white/10 pb-2 mb-4 uppercase tracking-wide flex items-center space-x-2">
                <QrCode className="w-4 h-4 text-orange-burnt" />
                <span>Predefined QR Code</span>
              </h3>
              <div className="space-y-4">
                <div className="text-center font-display font-bold text-xs text-white leading-snug">
                  {sharePurpose.name} — <span className="text-orange-burnt font-extrabold">₹{sharePurpose.amount}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <QRCode value={generatedUrl} size={140} />
                  </div>
                  <span className="text-[9px] text-white/40 font-semibold uppercase tracking-wider">
                    Scan to pay on mobile device
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={generatedUrl}
                    readOnly
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 text-[10px] font-mono select-all focus:outline-none text-white/70"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-orange-burnt border border-white/10 text-white font-display text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1 shrink-0"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => setSharePurpose(null)}
                className="mt-5 w-full py-2 border border-white/10 hover:bg-white/5 text-white/60 rounded-lg font-display text-xs font-bold transition-colors uppercase tracking-widest cursor-pointer"
              >
                Close QR Box
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default AdminSettings;
