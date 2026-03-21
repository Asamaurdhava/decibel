import { createClient } from '@supabase/supabase-js';
import { NoiseMapPin, ExposureSession } from '@/lib/types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- Noise Pins ---

export async function savePinToCloud(pin: NoiseMapPin): Promise<void> {
  const { error } = await supabase.from('noise_pins').insert({
    id: pin.id,
    lat: pin.lat,
    lng: pin.lng,
    avg_db: pin.avgDb,
    peak_db: pin.peakDb,
    zone: pin.zone,
  });
  if (error) throw error;
}

export async function getCloudPins(): Promise<NoiseMapPin[]> {
  const { data, error } = await supabase
    .from('noise_pins')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    lat: row.lat,
    lng: row.lng,
    avgDb: row.avg_db,
    peakDb: row.peak_db,
    zone: row.zone,
    timestamp: new Date(row.created_at).getTime(),
  }));
}

// --- Sessions ---

export async function saveSessionToCloud(session: ExposureSession): Promise<void> {
  const { error } = await supabase.from('sessions').insert({
    id: session.id,
    start_time: session.startTime,
    end_time: session.endTime,
    avg_db: session.avgDb,
    max_db: session.maxDb,
    min_db: session.minDb || 0,
    time_above_85: session.timeAbove85,
    time_above_100: session.timeAbove100,
    noise_dose_percent: session.noiseDosePercent,
    lat: session.location?.lat || null,
    lng: session.location?.lng || null,
  });
  if (error) throw error;
}

export async function deleteSessionFromCloud(id: string): Promise<void> {
  const { error } = await supabase.from('sessions').delete().eq('id', id);
  if (error) throw error;
}

export async function getCloudSessions(): Promise<ExposureSession[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('start_time', { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    readings: [],
    avgDb: row.avg_db,
    maxDb: row.max_db,
    minDb: row.min_db,
    timeAbove85: row.time_above_85,
    timeAbove100: row.time_above_100,
    noiseDosePercent: row.noise_dose_percent,
    location: row.lat && row.lng ? { lat: row.lat, lng: row.lng } : undefined,
  }));
}
