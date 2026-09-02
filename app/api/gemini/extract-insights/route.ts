import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// Resilient Fallback Ladder
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

const RECOVERABLE_STATUS_CODES = [404, 429, 500, 503];

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
          temperature: 0.4,
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
      console.warn(`[Gemini Insight Extraction Fallback] ${model} failed, trying next...`);
    }
  }

  throw lastError || new Error('Failed to extract reflection insights from all models in fallback ladder');
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
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const conversationHistory = Array.isArray(body.history) ? body.history : [];

    if (!content && conversationHistory.length === 0) {
      return NextResponse.json(
        { error: 'Reflection content or conversation history is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured in server environment' },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemInstruction = `You are the Reflection Intelligence Module of the Personal Gemini Journal (Reflect → Act → Grow Engine).
Your task is to analyze the user's reflection dialogue and extract meaningful, empathetic personal growth elements.
DO NOT assume decisions or make commands. Suggest nuanced observations that the user can confirm, edit, or reject.

You MUST respond strictly in valid JSON matching this exact structure:
{
  "goal": "A clear, concise statement of what matters to the user or what they want to achieve (e.g., 'Learn photography')",
  "challenge": "The underlying friction, obstacle, or emotional barrier they are experiencing (e.g., 'Feeling overwhelmed by the sheer volume of information')",
  "insight": "A supportive, psychological or practical reframe/insight (e.g., 'Starting with one tiny step can bypass the overwhelm of a massive curriculum')",
  "decision": "Any decision or intention noticed (optional string, or null)",
  "opportunity": "Any emerging chance for personal growth or self-compassion (optional string, or null)",
  "suggestedAction": {
    "actionText": "A small, flexible, achievable, and inviting action step (e.g., 'Take 3 photos this week on your phone')",
    "timeframe": "This week"
  }
}`;

    const promptText = `Please analyze the following reflection journal entry/dialogue:
User Input/Dialogue:
${conversationHistory.map((h: { role: string; content: string }) => `${h.role === 'user' ? 'User' : 'Journal Companion'}: ${h.content}`).join('\n')}
${content ? `\nLatest Reflection Note: ${content}` : ''}

Extract the Goal, Challenge, Insight, and a suggested Small/Achievable Action.`;

    const { text, modelUsed } = await generateWithFallback(ai, systemInstruction, promptText);

    let parsed = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // Fallback clean extraction if json parse had markdown tags
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return NextResponse.json({
      ...parsed,
      modelUsed,
    });
  } catch (error: unknown) {
    console.error('Insight Extraction Error:', error);
    const message = error instanceof Error ? error.message : 'Internal error analyzing reflection';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
