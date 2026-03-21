'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useDecibelStore } from '@/lib/store/decibel-store';

const ZONE_COLORS: Record<string, string> = {
  safe: '#ffffff',
  caution: '#FFAA00',
  danger: '#ffffff',
};

export default function FrequencySpectrum() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const { frequencyData, zone, isMonitoring } = useDecibelStore();

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

    if (!frequencyData || !isMonitoring) {
      const bars = 32;
      const bw = width / bars - 2;
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      for (let i = 0; i < bars; i++) {
        ctx.fillRect(i * (bw + 2), height - 2, bw, 2);
      }
      return;
    }

    const maxBars = width < 400 ? 32 : width < 768 ? 48 : 64;
    const step = Math.ceil(frequencyData.length / maxBars);
    const barGap = width < 400 ? 1 : 2;
    const barWidth = (width - (maxBars - 1) * barGap) / maxBars;

    for (let i = 0; i < maxBars; i++) {
      const dataIndex = i * step;
      if (dataIndex >= frequencyData.length) break;

      const value = frequencyData[dataIndex] / 255;
      const barHeight = Math.max(1, value * height * 0.85);
      const x = i * (barWidth + barGap);
      const y = height - barHeight;

      ctx.globalAlpha = 0.15 + value * 0.5;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, barWidth, barHeight);
    }
    ctx.globalAlpha = 1;
  }, [frequencyData, zone, isMonitoring]);

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
        Frequency
      </span>
    </div>
  );
}
