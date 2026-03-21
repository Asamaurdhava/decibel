// System prompts and prompt builders for Claude analysis

import { AnalysisInput, RiskAnalysis, DangerZone } from '@/lib/types';

export const SYSTEM_PROMPT = `You are a hearing health analyst powered by WHO safe listening guidelines. Your role is to analyze noise exposure data and provide evidence-based hearing risk assessments.

Key WHO guidelines you follow:
- 85 dB for 8 hours is the maximum safe daily exposure
- Every 3 dB increase halves the safe exposure time
- 88 dB → 4 hours, 91 dB → 2 hours, 94 dB → 1 hour, 100 dB → 15 minutes, 110 dB → ~2 minutes
- Noise-induced hearing loss is cumulative and irreversible
- Young people (12-35) are particularly at risk

You provide specific, actionable recommendations — not generic advice. Base everything on the actual session data provided.

Important: You are an awareness tool, not a medical device. Always include this context in recommendations.`;

export function buildAnalysisPrompt(input: AnalysisInput): string {
  return `Analyze this noise exposure session and use the analyze_hearing_risk tool to return a structured risk assessment.

Session Data:
- Duration: ${input.session_duration_minutes} minutes
- Average dB: ${input.avg_db.toFixed(1)}
- Maximum dB: ${input.max_db.toFixed(1)}
- Minimum dB: ${input.min_db.toFixed(1)}
- Time above 85 dB: ${input.time_above_85db_minutes.toFixed(1)} minutes
- Time above 100 dB: ${input.time_above_100db_minutes.toFixed(1)} minutes
- Noise dose: ${input.noise_dose_percent.toFixed(1)}%
- Frequency profile: ${input.frequency_profile}
- Location type: ${input.location_type}
- Total readings: ${input.reading_count}

Use the analyze_hearing_risk tool to return your assessment.`;
}

export function buildReportPrompt(
  input: AnalysisInput,
  analysis: RiskAnalysis
): string {
  return `Based on this noise exposure session and risk analysis, generate a personalized hearing health report.

Session Data:
- Duration: ${input.session_duration_minutes} minutes
- Average dB: ${input.avg_db.toFixed(1)}
- Maximum dB: ${input.max_db.toFixed(1)}
- Time above 85 dB: ${input.time_above_85db_minutes.toFixed(1)} minutes
- Noise dose: ${input.noise_dose_percent.toFixed(1)}%
- Frequency profile: ${input.frequency_profile}
- Location type: ${input.location_type}

Risk Analysis:
- Risk level: ${analysis.risk_level}
- Hearing score: ${analysis.hearing_score}/100
- Key concern: ${analysis.key_concern}
- Daily budget used: ${analysis.daily_budget_used}
- Safe time remaining: ${analysis.safe_time_remaining_at_current_level}
- Cumulative risk factor: ${analysis.cumulative_risk_factor}x

Return a JSON object with exactly this structure:
{
  "summary": "2-3 sentence summary of the session and its impact",
  "risk_level": "low|moderate|high|critical",
  "hearing_score": <number 0-100>,
  "top_3_recommendations": ["specific recommendation 1", "specific recommendation 2", "specific recommendation 3"],
  "long_term_projection": "What happens if this is a typical daily exposure pattern",
  "comparison": "A relatable comparison (e.g., 'equivalent to standing 10 feet from a lawn mower for X minutes')",
  "action_items": ["immediate action 1", "immediate action 2"],
  "daily_budget_used": "X%",
  "safe_time_remaining": "formatted time string"
}

Return ONLY the JSON object, no other text.`;
}

// --- Contextual Tip ---

export function buildContextualTipPrompt(
  zone: DangerZone,
  currentDb: number,
  durationInZoneSeconds: number,
  noiseDosePercent: number
): string {
  return `The user is currently in the ${zone.toUpperCase()} zone at ${Math.round(currentDb)} dB. They have been in this zone for ${Math.round(durationInZoneSeconds)} seconds. Their daily noise dose is ${noiseDosePercent.toFixed(1)}%.

Give ONE short, specific, actionable safety tip for this exact situation. Be direct and concrete — no filler. Max 15 words.

Examples of good tips:
- "At 92 dB, you have about 1 hour of safe exposure left today."
- "This level is equivalent to a food blender. Step back 2 feet to drop 6 dB."
- "Below 70 dB — your ears are recovering. Good spot to stay."

Return ONLY the tip text, nothing else.`;
}

// --- Noise Comparison ---

export function buildNoiseComparisonPrompt(currentDb: number): string {
  return `The current measured sound level is ${Math.round(currentDb)} dB SPL.

Name ONE specific real-world sound source that matches this exact dB level. Be precise — not a range, a single specific thing.

Format: "[dB] dB — [sound source]"

Examples:
- "30 dB — Quiet whisper at 5 feet"
- "60 dB — Normal conversation"
- "75 dB — Vacuum cleaner at 3 feet"
- "85 dB — Heavy city traffic"
- "95 dB — Motorcycle at 25 feet"
- "110 dB — Front row at a rock concert"

Return ONLY the comparison line, nothing else.`;
}

// --- Session Summary ---

export function buildSessionSummaryPrompt(
  durationMinutes: number,
  avgDb: number,
  maxDb: number,
  timeAbove85Seconds: number,
  noiseDosePercent: number
): string {
  return `A noise monitoring session just ended. Here are the stats:
- Duration: ${durationMinutes.toFixed(1)} minutes
- Average: ${avgDb.toFixed(1)} dB
- Peak: ${maxDb.toFixed(1)} dB
- Time above 85 dB: ${Math.round(timeAbove85Seconds)} seconds
- Daily noise dose used: ${noiseDosePercent.toFixed(1)}%

Return a JSON object with exactly this structure:
{
  "summary": "One sentence summarizing the session's hearing impact",
  "key_stat": "The single most important number from this session, formatted for display (e.g., '34% of daily budget used')",
  "recommendation": "One specific, actionable next step (max 12 words)"
}

Return ONLY the JSON object.`;
}
