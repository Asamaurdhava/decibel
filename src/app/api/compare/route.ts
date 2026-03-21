import { NextRequest, NextResponse } from 'next/server';
import { getNoiseComparison } from '@/lib/claude';

export async function POST(request: NextRequest) {
  try {
    const { currentDb } = await request.json();

    if (currentDb === undefined) {
      return NextResponse.json({ error: 'Missing currentDb' }, { status: 400 });
    }

    const comparison = await getNoiseComparison(currentDb);

    return NextResponse.json({ comparison });
  } catch (error) {
    console.error('Comparison error:', error);
    return NextResponse.json({ error: 'Failed to generate comparison' }, { status: 500 });
  }
}
