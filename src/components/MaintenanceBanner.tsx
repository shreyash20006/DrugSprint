import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertTriangle } from 'lucide-react';

export const MaintenanceBanner: React.FC = () => {
  const [active, setActive] = useState(false);

  useEffect(() => {
    async function checkMaintenance() {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'maintenance_mode')
          .single();

        if (!error && data?.value === 'true') {
          setActive(true);
        }
      } catch {
        /* ignore — public site still works */
      }
    }
    checkMaintenance();
  }, []);

  if (!active) return null;

  return (
    <div className="sticky top-0 z-[100] bg-amber-500 text-navy-dark px-4 py-2.5 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-center gap-2 text-center">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <p className="font-display font-bold text-xs sm:text-sm uppercase tracking-wide">
          Under Maintenance — We&apos;ll be back shortly. Thank you for your patience.
        </p>
      </div>
    </div>
  );
};

export default MaintenanceBanner;
