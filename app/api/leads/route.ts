import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import getDb from '@/lib/db';
import { Resend } from 'resend';

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

    // 1. Save to DB
    const db = getDb();
    await db.execute({
      sql: `INSERT INTO leads (name, email, phone, monthly_bill, city, state) VALUES (?,?,?,?,?,?)`,
      args: [name, email, phone, monthly_bill, city, state],
    });

    // 2. Send notification email via Resend (fire-and-forget — never block the response)
    if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const notifyTo = process.env.LEAD_NOTIFY_EMAIL || 'studiomarty415@gmail.com';
      resend.emails.send({
        from: 'SolarMetrics Leads <leads@solarmetrics-nine.vercel.app>',
        to: notifyTo,
        subject: `New solar lead: ${name} in ${city || state}`,
        html: `
          <h2>New Solar Lead</h2>
          <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
            <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Name</td><td style="padding:6px 12px">${name}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Email</td><td style="padding:6px 12px"><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Phone</td><td style="padding:6px 12px">${phone || '—'}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Monthly Bill</td><td style="padding:6px 12px">$${monthly_bill}</td></tr>
            <tr><td style="padding:6px 12px;font-weight:bold;color:#555">Location</td><td style="padding:6px 12px">${city ? `${city}, ` : ''}${state}</td></tr>
          </table>
        `,
      }).catch(err => console.error('Resend error:', err));
    }

    // 3. Return EnergySage redirect URL with state-specific UTM
    const stateSlug = state.toLowerCase().replace(/\s+/g, '-');
    const redirectUrl = `https://www.energysage.com/?utm_source=solarmetrics&utm_medium=lead_form&utm_campaign=${stateSlug}`;

    return NextResponse.json({ ok: true, redirect_url: redirectUrl });
  } catch (err) {
    console.error('Lead insert error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
