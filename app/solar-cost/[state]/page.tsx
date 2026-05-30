import { notFound } from 'next/navigation';
import getDb from '@/lib/db';
import { generatePageMeta } from '@/lib/metadata';
import { calculateSolarSavings } from '@/lib/calculator';
import Calculator from '@/components/Calculator';
import CityTable from '@/components/CityTable';
import type { Metadata } from 'next';

interface State {
  slug: string; name: string; avg_cost_per_watt: number;
  state_incentive_description: string; state_incentive_value: number;
  net_metering_policy: string; avg_sun_hours: number;
  avg_electricity_rate: number; top_utility: string;
}
interface City {
  slug: string; name: string; state_slug: string; lat: number; lng: number;
  avg_sun_hours: number; avg_electricity_rate: number; population: number; utility_name: string;
}

export async function generateStaticParams() {
  const db = getDb();
  const result = await db.execute('SELECT slug FROM states');
  return (result.rows as unknown as { slug: string }[]).map(s => ({ state: s.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string }> }): Promise<Metadata> {
  const { state } = await params;
  const db = getDb();
  const result = await db.execute({ sql: 'SELECT name FROM states WHERE slug = ?', args: [state] });
  const s = result.rows[0] as unknown as { name: string } | undefined;
  if (!s) return {};
  return generatePageMeta({
    title: `Solar Panel Cost in ${s.name} – 2026 Prices & Savings`,
    description: `How much does solar cost in ${s.name}? See average prices, payback periods, state incentives, and savings estimates for every city.`,
    path: `/solar-cost/${state}`,
  });
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default async function StatePage({ params }: { params: Promise<{ state: string }> }) {
  const { state } = await params;
  const db = getDb();
  const stateRes = await db.execute({ sql: 'SELECT * FROM states WHERE slug = ?', args: [state] });
  const s = stateRes.rows[0] as unknown as State | undefined;
  if (!s) notFound();

  const citiesRes = await db.execute({ sql: 'SELECT * FROM cities WHERE state_slug = ? ORDER BY population DESC', args: [state] });
  const cities = citiesRes.rows as unknown as City[];
  const sample = await calculateSolarSavings({ monthly_bill: 150, state_slug: state });

  const faq = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: `How much does solar cost in ${s.name}?`, acceptedAnswer: { '@type': 'Answer', text: `The average solar installation in ${s.name} costs about ${fmt(sample.gross_system_cost)} for a ${sample.system_size_kw} kW system. After the 30% federal tax credit, your net cost is approximately ${fmt(sample.net_cost)}.` } },
      { '@type': 'Question', name: `What solar incentives are available in ${s.name}?`, acceptedAnswer: { '@type': 'Answer', text: `${s.name} offers: ${s.state_incentive_description}. Plus the 30% federal Investment Tax Credit applies to all installations.` } },
      { '@type': 'Question', name: `How long is the solar payback period in ${s.name}?`, acceptedAnswer: { '@type': 'Answer', text: `For a typical home with a $150/month electric bill, the payback period in ${s.name} is approximately ${sample.payback_period_years} years. Over 25 years, you could save ${fmt(sample.year_25_savings)}.` } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />

      <div className="bg-gradient-to-br from-yellow-50 to-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2 text-sm text-gray-500"><a href="/" className="hover:underline">Home</a> › <a href="/#states" className="hover:underline">States</a> › {s.name}</div>
          <h1 className="text-4xl font-extrabold text-gray-900 mt-2">Solar Panel Cost in {s.name}</h1>
          <p className="mt-3 text-lg text-gray-600 max-w-2xl">Average costs, savings, and incentives for solar installations across {s.name}.</p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Avg Cost/Watt', value: `$${s.avg_cost_per_watt.toFixed(2)}` },
              { label: 'Peak Sun Hours', value: `${s.avg_sun_hours} hrs/day` },
              { label: 'Electricity Rate', value: `$${s.avg_electricity_rate.toFixed(3)}/kWh` },
              { label: 'Net Metering', value: s.net_metering_policy },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 text-center shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Sample savings */}
          <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Estimated Savings for a Typical {s.name} Home</h2>
            <p className="text-sm text-gray-500 mb-4">Based on a $150/month electric bill</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {[
                { label: 'System Size', val: `${sample.system_size_kw} kW` },
                { label: 'Gross Cost', val: fmt(sample.gross_system_cost) },
                { label: 'Federal Credit', val: `-${fmt(sample.federal_incentive)}` },
                { label: 'State Incentive', val: sample.state_incentive > 0 ? `-${fmt(sample.state_incentive)}` : 'None' },
                { label: 'Net Cost', val: fmt(sample.net_cost) },
                { label: 'Annual Savings', val: fmt(sample.annual_savings) },
                { label: 'Payback Period', val: `${sample.payback_period_years} yrs` },
                { label: '25-Year Savings', val: fmt(sample.year_25_savings) },
                { label: 'CO₂ Offset/yr', val: `${sample.co2_offset_lbs.toLocaleString()} lbs` },
              ].map(item => (
                <div key={item.label} className="bg-white rounded-lg p-3 border border-green-100">
                  <div className="text-gray-500 text-xs">{item.label}</div>
                  <div className="font-bold text-gray-900 mt-0.5">{item.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Incentives */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{s.name} Solar Incentives</h2>
            <div className="space-y-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-600 font-bold text-lg">30%</span>
                  <h3 className="font-semibold text-gray-900">Federal Investment Tax Credit (ITC)</h3>
                </div>
                <p className="text-gray-600 text-sm">Deduct 30% of your total solar installation cost from your federal taxes. Available through 2032 with no dollar cap.</p>
              </div>
              {s.state_incentive_value > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-blue-600 font-bold text-lg">{fmt(s.state_incentive_value)}</span>
                    <h3 className="font-semibold text-gray-900">{s.name} State Incentive</h3>
                  </div>
                  <p className="text-gray-600 text-sm">{s.state_incentive_description}</p>
                </div>
              )}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900">Net Metering Policy: {s.net_metering_policy}</h3>
                </div>
                <p className="text-gray-600 text-sm">Top utility in {s.name}: {s.top_utility}. <a href={`/solar-incentives/${state}`} className="text-blue-600 hover:underline">View full incentives detail →</a></p>
              </div>
            </div>
          </div>

          {/* Cities table */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Solar Costs by City in {s.name}</h2>
            <CityTable cities={cities} cpw={s.avg_cost_per_watt} incentive={s.state_incentive_value} />
          </div>
        </div>

        <div className="space-y-6">
          <Calculator defaultState={state} defaultBill={150} />
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
            <h3 className="font-semibold text-gray-900 mb-2">Quick Facts: {s.name}</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>⚡ Avg rate: ${s.avg_electricity_rate.toFixed(3)}/kWh</li>
              <li>🌞 Peak sun: {s.avg_sun_hours} hrs/day</li>
              <li>🏭 Top utility: {s.top_utility}</li>
              <li>📋 Net metering: {s.net_metering_policy}</li>
            </ul>
            <a href={`/solar-incentives/${state}`} className="mt-4 inline-block text-blue-600 text-sm hover:underline">View all {s.name} incentives →</a>
          </div>
        </div>
      </div>
    </>
  );
}
