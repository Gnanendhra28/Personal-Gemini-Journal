import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { ReflectionMode } from '@/lib/types';

// Fallback ladder ordered by availability and latency per production directive
const MODEL_FALLBACK_LADDER = [
  'gemini-3.6-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-3.7-flash',
];

const RECOVERABLE_STATUS_CODES = [404, 429, 500, 503];

// Reusable helper for resilient Gemini API calls
async function generateContentWithFallback(
  ai: GoogleGenAI,
  systemInstruction: string,
  contents: string | Array<{ role: string; parts: Array<{ text: string }> }>
): Promise<{ text: string; modelUsed: string }> {
  let lastError: unknown = null;

  for (const model of MODEL_FALLBACK_LADDER) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
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
      
      const isRecoverable = status && RECOVERABLE_STATUS_CODES.includes(status);
      console.warn(`[Gemini Fallback] Model ${model} failed with status ${status || 'unknown'}. Trying next model if available...`, err);

      // If it's a critical auth/credential configuration failure, do not futilely retry
      if (status === 401 || status === 403) {
        throw err;
      }

      // Continue to next model in fallback ladder
    }
  }

  throw lastError || new Error('All models in the fallback ladder failed to generate content');
}

export async function POST(req: NextRequest) {
  try {
    // 1. Top-Level Request Deserialization (Ordering Guarantee)
    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid or missing JSON payload in request' },
        { status: 400 }
      );
    }

    // 2. Defensive Payload Ingestion (Null-Safe Destructuring)
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    const mode = (typeof body.mode === 'string' ? body.mode : 'reflection') as ReflectionMode;
    const history = Array.isArray(body.history) ? body.history : [];
    const title = typeof body.title === 'string' ? body.title : 'Journal Reflection';
    const mood = typeof body.mood === 'string' ? body.mood : 'thoughtful';

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt content is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'GEMINI_API_KEY is not configured in server environment. Please set it in Settings/Secrets.',
        },
        { status: 500 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    // Mode-specific system instructions
    let systemInstruction = `You are a supportive, insightful, and empathetic AI reflection companion and journaling mentor.
Your role is to help the user process their thoughts, discover patterns, gain clarity, and foster emotional intelligence and personal growth.
Current reflection mood context: ${mood}.
Tone: Calm, articulate, constructive, respectful, and engaging.
Formatting: Use clean Markdown with headers, bullet points, and emphasis where appropriate. Avoid robotic boilerplate.`;

    if (mode === 'summary') {
      systemInstruction += `\nTask: Provide a structured, insightful summary of the user's reflection.
Include:
- **Core Themes**: 2-3 key thoughts or patterns expressed.
- **Emotional Nuances**: Noticed feelings, tensions, or shifts.
- **Key Takeaways & Actionable Insights**: 2-3 gentle next steps or affirmations.`;
    } else if (mode === 'brainstorm') {
      systemInstruction += `\nTask: Brainstorm creative solutions, fresh perspectives, and constructive thought experiments based on the user's input.
Offer 4-6 diverse angles, 'what if' questions, and practical mini-experiments.`;
    } else if (mode === 'reflection') {
      systemInstruction += `\nTask: Provide deep, compassionate reflection. Validate their experience, gently challenge assumptions with thoughtful questions, and highlight strengths.`;
    } else if (mode === 'chat') {
      systemInstruction += `\nTask: Engage in an organic, multi-turn conversational dialogue. Keep responses focused and ask 1 open-ended follow-up question to help them go deeper.`;
    }

    // Build multi-turn contents if history is provided
    let contentsPayload: string | Array<{ role: string; parts: Array<{ text: string }> }>;

    if (history.length > 0) {
      const formattedHistory = history.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content || '' }],
      }));

      // Add the current prompt
      formattedHistory.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      contentsPayload = formattedHistory;
    } else {
      contentsPayload = prompt;
    }

    const { text, modelUsed } = await generateContentWithFallback(
      ai,
      systemInstruction,
      contentsPayload
    );

    return NextResponse.json({
      text,
      modelUsed,
      mode,
    });
  } catch (error: unknown) {
    console.error('Gemini Reflection API Route Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error while communicating with Gemini API';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
