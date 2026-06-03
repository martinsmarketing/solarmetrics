import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const PROMPTS: Record<string, (topic: string) => string> = {
  monday: (topic) =>
    `Write a short, friendly Monday outreach email for a solar company targeting the "${topic}" niche.
Keep it under 120 words. No subject line. Start with the body text directly.`,

  followup: (topic) =>
    `Write a brief follow-up email (2–3 sentences) for a solar company to send to a "${topic}" prospect
who hasn't replied to the first outreach. Friendly, not pushy.`,

  linkedin: (topic) =>
    `Write a LinkedIn connection request message (under 300 characters) for a solar company
reaching out to someone in the "${topic}" niche.`,

  cold_call: (topic) =>
    `Write a short cold-call script opening (30 seconds max) for a solar company calling a
"${topic}" business owner. Natural, conversational tone.`,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, topic } = body as { type: string; topic: string };

    if (!type || !topic) {
      return NextResponse.json({ error: 'Missing type or topic' }, { status: 400 });
    }

    const promptFn = PROMPTS[type];
    if (!promptFn) {
      return NextResponse.json({ error: `Unknown draft type: ${type}` }, { status: 400 });
    }

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 512,
      messages: [{ role: 'user', content: promptFn(topic) }],
    });

    const result =
      message.content[0].type === 'text' ? message.content[0].text : '';

    return NextResponse.json({ result });
  } catch (err) {
    console.error('Draft API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
