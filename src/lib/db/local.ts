// IndexedDB via idb — local exposure history persistence

import { openDB, IDBPDatabase } from 'idb';
import { ExposureSession, NoiseMapPin } from '@/lib/types';

const DB_NAME = 'decibel-db';
const DB_VERSION = 1;

interface DecibelDB {
  sessions: {
    key: string;
    value: ExposureSession;
    indexes: { 'by-start': number };
  };
  pins: {
    key: string;
    value: NoiseMapPin;
    indexes: { 'by-timestamp': number };
  };
}

let dbInstance: IDBPDatabase<DecibelDB> | null = null;

async function getDB(): Promise<IDBPDatabase<DecibelDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DecibelDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Sessions store
      const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
      sessionStore.createIndex('by-start', 'startTime');

      // Map pins store
      const pinStore = db.createObjectStore('pins', { keyPath: 'id' });
      pinStore.createIndex('by-timestamp', 'timestamp');
    },
  });

  return dbInstance;
}

// --- Sessions ---

export async function saveSession(session: ExposureSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function getSessions(): Promise<ExposureSession[]> {
  const db = await getDB();
  return db.getAllFromIndex('sessions', 'by-start');
}

export async function getSession(id: string): Promise<ExposureSession | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}

// --- Map Pins ---

export async function savePin(pin: NoiseMapPin): Promise<void> {
  const db = await getDB();
  await db.put('pins', pin);
}

export async function getPins(): Promise<NoiseMapPin[]> {
  const db = await getDB();
  return db.getAllFromIndex('pins', 'by-timestamp');
}

export async function clearPins(): Promise<void> {
  const db = await getDB();
  await db.clear('pins');
}
