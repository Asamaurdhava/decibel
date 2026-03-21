// Mapbox heatmap data layer configuration

import { NoiseMapPin } from '@/lib/types';

/**
 * Convert noise map pins to GeoJSON for Mapbox heatmap layer
 */
export function pinsToGeoJSON(pins: NoiseMapPin[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pins.map(pin => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [pin.lng, pin.lat],
      },
      properties: {
        avgDb: pin.avgDb,
        peakDb: pin.peakDb,
        zone: pin.zone,
        timestamp: pin.timestamp,
        // Normalize intensity for heatmap (0-1 based on dB)
        intensity: Math.min(1, Math.max(0, (pin.avgDb - 40) / 80)),
      },
    })),
  };
}

/**
 * Mapbox heatmap layer configuration
 */
export const heatmapLayerConfig = {
  id: 'noise-heatmap',
  type: 'heatmap' as const,
  source: 'noise-data',
  paint: {
    // Weight by intensity
    'heatmap-weight': [
      'interpolate',
      ['linear'],
      ['get', 'intensity'],
      0, 0,
      0.5, 0.5,
      1, 1,
    ],
    // Intensity based on zoom
    'heatmap-intensity': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 1,
      15, 3,
    ],
    // Color ramp: green (safe) → yellow (caution) → red (danger)
    'heatmap-color': [
      'interpolate',
      ['linear'],
      ['heatmap-density'],
      0, 'rgba(0,0,0,0)',
      0.2, '#22C55E',
      0.4, '#4ADE80',
      0.6, '#FBBF24',
      0.8, '#F59E0B',
      1, '#EF4444',
    ],
    // Radius based on zoom
    'heatmap-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, 5,
      15, 30,
    ],
    'heatmap-opacity': 0.8,
  },
};

/**
 * Mapbox circle layer for individual pin visualization
 */
export const circleLayerConfig = {
  id: 'noise-points',
  type: 'circle' as const,
  source: 'noise-data',
  paint: {
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['zoom'],
      10, 3,
      15, 8,
    ],
    'circle-color': [
      'interpolate',
      ['linear'],
      ['get', 'avgDb'],
      0, '#22C55E',
      70, '#22C55E',
      85, '#F59E0B',
      100, '#EF4444',
      120, '#DC2626',
    ],
    'circle-opacity': 0.8,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#ffffff',
    'circle-stroke-opacity': 0.3,
  },
};
