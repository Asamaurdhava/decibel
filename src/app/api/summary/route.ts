import { NextRequest, NextResponse } from 'next/server';
import { getSessionSummary } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const { durationMinutes, avgDb, maxDb, timeAbove85Seconds, noiseDosePercent } = await request.json();

    if (avgDb === undefined || durationMinutes === undefined) {
      return NextResponse.json({ error: 'Missing session data' }, { status: 400 });
    }

    const summary = await getSessionSummary(
      durationMinutes,
      avgDb,
      maxDb || 0,
      timeAbove85Seconds || 0,
      noiseDosePercent || 0
    );

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Summary error:', error);
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
  }
}
