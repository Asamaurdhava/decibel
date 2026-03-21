// Claude API client
import Anthropic from '@anthropic-ai/sdk';
import { AnalysisInput, HearingReport, RiskAnalysis } from '@/lib/types';
import {
  SYSTEM_PROMPT,
  buildAnalysisPrompt,
  buildReportPrompt,
  buildContextualTipPrompt,
  buildNoiseComparisonPrompt,
  buildSessionSummaryPrompt,
} from '@/lib/prompts';
import { DangerZone, SessionSummary } from '@/lib/types';
import { tools } from '@/lib/tools';

const MODEL = 'claude-sonnet-4-20250514';

const client = new Anthropic();

/**
 * Safely extract JSON from Claude's text response.
 * Handles markdown code blocks and nested braces.
 */
function extractJSON<T>(text: string): T {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim();

  // Try parsing the whole cleaned text first
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall back to regex extraction
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON object found in response');
    return JSON.parse(match[0]) as T;
  }
}

/**
 * Step 1: Analyze session data using tool use
 */
export async function analyzeSession(input: AnalysisInput): Promise<RiskAnalysis> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    tools,
    messages: [{ role: 'user', content: buildAnalysisPrompt(input) }],
  });

  const toolUse = response.content.find(block => block.type === 'tool_use');
  if (toolUse && toolUse.type === 'tool_use') {
    const analysis = toolUse.input as unknown as RiskAnalysis;
    // Validate required fields
    if (!analysis.risk_level || analysis.hearing_score === undefined || !analysis.key_concern) {
      throw new Error('Incomplete risk analysis from Claude');
    }
    return analysis;
  }

  throw new Error('Claude did not return a tool use response');
}

/**
 * Step 2: Generate personalized hearing report
 */
export async function generateReport(
  input: AnalysisInput,
  analysis: RiskAnalysis
): Promise<HearingReport> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildReportPrompt(input, analysis) }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  if (textBlock && textBlock.type === 'text') {
    return extractJSON<HearingReport>(textBlock.text);
  }

  throw new Error('Claude did not return a valid report');
}

/**
 * Feature: Contextual safety tip based on current zone
 */
export async function getContextualTip(
  zone: DangerZone,
  currentDb: number,
  durationInZoneSeconds: number,
  noiseDosePercent: number
): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 100,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildContextualTipPrompt(zone, currentDb, durationInZoneSeconds, noiseDosePercent) }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  if (textBlock && textBlock.type === 'text') {
    return textBlock.text.trim();
  }
  throw new Error('No tip returned');
}

/**
 * Feature: Relatable noise comparison for current dB level
 */
export async function getNoiseComparison(currentDb: number): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 80,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildNoiseComparisonPrompt(currentDb) }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  if (textBlock && textBlock.type === 'text') {
    return textBlock.text.trim();
  }
  throw new Error('No comparison returned');
}

/**
 * Feature: Smart session summary on monitoring stop
 */
export async function getSessionSummary(
  durationMinutes: number,
  avgDb: number,
  maxDb: number,
  timeAbove85Seconds: number,
  noiseDosePercent: number
): Promise<SessionSummary> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildSessionSummaryPrompt(durationMinutes, avgDb, maxDb, timeAbove85Seconds, noiseDosePercent) }],
  });

  const textBlock = response.content.find(block => block.type === 'text');
  if (textBlock && textBlock.type === 'text') {
    return extractJSON<SessionSummary>(textBlock.text);
  }
  throw new Error('No summary returned');
}
