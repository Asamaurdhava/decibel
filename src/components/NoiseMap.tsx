'use client';

import { useRef, useEffect, useState } from 'react';
import { useDecibelStore } from '@/lib/store/decibel-store';
import { pinsToGeoJSON, heatmapLayerConfig, circleLayerConfig } from '@/lib/map/heatmap';
import { NoiseMapPin, getZone, getZoneColor } from '@/lib/types';
import { getCloudPins } from '@/lib/db/supabase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export default function NoiseMap() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapPins = useDecibelStore((s) => s.mapPins);
  const pastSessions = useDecibelStore((s) => s.pastSessions);
  const userLocation = useDecibelStore((s) => s.userLocation);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedPin, setSelectedPin] = useState<NoiseMapPin | null>(null);
  const [buttonLabel, setButtonLabel] = useState({ db: 0, active: false });
  const [filterSessionId, setFilterSessionId] = useState<string>('all');
  const [filterOpen, setFilterOpen] = useState(false);

  // Build session options from pins that have sessionIds
  const sessionOptions = (() => {
    const sessionIds = new Set(mapPins.filter(p => p.sessionId).map(p => p.sessionId!));
    const options: { id: string; label: string; count: number }[] = [];
    sessionIds.forEach(sid => {
      const session = pastSessions.find(s => s.id === sid);
      const count = mapPins.filter(p => p.sessionId === sid).length;
      options.push({
        id: sid,
        label: session?.name || new Date(session?.startTime || 0).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        count,
      });
    });
    const unlinkedCount = mapPins.filter(p => !p.sessionId).length;
    if (unlinkedCount > 0) {
      options.push({ id: 'unlinked', label: 'Unlinked', count: unlinkedCount });
    }
    return options;
  })();

  // Filter pins based on selected session
  const filteredPins = filterSessionId === 'all'
    ? mapPins
    : filterSessionId === 'unlinked'
      ? mapPins.filter(p => !p.sessionId)
      : mapPins.filter(p => p.sessionId === filterSessionId);

  // Poll store at 1Hz for button label — avoids 60fps re-renders
  useEffect(() => {
    const interval = setInterval(() => {
      const { currentDb, isMonitoring } = useDecibelStore.getState();
      setButtonLabel({ db: Math.round(currentDb), active: isMonitoring });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load community pins from Supabase on mount
  useEffect(() => {
    getCloudPins()
      .then((pins) => useDecibelStore.getState().loadCloudPins(pins))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => useDecibelStore.getState().setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => useDecibelStore.getState().setUserLocation({ lat: 33.4242, lng: -111.9281 }),
      { enableHighAccuracy: true }
    );
  }, []);

  const initialLocationRef = useRef(userLocation);
  if (!initialLocationRef.current && userLocation) {
    initialLocationRef.current = userLocation;
  }

  useEffect(() => {
    const loc = initialLocationRef.current;
    if (!MAPBOX_TOKEN || !mapContainerRef.current || !loc) return;
    if (mapRef.current) return;

    const initMap = async () => {
      const mapboxgl = (await import('mapbox-gl')).default;

      mapboxgl.accessToken = MAPBOX_TOKEN;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/dark-v11',
        center: [loc.lng, loc.lat],
        zoom: 15,
        attributionControl: false,
      });

      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserLocation: true,
      });
      map.addControl(geolocate, 'top-right');

      geolocate.on('geolocate', (e: GeolocationPosition) => {
        useDecibelStore.getState().setUserLocation({
          lat: e.coords.latitude,
          lng: e.coords.longitude,
        });
      });

      map.on('load', () => {
        map.resize();
        geolocate.trigger();

        map.addSource('noise-data', { type: 'geojson', data: pinsToGeoJSON(filteredPins) });
        map.addLayer(heatmapLayerConfig as mapboxgl.AnyLayer);
        map.addLayer({ ...circleLayerConfig, minzoom: 14 } as mapboxgl.AnyLayer);

        map.on('click', 'noise-points', (e) => {
          if (e.features && e.features[0]) {
            const props = e.features[0].properties;
            const geometry = e.features[0].geometry as GeoJSON.Point;
            if (props && geometry) {
              setSelectedPin({
                id: '',
                lat: geometry.coordinates[1],
                lng: geometry.coordinates[0],
                avgDb: props.avgDb,
                peakDb: props.peakDb,
                zone: props.zone,
                timestamp: props.timestamp,
                sessionId: props.sessionId || undefined,
              });
            }
          }
        });
        map.on('mouseenter', 'noise-points', () => { map.getCanvas().style.cursor = 'pointer'; });
        map.on('mouseleave', 'noise-points', () => { map.getCanvas().style.cursor = ''; });
        setMapLoaded(true);
      });

      mapRef.current = map;
    };

    initMap();
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLocationRef.current]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const source = mapRef.current.getSource('noise-data') as mapboxgl.GeoJSONSource;
    if (source) source.setData(pinsToGeoJSON(filteredPins));
  }, [filteredPins, mapLoaded]);

  const handleDropPin = () => {
    const { currentDb, isMonitoring: monitoring, userLocation: loc } = useDecibelStore.getState();
    if (!loc || !monitoring) return;
    const zone = getZone(currentDb);
    const pin: NoiseMapPin = {
      id: crypto.randomUUID(), lat: loc.lat, lng: loc.lng,
      avgDb: currentDb, peakDb: currentDb, timestamp: Date.now(), zone,
    };
    useDecibelStore.getState().addMapPin(pin);
  };

  if (!MAPBOX_TOKEN) {
    return (
      <Card className="flex flex-col items-center justify-center h-full min-h-[300px] sm:min-h-[400px]">
        <CardContent className="text-center p-6">
          <svg className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground/30 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
            <line x1="8" y1="2" x2="8" y2="18" /><line x1="16" y1="6" x2="16" y2="22" />
          </svg>
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">Map Not Configured</h3>
          <p className="text-muted-foreground text-sm max-w-sm">
            Add NEXT_PUBLIC_MAPBOX_TOKEN to your .env.local file to enable the community noise map.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[400px] md:min-h-[500px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Loading state while Mapbox initializes */}
      {!mapLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card">
          <div className="w-6 h-6 border border-primary/30 border-t-primary rounded-full animate-spin mb-3" />
          <p className="text-muted-foreground text-xs font-mono">Loading map...</p>
        </div>
      )}

      {/* Session filter — top-left */}
      {sessionOptions.length > 0 && (
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 z-10">
          <div className="relative">
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-background/90 backdrop-blur-sm border border-border text-xs font-mono text-foreground hover:border-foreground/30 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {filterSessionId === 'all' ? 'All pins' : sessionOptions.find(o => o.id === filterSessionId)?.label || 'Filter'}
            </button>
            {filterOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-background/95 backdrop-blur-sm border border-border rounded-md shadow-lg overflow-hidden">
                <button
                  onClick={() => { setFilterSessionId('all'); setFilterOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-muted/50 transition-colors flex justify-between ${filterSessionId === 'all' ? 'text-primary' : 'text-foreground'}`}
                >
                  <span>All pins</span>
                  <span className="text-muted-foreground">{mapPins.length}</span>
                </button>
                {sessionOptions.map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setFilterSessionId(opt.id); setFilterOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs font-mono hover:bg-muted/50 transition-colors flex justify-between ${filterSessionId === opt.id ? 'text-primary' : 'text-foreground'}`}
                  >
                    <span className="truncate mr-2">{opt.label}</span>
                    <span className="text-muted-foreground shrink-0">{opt.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 flex items-end justify-between gap-3 z-10">
        <Button variant="outline" size="sm" onClick={handleDropPin} disabled={!buttonLabel.active}
          className="bg-background/90 backdrop-blur-sm">
          Drop Pin ({buttonLabel.db} dB)
        </Button>
        <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm font-mono text-xs">
          {filteredPins.length}{filterSessionId !== 'all' ? `/${mapPins.length}` : ''} pin{filteredPins.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {selectedPin && (() => {
        const pinSession = selectedPin.sessionId
          ? pastSessions.find(s => s.id === selectedPin.sessionId)
          : undefined;
        return (
          <div className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-10">
            <Card className="bg-background/90 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: getZoneColor(selectedPin.zone) }}>
                    {Math.round(selectedPin.avgDb)} dB — {selectedPin.zone.toUpperCase()}
                  </p>
                  <p className="text-muted-foreground text-xs mt-0.5">
                    {pinSession?.name && <span className="text-foreground/70 mr-1.5">{pinSession.name}</span>}
                    {new Date(selectedPin.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <button onClick={() => setSelectedPin(null)} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </CardContent>
            </Card>
          </div>
        );
      })()}
    </div>
  );
}
