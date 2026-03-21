'use client';

import { useEffect } from 'react';
import { useDecibelStore } from '@/lib/store/decibel-store';
import { getSessions } from '@/lib/db/local';
import { getCloudSessions } from '@/lib/db/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SessionHistory() {
  const { pastSessions, setPastSessions, loadSessionFromHistory, session } = useDecibelStore();

  // Load sessions from IndexedDB + Supabase on mount
  useEffect(() => {
    Promise.all([
      getSessions().catch(() => []),
      getCloudSessions().catch(() => []),
    ]).then(([local, cloud]) => {
      // Merge and dedupe by id
      const map = new Map<string, typeof local[0]>();
      [...local, ...cloud].forEach(s => map.set(s.id, s));
      const merged = Array.from(map.values()).sort((a, b) => b.startTime - a.startTime);
      setPastSessions(merged);
    });
  }, [setPastSessions]);

  if (pastSessions.length === 0) return null;

  // Filter out the currently active session
  const history = pastSessions.filter((s) => s.id !== session?.id);
  if (history.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Past Sessions
      </h2>
      <div className="space-y-2">
        {history.slice(0, 10).map((s) => {
          const dur = s.endTime ? Math.round((s.endTime - s.startTime) / 60000) : 0;
          const date = new Date(s.startTime);
          const riskLevel = s.noiseDosePercent >= 80 ? 'danger' : s.noiseDosePercent >= 40 ? 'caution' : 'safe';

          return (
            <button
              key={s.id}
              onClick={() => loadSessionFromHistory(s)}
              className="w-full text-left"
            >
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                <CardContent className="p-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0">
                      <p className="text-xs font-mono font-bold text-foreground">{Math.round(s.avgDb)} dB</p>
                      <p className="text-[9px] font-mono text-muted-foreground/50">{dur}m</p>
                    </div>
                    <div className="w-px h-8 bg-border shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-mono text-muted-foreground truncate">
                        {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[9px] font-mono text-muted-foreground/50">
                        Peak {Math.round(s.maxDb)} dB · Dose {Math.round(s.noiseDosePercent)}%
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={riskLevel === 'danger' ? 'danger' : riskLevel === 'caution' ? 'caution' : 'safe'}
                    className="shrink-0 text-[9px] font-mono"
                  >
                    {riskLevel === 'danger' ? 'High' : riskLevel === 'caution' ? 'Med' : 'Low'}
                  </Badge>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>
    </div>
  );
}
