import { NextRequest, NextResponse } from 'next/server';
import { analyzeSession, generateReport } from '@/lib/claude';
import { AnalysisInput } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const input: AnalysisInput = await request.json();

    // Validate input
    if (!input.session_duration_minutes || !input.avg_db) {
      return NextResponse.json(
        { error: 'Missing required session data' },
        { status: 400 }
      );
    }

    // Step 1: Analyze session with tool use
    const analysis = await analyzeSession(input);

    // Step 2: Generate personalized report
    const report = await generateReport(input, analysis);

    return NextResponse.json(report);
  } catch (error) {
    console.error('Analysis error:', error);
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
