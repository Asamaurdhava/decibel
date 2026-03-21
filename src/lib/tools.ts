// Claude tool definitions for hearing risk analysis

import { Tool } from '@anthropic-ai/sdk/resources/messages';

export const tools: Tool[] = [
  {
    name: 'analyze_hearing_risk',
    description:
      'Analyze a noise exposure session and return a structured risk assessment based on WHO safe listening guidelines. Use the provided session data to calculate risk level, hearing score, and safety metrics.',
    input_schema: {
      type: 'object' as const,
      properties: {
        risk_level: {
          type: 'string',
          enum: ['low', 'moderate', 'high', 'critical'],
          description: 'Overall risk level based on exposure duration and intensity',
        },
        hearing_score: {
          type: 'number',
          description: 'Hearing health score from 0-100 (100 = no risk, 0 = maximum risk)',
        },
        key_concern: {
          type: 'string',
          description: 'The single most important concern from this session',
        },
        daily_budget_used: {
          type: 'string',
          description: 'Percentage of daily safe noise budget consumed (e.g., "34.7%")',
        },
        safe_time_remaining_at_current_level: {
          type: 'string',
          description: 'How much more time is safe at the average session level',
        },
        cumulative_risk_factor: {
          type: 'number',
          description: 'Multiplier indicating how much faster hearing damage accumulates vs baseline (1.0 = normal)',
        },
      },
      required: [
        'risk_level',
        'hearing_score',
        'key_concern',
        'daily_budget_used',
        'safe_time_remaining_at_current_level',
        'cumulative_risk_factor',
      ],
    },
  },
];
