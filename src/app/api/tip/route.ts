import { NextRequest, NextResponse } from 'next/server';
import { getContextualTip } from '@/lib/claude';
import { DangerZone } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const { zone, currentDb, durationInZoneSeconds, noiseDosePercent } = await request.json();

    if (!zone || currentDb === undefined) {
      return NextResponse.json({ error: 'Missing zone or currentDb' }, { status: 400 });
    }

    const tip = await getContextualTip(
      zone as DangerZone,
      currentDb,
      durationInZoneSeconds || 0,
      noiseDosePercent || 0
    );

    return NextResponse.json({ tip });
  } catch (error) {
    console.error('Tip error:', error);
    return NextResponse.json({ error: 'Failed to generate tip' }, { status: 500 });
  }
}
