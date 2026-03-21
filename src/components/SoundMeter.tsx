'use client';

import { useDecibelStore } from '@/lib/store/decibel-store';
import { getZoneLabel } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function SoundMeter() {
  const { currentDb, peakDb, zone, isMonitoring } = useDecibelStore();

  const zoneLabel = getZoneLabel(zone);
  const displayDb = isMonitoring ? Math.round(currentDb) : '--';

  // B&W + gold: safe=white, caution=gold, danger=white with red badge
  const dbColorClass = zone === 'danger'
    ? 'text-white'
    : zone === 'caution'
    ? 'text-primary'
    : 'text-white';

  const badgeVariant = zone === 'danger'
    ? 'danger' as const
    : zone === 'caution'
    ? 'gold' as const
    : 'safe' as const;

  return (
    <div className="relative flex flex-col items-center justify-center w-full">
      {/* dB number */}
      <div className="relative z-10 select-none">
        <span
          className={cn(
            'font-mono font-bold tracking-tighter block text-center transition-colors duration-300',
            'text-[clamp(5rem,20vw,12rem)]',
            'sm:text-[clamp(6rem,18vw,12rem)]',
            'md:text-[clamp(6rem,14vw,10rem)]',
            'lg:text-[clamp(7rem,12vw,14rem)]',
            dbColorClass,
          )}
        >
          {displayDb}
        </span>
        <span className="block text-center text-xs sm:text-sm font-mono tracking-[0.3em] text-muted-foreground uppercase">
          decibels
        </span>
      </div>

      {/* Zone badge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={zone}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="mt-5 sm:mt-6"
        >
          <Badge variant={badgeVariant} className="font-mono text-[10px] tracking-[0.2em] px-4 py-1">
            {zoneLabel}
          </Badge>
        </motion.div>
      </AnimatePresence>

      {/* Peak + WHO limit */}
      {isMonitoring && peakDb > 0 && (
        <div className="mt-4 flex items-center gap-6 text-muted-foreground text-xs font-mono tracking-wider">
          <span>
            PEAK <span className="text-foreground">{Math.round(peakDb)}</span>
          </span>
          <span className="w-px h-3 bg-border" />
          <span>
            WHO <span className="text-primary">85</span>
          </span>
        </div>
      )}

      {/* Threshold bar */}
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md mt-8 sm:mt-10">
        <div className="relative h-[3px] rounded-full bg-secondary overflow-hidden">
          <motion.div
            className={cn(
              'absolute inset-y-0 left-0 rounded-full transition-colors duration-300',
              zone === 'danger' ? 'bg-red-500' : zone === 'caution' ? 'bg-primary' : 'bg-white/60'
            )}
            animate={{ width: `${Math.min(100, (currentDb / 120) * 100)}%` }}
            transition={{ duration: 0.1 }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-[2px] h-2 bg-primary/60"
            style={{ left: `${(85 / 120) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-[9px] text-muted-foreground/50 font-mono tracking-wider">
          <span>0</span>
          <span>30</span>
          <span>60</span>
          <span className="text-primary/60">85</span>
          <span>120</span>
        </div>
      </div>
    </div>
  );
}
