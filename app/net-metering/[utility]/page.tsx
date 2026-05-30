import { notFound } from 'next/navigation';
import getDb from '@/lib/db';
import { generatePageMeta } from '@/lib/metadata';
import { calculateSolarSavings } from '@/lib/calculator';
import Calculator from '@/components/Calculator';
import Link from 'next/link';
import type { Metadata } from 'next';

interface UtilityRow {
  slug: string; name: string; state_slug: string; avg_rate_per_kwh: number;
  net_metering_policy: string; net_metering_compensation: string; net_metering_capacity_limit: string;
}

export async function generateStaticParams() {
  const db = getDb();
  const utils = db.prepare('SELECT slug FROM utilities').all() as { slug: string }[];
  return utils.map(u => ({ utility: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ utility: string }> }): Promise<Metadata> {
  const { utility } = await params;
  const db = getDb();
  const u = db.prepare('SELECT name FROM utilities WHERE slug = ?').get(utility) as { name: string } | undefined;
  if (!u) return {};
  return generatePageMeta({
    title: `${u.name} Net Metering Policy – Solar Rates & Rules`,
    description: `${u.name} net metering policy details: compensation rates, capacity limits, and how solar savings are calculated for customers.`,
    path: `/net-metering/${utility}`,
  });
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default async function NetMeteringPage({ params }: { params: Promise<{ utility: string }> }) {
  const { utility } = await params;
  const db = getDb();
  const u = db.prepare('SELECT * FROM utilities WHERE slug = ?').get(utility) as UtilityRow | undefined;
  if (!u) notFound();

  const stateName = (db.prepare('SELECT name FROM states WHERE slug = ?').get(u.state_slug) as { name: string } | undefined)?.name ?? u.state_slug;
  const sample = calculateSolarSavings({ monthly_bill: 150, state_slug: u.state_slug });

  const policyImpact = {
    'Full Retail': { color: 'green', label: 'Excellent', desc: 'You are credited at the full retail rate for every kWh you export. This maximizes your solar ROI.' },
    'Avoided Cost': { color: 'orange', label: 'Limited', desc: 'You receive the utility\'s avoided cost rate (typically 3–6¢/kWh) for exported power, which is lower than retail. This extends your payback period.' },
    'Modified Net Metering': { color: 'blue', label: 'Moderate', desc: 'A modified policy that may include demand charges, different credit rates, or capacity limits. Review your utility\'s specific terms.' },
    'None': { color: 'red', label: 'No Net Metering', desc: 'This utility does not offer net metering. Solar savings come only from self-consumption.' },
  }[u.net_metering_policy] ?? { color: 'gray', label: 'Unknown', desc: 'Contact your utility for net metering details.' };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-2 text-sm text-gray-500">
        <Link href="/" className="hover:underline">Home</Link> › <Link href={`/solar-cost/${u.state_slug}`} className="hover:underline">{stateName}</Link> › Net Metering › {u.name}
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 mt-2">{u.name} Net Metering Policy</h1>
      <p className="mt-3 text-lg text-gray-600">How {u.name} compensates solar customers for excess energy in {stateName}.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Net Metering Policy', value: u.net_metering_policy },
          { label: 'Rate per kWh', value: `$${u.avg_rate_per_kwh.toFixed(3)}` },
          { label: 'Capacity Limit', value: u.net_metering_capacity_limit },
        ].map(s => (
          <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-5 text-center shadow-sm">
            <div className="text-xl font-bold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 space-y-6">
        <div className={`bg-${policyImpact.color}-50 border border-${policyImpact.color}-200 rounded-2xl p-7`}>
          <div className="flex items-center gap-3 mb-3">
            <span className={`text-sm font-bold px-3 py-1 rounded-full bg-${policyImpact.color}-100 text-${policyImpact.color}-800`}>{policyImpact.label}</span>
            <h2 className="text-xl font-bold text-gray-900">Policy Rating</h2>
          </div>
          <p className="text-gray-700">{policyImpact.desc}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-4">How Net Metering Affects Your Solar Payback</h2>
          <p className="text-gray-600 mb-4">With {u.net_metering_policy} net metering at {u.name}, here's how your solar economics look for a typical $150/month bill:</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            {[
              ['System Size', `${sample.system_size_kw} kW`],
              ['Annual Production', `${sample.annual_production_kwh.toLocaleString()} kWh`],
              ['Annual Savings', fmt(sample.annual_savings)],
              ['Payback Period', `${sample.payback_period_years} yrs`],
            ].map(([label, val]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">{label}</div>
                <div className="font-bold text-gray-900 mt-0.5">{val}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-400">Note: With avoided-cost net metering, savings may be 20–30% lower than shown since exported power is credited below retail rate.</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Understanding Net Metering</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <p><strong>What is net metering?</strong> Net metering is a billing mechanism that credits solar owners for electricity exported to the grid. When your panels produce more than you use, the excess flows to the grid and your meter runs backward.</p>
            <p><strong>Compensation:</strong> {u.net_metering_compensation}. The credit rate determines how quickly you recover your investment.</p>
            <p><strong>Capacity limit:</strong> {u.net_metering_capacity_limit}. Systems larger than the capacity limit may be subject to different rules.</p>
          </div>
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Calculator defaultState={u.state_slug} defaultBill={150} />
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-3">Get {u.name} Customer Quotes</h3>
          <p className="text-gray-600 text-sm mb-4">See what {u.name} customers pay for solar from licensed local installers. Free comparison, no obligation.</p>
          <a
            href={`https://www.energysage.com/?utm_source=solarmetrics&utm_medium=netmetering&utm_campaign=${u.slug}`}
            target="_blank" rel="noopener noreferrer"
            className="block w-full text-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl transition-colors"
          >
            Compare Solar Quotes →
          </a>
        </div>
      </div>
    </div>
  );
}
