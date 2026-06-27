import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { supabase } from '../../lib/supabase';
import { verifyAndCheckInQr, type CheckInRegistration, type CheckInResult } from '../../lib/checkIn';
import { useToast } from '../../components/admin/Toast';
import {
  QrCode, Camera, CameraOff, Loader2, CheckCircle2, XCircle,
  User, GraduationCap, Building2, CreditCard, Hash, RefreshCw,
} from 'lucide-react';

type ScanScreen = 'idle' | 'scanning' | 'success' | 'already' | 'invalid';

const SCANNER_ID = 'tgpcop-qr-scanner';

export const AdminQrScanner: React.FC = () => {
  const toast = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [services, setServices] = useState<Array<{ id: string; name: string; category: string }>>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('all');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [screen, setScreen] = useState<ScanScreen>('idle');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [manualInput, setManualInput] = useState('');

  useEffect(() => {
    supabase.from('services')
      .select('id, name, category')
      .eq('is_active', true)
      .neq('status', 'draft')
      .order('name')
      .then(({ data }) => setServices(data || []));
  }, []);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.getState() === Html5QrcodeScannerState.SCANNING) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch { /* ignore */ }
      scannerRef.current = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    return () => { void stopCamera(); };
  }, [stopCamera]);

  const handleScanResult = useCallback(async (raw: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      const serviceId = selectedServiceId === 'all' ? null : selectedServiceId;
      const res = await verifyAndCheckInQr(raw, serviceId);
      setResult(res);

      if (res.status === 'success') {
        setScreen('success');
      } else if (res.status === 'already_checked_in') {
        setScreen('already');
      } else {
        setScreen('invalid');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Scan failed';
      setResult({ status: 'error', message: msg });
      setScreen('invalid');
    } finally {
      cooldownRef.current = setTimeout(() => {
        processingRef.current = false;
      }, 2500);
    }
  }, [selectedServiceId]);

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      await stopCamera();
      const scanner = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = scanner;

      const cameras = await Html5Qrcode.getCameras();
      const backCam = cameras.find(c => /back|rear|environment/i.test(c.label));
      const cameraId = backCam?.id || cameras[0]?.id;

      await scanner.start(
        cameraId || { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1 },
        (decoded) => { void handleScanResult(decoded); },
        () => { /* ignore scan failures */ }
      );
      setCameraActive(true);
      setScreen('scanning');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera access denied';
      toast.error(msg);
    } finally {
      setCameraLoading(false);
    }
  };

  const resetScan = () => {
    setScreen(cameraActive ? 'scanning' : 'idle');
    setResult(null);
    processingRef.current = false;
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    void handleScanResult(manualInput.trim());
    setManualInput('');
  };

  const reg = result?.registration;
  const selectedService = services.find(s => s.id === selectedServiceId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <QrCode className="w-6 h-6 text-orange-burnt animate-pulse" />
          <div>
            <h2 className="font-display font-extrabold text-xl text-white">QR Scanner</h2>
            <p className="text-white/40 text-xs">Camera-based event check-in · secure token verification</p>
          </div>
        </div>
        <select
          value={selectedServiceId}
          onChange={e => setSelectedServiceId(e.target.value)}
          className="px-3 py-2.5 bg-[#0D1B3E] border border-white/10 rounded-lg text-sm text-white outline-none focus:border-orange-burnt min-w-[220px]"
        >
          <option value="all">All Events / Services</option>
          {services.map(s => (
            <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
          ))}
        </select>
      </div>

      {selectedServiceId !== 'all' && selectedService && (
        <div className="px-4 py-2 rounded-lg bg-orange-burnt/10 border border-orange-burnt/20 text-orange-burnt text-xs font-bold">
          Filtering check-ins for: {selectedService.name}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner panel */}
        <div className="bg-[#0D1B3E]/40 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-white/50">Camera Scanner</span>
            <div className="flex gap-2">
              {!cameraActive ? (
                <button
                  onClick={() => void startCamera()}
                  disabled={cameraLoading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 text-xs font-bold hover:bg-emerald-500/25 transition-all disabled:opacity-50"
                >
                  {cameraLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  Start Camera
                </button>
              ) : (
                <button
                  onClick={() => void stopCamera()}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 border border-red-500/25 text-xs font-bold hover:bg-red-500/25 transition-all"
                >
                  <CameraOff className="w-3.5 h-3.5" /> Stop
                </button>
              )}
              <button
                onClick={resetScan}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/60 border border-white/10 text-xs font-bold hover:bg-white/10 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>
          </div>

          <div className="relative bg-black min-h-[320px] flex items-center justify-center">
            <div id={SCANNER_ID} className="w-full" />
            {!cameraActive && screen === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/30 pointer-events-none">
                <QrCode className="w-16 h-16 mb-3 opacity-30" />
                <p className="text-sm font-display">Tap Start Camera to scan QR codes</p>
                <p className="text-[10px] mt-1">Works on mobile & desktop with webcam</p>
              </div>
            )}
          </div>

          <form onSubmit={handleManualSubmit} className="p-4 border-t border-white/10 flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={e => setManualInput(e.target.value)}
              placeholder="Paste QR payload manually (fallback)..."
              className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white placeholder-white/30 outline-none focus:border-orange-burnt"
            />
            <button type="submit" className="px-4 py-2 bg-orange-burnt text-white text-xs font-bold rounded-lg hover:opacity-90">
              Verify
            </button>
          </form>
        </div>

        {/* Result panel */}
        <div className="min-h-[400px]">
          <ScanResultPanel screen={screen} registration={reg} message={result?.message} onContinue={resetScan} />
        </div>
      </div>
    </div>
  );
};

function ScanResultPanel({
  screen,
  registration,
  message,
  onContinue,
}: {
  screen: ScanScreen;
  registration?: CheckInRegistration;
  message?: string;
  onContinue: () => void;
}) {
  if (screen === 'idle' || (screen === 'scanning' && !registration)) {
    return (
      <div className="h-full min-h-[400px] bg-[#0D1B3E]/20 border border-white/10 border-dashed rounded-2xl flex flex-col items-center justify-center text-white/30 p-8 text-center">
        <QrCode className="w-12 h-12 mb-4 opacity-20" />
        <p className="font-display text-sm">Scan a registration QR to verify check-in</p>
        <p className="text-[10px] mt-2 max-w-xs">QR contains only a secure token — no student data is exposed in the code itself</p>
      </div>
    );
  }

  const configs: Record<Exclude<ScanScreen, 'idle' | 'scanning'>, { bg: string; border: string; icon: React.ReactNode; title: string; subtitle: string }> = {
    success: {
      bg: 'bg-emerald-600',
      border: 'border-emerald-400',
      icon: <CheckCircle2 className="w-20 h-20 text-white" />,
      title: '✓ Valid Registration',
      subtitle: 'Check-in recorded successfully',
    },
    already: {
      bg: 'bg-red-600',
      border: 'border-red-400',
      icon: <XCircle className="w-20 h-20 text-white" />,
      title: '✗ Already Checked In',
      subtitle: message || 'This QR was already scanned',
    },
    invalid: {
      bg: 'bg-zinc-600',
      border: 'border-zinc-400',
      icon: <XCircle className="w-20 h-20 text-white" />,
      title: '✗ Invalid QR',
      subtitle: message || 'QR not recognized or payment incomplete',
    },
  };

  const cfg = configs[screen as keyof typeof configs];
  if (!cfg) return null;

  return (
    <div className={`rounded-2xl overflow-hidden border-2 ${cfg.border} shadow-2xl animate-in fade-in duration-300`}>
      <div className={`${cfg.bg} px-6 py-10 text-center text-white`}>
        <div className="flex justify-center mb-4">{cfg.icon}</div>
        <h3 className="font-display font-extrabold text-2xl mb-1">{cfg.title}</h3>
        <p className="text-white/80 text-sm">{cfg.subtitle}</p>
      </div>

      {registration && (
        <div className="bg-[#0D1B3E] p-6 space-y-4">
          <div className="flex items-start gap-4">
            {registration.avatar_url ? (
              <img src={registration.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-orange-burnt/40 shrink-0" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <User className="w-8 h-8 text-white/30" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-display font-extrabold text-lg text-white truncate">{registration.full_name}</h4>
              <p className="text-orange-burnt text-xs font-bold mt-0.5">{registration.service_name || 'Event'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <InfoChip icon={<GraduationCap className="w-3.5 h-3.5" />} label="Course / Year" value={registration.branch || registration.year || '—'} />
            <InfoChip icon={<Hash className="w-3.5 h-3.5" />} label="PRN" value={registration.prn || '—'} />
            <InfoChip icon={<Building2 className="w-3.5 h-3.5" />} label="College" value={registration.college || '—'} />
            <InfoChip icon={<Hash className="w-3.5 h-3.5" />} label="Registration ID" value={registration.registration_id} mono />
            <InfoChip icon={<CreditCard className="w-3.5 h-3.5" />} label="Payment" value={registration.payment_status === 'completed' ? 'PAID ✓' : registration.payment_status?.toUpperCase() || '—'} />
            <InfoChip
              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
              label="Check-in"
              value={registration.checked_in
                ? (registration.checked_in_at ? new Date(registration.checked_in_at).toLocaleTimeString('en-IN') : 'YES')
                : 'NO'}
            />
          </div>

          {registration.year && (
            <p className="text-[10px] text-white/40">Year: {registration.year}</p>
          )}
        </div>
      )}

      <div className="bg-[#080F22] px-6 py-4">
        <button
          onClick={onContinue}
          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-display text-xs font-bold uppercase tracking-wide transition-colors"
        >
          Scan Next
        </button>
      </div>
    </div>
  );
}

function InfoChip({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string; mono?: boolean }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-white/40 mb-1">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-xs font-semibold text-white truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}

export default AdminQrScanner;
