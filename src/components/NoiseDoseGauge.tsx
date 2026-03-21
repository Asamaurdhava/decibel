'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useDecibelStore } from '@/lib/store/decibel-store';
import * as d3 from 'd3';

const GOLD = '#FFAA00';

export default function NoiseDoseGauge() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { noiseDosePercent, isMonitoring, timeAbove85 } = useDecibelStore();

  const drawGauge = useCallback(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const rect = container.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    const isSmall = size < 160;

    d3.select(svg).selectAll('*').remove();

    const g = d3.select(svg)
      .attr('width', rect.width).attr('height', rect.height)
      .append('g').attr('transform', `translate(${rect.width / 2},${rect.height / 2})`);

    const radius = size / 2 - (isSmall ? 12 : 20);
    const arcWidth = isSmall ? 6 : 8;

    // Background arc
    const bgArc = d3.arc()
      .innerRadius(radius - arcWidth).outerRadius(radius)
      .startAngle(-Math.PI * 0.75).endAngle(Math.PI * 0.75)
      .cornerRadius(arcWidth / 2);

    g.append('path').attr('d', bgArc as unknown as string).attr('fill', 'rgba(255,255,255,0.06)');

    // Value arc
    const doseClamp = Math.min(100, Math.max(0, noiseDosePercent));
    const angleScale = d3.scaleLinear().domain([0, 100]).range([-Math.PI * 0.75, Math.PI * 0.75]);

    const doseColor = noiseDosePercent >= 80 ? '#ffffff' : GOLD;

    const valueArc = d3.arc()
      .innerRadius(radius - arcWidth).outerRadius(radius)
      .startAngle(-Math.PI * 0.75).endAngle(angleScale(doseClamp))
      .cornerRadius(arcWidth / 2);

    g.append('path').attr('d', valueArc as unknown as string).attr('fill', doseColor).attr('opacity', 0.8);

    // Tick marks
    for (let i = 0; i <= 10; i++) {
      const angle = -Math.PI * 0.75 + (i / 10) * Math.PI * 1.5;
      g.append('line')
        .attr('x1', Math.cos(angle) * (radius + 2)).attr('y1', Math.sin(angle) * (radius + 2))
        .attr('x2', Math.cos(angle) * (radius + (i % 5 === 0 ? 5 : 3)))
        .attr('y2', Math.sin(angle) * (radius + (i % 5 === 0 ? 5 : 3)))
        .attr('stroke', 'rgba(255,255,255,0.1)').attr('stroke-width', i % 5 === 0 ? 1 : 0.5);
    }

    // Center text
    g.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('y', isSmall ? -6 : -8)
      .attr('fill', doseColor).attr('font-size', isSmall ? '18px' : '24px')
      .attr('font-family', 'Space Mono, monospace').attr('font-weight', '700')
      .text(isMonitoring ? `${Math.round(noiseDosePercent)}%` : '--%');

    g.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
      .attr('y', isSmall ? 10 : 14)
      .attr('fill', 'rgba(255,255,255,0.3)').attr('font-size', '8px')
      .attr('font-family', 'Space Mono, monospace').attr('letter-spacing', '0.15em')
      .text('DAILY DOSE');

    if (isMonitoring && timeAbove85 > 0) {
      const t = timeAbove85 < 60 ? `${Math.round(timeAbove85)}s` : `${Math.floor(timeAbove85 / 60)}m ${Math.round(timeAbove85 % 60)}s`;
      g.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'central')
        .attr('y', isSmall ? 24 : 30)
        .attr('fill', GOLD).attr('font-size', '7px').attr('opacity', 0.6)
        .attr('font-family', 'Space Mono, monospace').text(`${t} above 85dB`);
    }
  }, [noiseDosePercent, isMonitoring, timeAbove85]);

  useEffect(() => { drawGauge(); }, [drawGauge]);
  useEffect(() => { const h = () => drawGauge(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, [drawGauge]);

  return (
    <div ref={containerRef} className="w-full aspect-square max-w-[180px] sm:max-w-[200px] md:max-w-[220px] lg:max-w-[240px] mx-auto overflow-hidden p-2 sm:p-3">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
