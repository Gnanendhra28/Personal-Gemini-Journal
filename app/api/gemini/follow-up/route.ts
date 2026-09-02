import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ActionOutcome } from '@/lib/types';

// Resilient Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

async function generateWithFallback(
  ai: GoogleGenAI,
  systemInstruction: string,
  prompt: string
): Promise<{ text: string; modelUsed: string }> {
  let lastError: unknown = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0.5,
        },
      });

      const text = response.text || '';
      if (text) {
        return { text, modelUsed: model };
      }
    } catch (err: unknown) {
      lastError = err;
      const status = (err as { status?: number; statusCode?: number })?.status ||
                     (err as { status?: number; statusCode?: number })?.statusCode;
      
      if (status === 401 || status === 403) {
        throw err;
      }
      console.warn(`[Gemini Follow-Up Fallback] ${model} failed, trying next...`);
    }
  }

  throw lastError || new Error('Failed to analyze follow-up outcome with fallback ladder');
}

export async function POST(req: NextRequest) {
  try {
    // 1. Top-Level Request Deserialization
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request payload' }, { status: 400 });
    }

    // 2. Defensive Payload Ingestion
    const actionText = typeof body.actionText === 'string' ? body.actionText.trim() : '';
    const outcome = (typeof body.outcome === 'string' ? body.outcome : 'partial') as ActionOutcome;
    const userNotes = typeof body.userNotes === 'string' ? body.userNotes.trim() : '';
    const goal = typeof body.goal === 'string' ? body.goal : 'Personal growth';
    const challenge = typeof body.challenge === 'string' ? body.challenge : '';

    if (!actionText) {
      return NextResponse.json({ error: 'Action text is required for follow-up' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in server environment' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are the Adaptive Follow-up & Growth Engine of the Personal Gemini Journal.
Your role is to understand the result of an action with deep empathy and zero judgment, extract a meaningful learning, and adapt the action so the user builds sustainable momentum.

You MUST respond strictly in valid JSON matching this schema:
{
  "outcome": "${outcome}",
  "outcomeReason": "A brief, empathetic summary of what happened or why (e.g., 'The weekend schedule became busier than anticipated')",
  "learning": "A constructive, validating insight about pacing, scheduling, or mindset (e.g., 'Rigid schedules cause friction; flexible micro-moments fit your current routine better')",
  "adaptedAction": "A newly calibrated, even more achievable or tailored next action (e.g., 'Take one photo whenever convenient during your morning walk')",
  "growthSummary": "A concise 1-sentence synthesis of progress (e.g., 'Discovered that micro-habits work better than structured blocks, establishing consistent practice.')"
}`;

    const promptText = `Action Attempted: "${actionText}"
Outcome Selected: "${outcome}"
User's Reflection/Reason: "${userNotes || 'No specific notes provided'}"
Broader Goal: "${goal}"
Associated Challenge: "${challenge || 'N/A'}"

Please synthesize the learning, recommend an adapted action step, and generate a growth summary.`;

    const { text, modelUsed } = await generateWithFallback(ai, systemInstruction, promptText);

    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return NextResponse.json({
      ...parsed,
      modelUsed,
    });
  } catch (error: unknown) {
    console.error('Follow-up Analysis Error:', error);
    const message = error instanceof Error ? error.message : 'Internal error processing follow-up';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
