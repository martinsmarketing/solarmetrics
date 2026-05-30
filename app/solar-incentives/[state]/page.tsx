import { notFound } from 'next/navigation';
import getDb from '@/lib/db';
import { generatePageMeta } from '@/lib/metadata';
import { calculateSolarSavings } from '@/lib/calculator';
import Calculator from '@/components/Calculator';
import type { Metadata } from 'next';
import Link from 'next/link';

interface StateRow {
  slug: string; name: string; avg_cost_per_watt: number; state_incentive_description: string;
  state_incentive_value: number; net_metering_policy: string; avg_sun_hours: number;
  avg_electricity_rate: number; top_utility: string;
}
interface UtilityRow {
  slug: string; name: string; avg_rate_per_kwh: number; net_metering_policy: string;
  net_metering_compensation: string; net_metering_capacity_limit: string;
}

export async function generateStaticParams() {
  const db = getDb();
  const states = db.prepare('SELECT slug FROM states').all() as { slug: string }[];
  return states.map(s => ({ state: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const db = getDb();
  const s = db.prepare('SELECT name FROM states WHERE slug = ?').get(state) as { name: string } | undefined;
  if (!s) return {};
  return generatePageMeta({
    title: `${s.name} Solar Incentives & Tax Credits 2024`,
    description: `Complete guide to solar incentives in ${s.name}: state tax credits, rebates, net metering policies, and the federal 30% ITC.`,
    path: `/solar-incentives/${state}`,
  });
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default async function IncentivesPage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const db = getDb();
  const s = db.prepare('SELECT * FROM states WHERE slug = ?').get(state) as StateRow | undefined;
  if (!s) notFound();

  const utilities = db.prepare('SELECT * FROM utilities WHERE state_slug = ?').all(state) as UtilityRow[];
  const sample = calculateSolarSavings({ monthly_bill: 150, state_slug: state });

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-2 text-sm text-gray-500">
        <Link href="/" className="hover:underline">Home</Link> › <Link href={`/solar-cost/${state}`} className="hover:underline">{s.name}</Link> › Incentives
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 mt-2">{s.name} Solar Incentives & Tax Credits</h1>
      <p className="mt-3 text-lg text-gray-600">Every solar incentive available to {s.name} homeowners in 2024.</p>

      <div className="mt-10 space-y-6">
        {/* Federal ITC */}
        <div className="bg-green-50 border border-green-200 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl font-extrabold text-green-700">30%</span>
            <h2 className="text-xl font-bold text-gray-900">Federal Investment Tax Credit (ITC)</h2>
          </div>
          <p className="text-gray-700">The Residential Clean Energy Credit lets you claim <strong>30% of your total solar installation cost</strong> as a credit against your federal income taxes. On a {fmt(sample.gross_system_cost)} system, that's a <strong>{fmt(sample.federal_incentive)} credit</strong>.</p>
          <ul className="mt-4 space-y-2 text-sm text-gray-600">
            <li>✅ No dollar cap — applies to full system cost including installation</li>
            <li>✅ Available through December 31, 2032</li>
            <li>✅ Unused credit can carry forward to future tax years</li>
            <li>✅ Applies to batteries added at the same time as solar</li>
          </ul>
        </div>

        {/* State incentive */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-7">
          <div className="flex items-center gap-3 mb-3">
            {s.state_incentive_value > 0
              ? <span className="text-3xl font-extrabold text-blue-700">{fmt(s.state_incentive_value)}</span>
              : <span className="text-lg font-bold text-gray-500">No State Credit</span>}
            <h2 className="text-xl font-bold text-gray-900">{s.name} State Incentive</h2>
          </div>
          <p className="text-gray-700">{s.state_incentive_description}</p>
          {s.state_incentive_value === 0 && (
            <p className="mt-3 text-sm text-gray-600">While {s.name} does not offer a statewide solar tax credit, many utilities offer their own rebate programs. Check with your local utility for current offers.</p>
          )}
        </div>

        {/* Net metering */}
        <div className="bg-white border border-gray-200 rounded-2xl p-7">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Net Metering in {s.name}</h2>
          <p className="text-gray-700">{s.name} has <strong>{s.net_metering_policy}</strong> net metering. Your top utility, {s.top_utility}, credits you for excess solar power fed to the grid.</p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {[
              { label: 'Policy Type', val: s.net_metering_policy },
              { label: 'Electricity Rate', val: `$${s.avg_electricity_rate.toFixed(3)}/kWh` },
              { label: 'Top Utility', val: s.top_utility },
            ].map(item => (
              <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                <div className="text-gray-500 text-xs">{item.label}</div>
                <div className="font-semibold text-gray-900 mt-0.5">{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Utilities table */}
        {utilities.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-7">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Utility Net Metering Policies in {s.name}</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 text-left text-gray-500 font-semibold">Utility</th>
                    <th className="px-4 py-2 text-left text-gray-500 font-semibold">Rate/kWh</th>
                    <th className="px-4 py-2 text-left text-gray-500 font-semibold">Net Metering</th>
                    <th className="px-4 py-2 text-left text-gray-500 font-semibold">Capacity Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {utilities.map(u => (
                    <tr key={u.slug} className="hover:bg-gray-50">
                      <td className="px-4 py-3"><Link href={`/net-metering/${u.slug}`} className="text-blue-600 hover:underline">{u.name}</Link></td>
                      <td className="px-4 py-3">${u.avg_rate_per_kwh.toFixed(3)}</td>
                      <td className="px-4 py-3">{u.net_metering_policy}</td>
                      <td className="px-4 py-3 text-gray-600">{u.net_metering_capacity_limit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-10">
        <Calculator defaultState={state} defaultBill={150} />
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <h3 className="font-bold text-gray-900 text-lg mb-3">Ready to Go Solar in {s.name}?</h3>
          <p className="text-gray-600 text-sm mb-4">Get free quotes from licensed installers in your area. Compare prices and choose the best deal.</p>
          <a
            href={`https://www.energysage.com/?utm_source=solarmetrics&utm_medium=incentives&utm_campaign=${state}`}
            target="_blank" rel="noopener noreferrer"
            className="block w-full text-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-3 rounded-xl transition-colors"
          >
            Get Free Quotes in {s.name} →
          </a>
        </div>
      </div>
    </div>
  );
}
