'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playCalibrationTone, calculateCalibrationOffset } from '@/lib/audio/calibrate';
import { setCalibrationOffset } from '@/lib/audio/analyzer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface CalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDbfs: number;
}

export default function CalibrationModal({ isOpen, onClose, currentDbfs }: CalibrationModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [referenceDb, setReferenceDb] = useState('');
  const [calibrated, setCalibrated] = useState(false);

  const handlePlayTone = async () => {
    setIsPlaying(true);
    try { await playCalibrationTone(1000, 5); setTimeout(() => setIsPlaying(false), 5000); }
    catch { setIsPlaying(false); }
  };

  const handleCalibrate = () => {
    const actual = parseFloat(referenceDb);
    if (isNaN(actual) || actual < 0 || actual > 150) return;
    setCalibrationOffset(calculateCalibrationOffset(currentDbfs, actual));
    setCalibrated(true);
    setTimeout(() => { onClose(); setCalibrated(false); setReferenceDb(''); }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-x-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 top-1/2 -translate-y-1/2 z-50 sm:w-full sm:max-w-sm">
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-foreground mb-1">Calibrate</h2>
                <p className="text-muted-foreground text-xs mb-5">Compare against a known reference device.</p>

                {calibrated ? (
                  <div className="text-center py-6">
                    <p className="text-primary text-3xl mb-2">&#10003;</p>
                    <p className="text-primary text-xs font-mono">Applied</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-2"><span className="text-foreground">1.</span> Play reference tone</p>
                      <Button variant="outline" onClick={handlePlayTone} disabled={isPlaying} className="w-full font-mono text-xs">
                        {isPlaying ? 'Playing...' : 'Play 1kHz Tone'}
                      </Button>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-2"><span className="text-foreground">2.</span> Enter reference dB</p>
                      <input type="number" value={referenceDb} onChange={(e) => setReferenceDb(e.target.value)}
                        placeholder="70" min="0" max="150"
                        className="flex h-9 w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-mono placeholder:text-muted-foreground/30 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button variant="ghost" onClick={onClose} className="flex-1 font-mono text-xs">Cancel</Button>
                      <Button onClick={handleCalibrate} disabled={!referenceDb || isNaN(parseFloat(referenceDb))}
                        className="flex-1 gold-shimmer-bg text-black font-mono text-xs font-bold border-0">Apply</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
