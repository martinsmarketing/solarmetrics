import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import getDb from '@/lib/db';

const LeadSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(30).optional().default(''),
  monthly_bill: z.number().min(1).max(100000),
  city: z.string().max(200).optional().default(''),
  state: z.string().max(100).optional().default(''),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = LeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });
    }
    const { name, email, phone, monthly_bill, city, state } = parsed.data;
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO leads (name, email, phone, monthly_bill, city, state) VALUES (?,?,?,?,?,?)`,
      args: [name, email, phone, monthly_bill, city, state],
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Lead insert error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
