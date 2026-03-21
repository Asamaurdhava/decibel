'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useDecibelStore } from '@/lib/store/decibel-store';
import * as d3 from 'd3';
import { ExposureReading } from '@/lib/types';

const GOLD = '#FFAA00';

export default function ExposureTimeline() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { readings, isMonitoring } = useDecibelStore();

  const drawChart = useCallback(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const isSmall = width < 400;

    const margin = { top: 12, right: isSmall ? 8 : 16, bottom: isSmall ? 24 : 28, left: isSmall ? 32 : 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    d3.select(svg).selectAll('*').remove();

    const g = d3.select(svg)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data: ExposureReading[] = readings.length > 1 ? readings : [
      { timestamp: Date.now() - 60000, db: 45, zone: 'safe' as const },
      { timestamp: Date.now(), db: 45, zone: 'safe' as const },
    ];

    const xScale = d3.scaleTime()
      .domain(d3.extent(data, d => d.timestamp) as [number, number])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, Math.max(120, d3.max(data, d => d.db) || 100)])
      .range([innerHeight, 0]);

    // Grid
    g.selectAll('.grid')
      .data(yScale.ticks(isSmall ? 4 : 5))
      .enter().append('line')
      .attr('x1', 0).attr('x2', innerWidth)
      .attr('y1', d => yScale(d)).attr('y2', d => yScale(d))
      .attr('stroke', 'rgba(255,255,255,0.04)')
      .attr('stroke-dasharray', '2,4');

    // 85 dB line
    const dangerY = yScale(85);
    g.append('line')
      .attr('x1', 0).attr('x2', innerWidth)
      .attr('y1', dangerY).attr('y2', dangerY)
      .attr('stroke', GOLD).attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4').attr('opacity', 0.4);

    g.append('text')
      .attr('x', innerWidth - 2).attr('y', dangerY - 4)
      .attr('text-anchor', 'end')
      .attr('fill', GOLD).attr('font-size', isSmall ? '8px' : '9px')
      .attr('font-family', 'Space Mono, monospace').attr('opacity', 0.5)
      .text('85 dB');

    // Area
    const area = d3.area<ExposureReading>()
      .x(d => xScale(d.timestamp)).y0(innerHeight).y1(d => yScale(d.db))
      .curve(d3.curveMonotoneX);

    const gradient = g.append('defs').append('linearGradient')
      .attr('id', 'area-grad').attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', '#ffffff').attr('stop-opacity', 0.08);
    gradient.append('stop').attr('offset', '100%').attr('stop-color', '#ffffff').attr('stop-opacity', 0.01);

    g.append('path').datum(data).attr('d', area).attr('fill', 'url(#area-grad)');

    // Line
    const line = d3.line<ExposureReading>()
      .x(d => xScale(d.timestamp)).y(d => yScale(d.db))
      .curve(d3.curveMonotoneX);

    g.append('path').datum(data).attr('d', line)
      .attr('fill', 'none').attr('stroke', '#ffffff').attr('stroke-width', 1).attr('opacity', 0.5);

    // Dot
    if (data.length > 0 && isMonitoring) {
      const latest = data[data.length - 1];
      const c = latest.zone === 'caution' ? GOLD : '#ffffff';
      g.append('circle')
        .attr('cx', xScale(latest.timestamp)).attr('cy', yScale(latest.db))
        .attr('r', 3).attr('fill', c).attr('opacity', 0.8);
    }

    // Axes
    const axisColor = 'rgba(255,255,255,0.08)';
    const textColor = 'rgba(255,255,255,0.25)';
    const fontSize = isSmall ? '8px' : '9px';

    g.append('g').attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(isSmall ? 3 : 5).tickFormat(d => {
        const date = d instanceof Date ? d : new Date(d as number);
        return date.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
      }))
      .call(g => g.select('.domain').attr('stroke', axisColor))
      .call(g => g.selectAll('.tick line').attr('stroke', axisColor))
      .call(g => g.selectAll('.tick text').attr('fill', textColor).attr('font-size', fontSize).attr('font-family', 'Space Mono, monospace'));

    g.append('g')
      .call(d3.axisLeft(yScale).ticks(isSmall ? 4 : 5).tickFormat(d => `${d}`))
      .call(g => g.select('.domain').attr('stroke', axisColor))
      .call(g => g.selectAll('.tick line').attr('stroke', axisColor))
      .call(g => g.selectAll('.tick text').attr('fill', textColor).attr('font-size', fontSize).attr('font-family', 'Space Mono, monospace'));

  }, [readings, isMonitoring]);

  useEffect(() => { drawChart(); }, [drawChart]);
  useEffect(() => { const h = () => drawChart(); window.addEventListener('resize', h); return () => window.removeEventListener('resize', h); }, [drawChart]);

  return (
    <div ref={containerRef} className="w-full h-40 sm:h-48 md:h-56 lg:h-64 rounded-lg border border-border bg-card overflow-hidden relative">
      <svg ref={svgRef} className="w-full h-full" />
      <span className="absolute top-2.5 left-3 text-[9px] text-muted-foreground/50 font-mono uppercase tracking-[0.2em]">
        Exposure
      </span>
    </div>
  );
}
