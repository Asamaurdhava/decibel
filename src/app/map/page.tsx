'use client';

import NoiseMap from '@/components/NoiseMap';
import { useDecibelStore } from '@/lib/store/decibel-store';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function MapPage() {
  const { mapPins } = useDecibelStore();

  const avgDb = mapPins.length > 0 ? Math.round(mapPins.reduce((s, p) => s + p.avgDb, 0) / mapPins.length) : 0;
  const peakDb = mapPins.length > 0 ? Math.round(Math.max(...mapPins.map(p => p.peakDb))) : 0;
  const dangerPins = mapPins.filter(p => p.zone === 'danger').length;

  return (
    <div className="container py-4 sm:py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h1 className="text-lg sm:text-xl font-mono font-bold tracking-wider text-foreground uppercase">Noise Map</h1>
          <p className="text-muted-foreground text-xs font-mono mt-0.5">Community noise heatmap</p>
        </div>
        {mapPins.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">Avg {avgDb} dB</Badge>
            <Badge variant="outline" className="font-mono text-[10px] sm:text-xs">Peak {peakDb} dB</Badge>
            {dangerPins > 0 && <Badge variant="danger" className="font-mono text-[10px] sm:text-xs">{dangerPins} danger</Badge>}
          </div>
        )}
      </div>

      <div className="h-[calc(100dvh-280px)] sm:h-[calc(100dvh-240px)] md:h-[calc(100dvh-160px)] min-h-[300px]">
        <NoiseMap />
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <LegendItem color="rgba(255,255,255,0.5)" label="< 70 dB" desc="Safe exposure" />
        <LegendItem color="#FFAA00" label="70–85 dB" desc="Use caution" />
        <LegendItem color="rgba(255,255,255,0.8)" label="> 85 dB" desc="Damage risk" />
      </div>
    </div>
  );
}

function LegendItem({ color, label, desc }: { color: string; label: string; desc: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <div>
          <span className="text-xs font-mono text-foreground">{label}</span>
          <span className="text-muted-foreground text-[10px] ml-2">{desc}</span>
        </div>
      </CardContent>
    </Card>
  );
}
