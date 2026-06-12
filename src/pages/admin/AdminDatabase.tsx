import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { RequirePermission } from '../../components/admin/RequirePermission';
import { Database, Loader2, RefreshCw, Table2 } from 'lucide-react';

const TABLES = [
  'questions',
  'notices',
  'events',
  'gallery',
  'settings',
  'admin_roles',
] as const;

type TableName = (typeof TABLES)[number];

const TABLE_COLORS: Record<string, string> = {
  questions:   'text-blue-400 bg-blue-500/10 border-blue-500/20',
  notices:     'text-amber-400 bg-amber-500/10 border-amber-500/20',
  events:      'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  gallery:     'text-purple-400 bg-purple-500/10 border-purple-500/20',
  settings:    'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  admin_roles: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
};

export const AdminDatabase: React.FC = () => {
  const [counts, setCounts] = useState<Record<TableName, number | null>>(
    Object.fromEntries(TABLES.map((t) => [t, null])) as Record<TableName, number | null>
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCounts = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.all(
        TABLES.map(async (table) => {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          if (error) throw error;
          return { table, count: count ?? 0 };
        })
      );

      setCounts((prev) => {
        const next = { ...prev };
        results.forEach(({ table, count }) => {
          next[table] = count;
        });
        return next;
      });
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch table counts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return (
    <RequirePermission permission="view_database">
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-orange-burnt/10 rounded-xl border border-orange-burnt/20">
              <Database className="w-5 h-5 text-orange-burnt" />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-xl text-white">Database Viewer</h2>
              <p className="text-xs text-white/40 font-sans mt-0.5">Live row counts for all portal tables</p>
            </div>
          </div>
          <button
            onClick={fetchCounts}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-white/10 text-white/60 font-display text-xs font-bold hover:bg-white/[0.05] hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {isLoading && !lastUpdated ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/40">
            <Loader2 className="w-8 h-8 animate-spin text-orange-burnt mb-3" />
            <span className="font-display text-sm">Loading table stats...</span>
          </div>
        ) : (
          <div className="bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
            <ul className="divide-y divide-white/[0.04]">
              {TABLES.map((table) => {
                const colorCls = TABLE_COLORS[table] || 'text-white/40 bg-white/5 border-white/10';
                return (
                  <li
                    key={table}
                    className="flex items-center justify-between px-6 py-4 hover:bg-white/[0.025] transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-1.5 rounded-lg border ${colorCls}`}>
                        <Table2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-mono text-sm text-white/80 font-semibold group-hover:text-white transition-colors">
                        {table}
                      </span>
                    </div>
                    <div className="flex items-baseline space-x-1">
                      <span className="font-display font-extrabold text-xl text-orange-burnt tabular-nums">
                        {counts[table] !== null ? counts[table] : '—'}
                      </span>
                      {counts[table] !== null && (
                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">rows</span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            {lastUpdated && (
              <p className="text-[10px] text-white/30 text-center py-3 border-t border-white/[0.04] font-mono">
                Last updated {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
      </div>
    </RequirePermission>
  );
};

export default AdminDatabase;
