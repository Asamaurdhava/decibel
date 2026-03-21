'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useDecibelStore } from '@/lib/store/decibel-store';

// Gold: #FFAA00, White: #ffffff
const ZONE_COLORS: Record<string, string> = {
  safe: '#ffffff',
  caution: '#FFAA00',
  danger: '#ffffff',
};

export default function WaveformVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const { waveformData, zone, isMonitoring } = useDecibelStore();

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const color = ZONE_COLORS[zone] || '#ffffff';

    ctx.clearRect(0, 0, width, height);

    if (!waveformData || !isMonitoring) {
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      return;
    }

    const bufferLength = waveformData.length;
    const sliceWidth = width / bufferLength;

    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.6;

    ctx.beginPath();
    let x = 0;
    for (let i = 0; i < bufferLength; i++) {
      const v = waveformData[i];
      const y = (v * height * 0.8) / 2 + height / 2;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      x += sliceWidth;
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Center reference line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.setLineDash([2, 4]);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [waveformData, zone, isMonitoring]);

  useEffect(() => {
    const animate = () => { draw(); animationRef.current = requestAnimationFrame(animate); };
    animate();
    return () => cancelAnimationFrame(animationRef.current);
  }, [draw]);

  useEffect(() => {
    const h = () => draw();
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, [draw]);

  return (
    <div ref={containerRef} className="w-full h-24 sm:h-28 md:h-32 lg:h-36 rounded-lg border border-border bg-card overflow-hidden relative">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ width: '100%', height: '100%' }} />
      <span className="absolute top-2.5 left-3 text-[9px] text-muted-foreground/50 font-mono uppercase tracking-[0.2em]">
        Waveform
      </span>
    </div>
  );
}
