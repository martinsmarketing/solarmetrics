import { notFound } from 'next/navigation';
import getDb from '@/lib/db';
import { generatePageMeta } from '@/lib/metadata';
import { calculateSolarSavings, getSavingsTimeline } from '@/lib/calculator';
import LeadForm from '@/components/LeadForm';
import SavingsChart from '@/components/SavingsChart';
import type { Metadata } from 'next';

interface CityRow {
  slug: string; name: string; state_slug: string; lat: number; lng: number;
  avg_sun_hours: number; avg_electricity_rate: number; population: number; utility_name: string;
}
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
  const cities = db.prepare('SELECT slug, state_slug FROM cities').all() as { slug: string; state_slug: string }[];
  return cities.map(c => ({ state: c.state_slug, city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string }> }): Promise<Metadata> {
  const { state, city } = await params;
  const db = getDb();
  const c = db.prepare('SELECT name FROM cities WHERE slug = ?').get(city) as { name: string } | undefined;
  const s = db.prepare('SELECT name FROM states WHERE slug = ?').get(state) as { name: string } | undefined;
  if (!c || !s) return {};
  return generatePageMeta({
    title: `Solar Panel Cost in ${c.name}, ${s.name} – 2024 Prices`,
    description: `How much does solar cost in ${c.name}, ${s.name}? Get local pricing, payback estimates, utility net metering info, and free quotes.`,
    path: `/solar-cost/${state}/${city}`,
  });
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default async function CityPage({ params }: { params: Promise<{ state: string; city: string }> }) {
  const { state, city } = await params;
  const db = getDb();
  const cityRow = db.prepare('SELECT * FROM cities WHERE slug = ?').get(city) as CityRow | undefined;
  const stateRow = db.prepare('SELECT * FROM states WHERE slug = ?').get(state) as StateRow | undefined;
  if (!cityRow || !stateRow) notFound();

  // Find utility for this city
  const utility = db.prepare("SELECT * FROM utilities WHERE name = ? OR name LIKE ?").get(
    cityRow.utility_name, `%${cityRow.utility_name.split(' ')[0]}%`
  ) as UtilityRow | undefined;

  const savings = calculateSolarSavings({ monthly_bill: 150, state_slug: state });
  const timeline = getSavingsTimeline({ monthly_bill: 150, state_slug: state });

  const localBusinessSchema = {
    '@context': 'https://schema.org', '@type': 'LocalBusiness',
    name: `Solar Installation in ${cityRow.name}, ${stateRow.name}`,
    address: { '@type': 'PostalAddress', addressLocality: cityRow.name, addressRegion: stateRow.name, addressCountry: 'US' },
    geo: { '@type': 'GeoCoordinates', latitude: cityRow.lat, longitude: cityRow.lng },
    description: `Solar panel installation services in ${cityRow.name}, ${stateRow.name}. Average savings of ${fmt(savings.annual_savings)}/year.`,
  };
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: `How much does solar cost in ${cityRow.name}?`, acceptedAnswer: { '@type': 'Answer', text: `Solar in ${cityRow.name}, ${stateRow.name} costs approximately ${fmt(savings.gross_system_cost)} for a ${savings.system_size_kw} kW system. After the 30% federal tax credit, your net cost is about ${fmt(savings.net_cost)}.` } },
      { '@type': 'Question', name: `What is the solar payback period in ${cityRow.name}?`, acceptedAnswer: { '@type': 'Answer', text: `The estimated payback period for solar in ${cityRow.name} is ${savings.payback_period_years} years, based on a $150/month electric bill and local sun hours of ${cityRow.avg_sun_hours} hrs/day.` } },
      { '@type': 'Question', name: `Does ${cityRow.utility_name} offer net metering?`, acceptedAnswer: { '@type': 'Answer', text: `${cityRow.utility_name} offers ${utility?.net_metering_policy ?? stateRow.net_metering_policy} net metering. ${utility?.net_metering_compensation ?? 'Check with your utility for current compensation rates.'}.` } },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <div className="bg-gradient-to-br from-yellow-50 to-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-2 text-sm text-gray-500">
            <a href="/" className="hover:underline">Home</a> › <a href={`/solar-cost/${state}`} className="hover:underline">{stateRow.name}</a> › {cityRow.name}
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 mt-2">Solar Panel Cost in {cityRow.name}, {stateRow.name}</h1>
          <p className="mt-3 text-lg text-gray-600">Local pricing, savings, and net metering data for {cityRow.name} homeowners.</p>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Annual Savings', value: fmt(savings.annual_savings) },
              { label: 'Payback Period', value: `${savings.payback_period_years} yrs` },
              { label: 'Net Cost', value: fmt(savings.net_cost) },
              { label: '25-Year Savings', value: fmt(savings.year_25_savings) },
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
          {/* Savings breakdown */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Cost & Savings Breakdown</h2>
            <p className="text-sm text-gray-500 mb-4">Based on $150/month electric bill in {cityRow.name}</p>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                ['System Size', `${savings.system_size_kw} kW`],
                ['Annual Production', `${savings.annual_production_kwh.toLocaleString()} kWh`],
                ['Gross System Cost', fmt(savings.gross_system_cost)],
                ['Federal Tax Credit (30%)', `-${fmt(savings.federal_incentive)}`],
                ['State Incentive', savings.state_incentive > 0 ? `-${fmt(savings.state_incentive)}` : 'None'],
                ['Net Cost', fmt(savings.net_cost)],
                ['Monthly Savings', fmt(savings.monthly_savings)],
                ['CO₂ Offset/yr', `${savings.co2_offset_lbs.toLocaleString()} lbs`],
              ].map(([label, val]) => (
                <div key={label} className="bg-gray-50 rounded-lg p-3">
                  <div className="text-gray-500 text-xs">{label}</div>
                  <div className="font-bold text-gray-900 mt-0.5">{val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">25-Year Savings Projection</h2>
            <SavingsChart data={timeline} />
          </div>

          {/* Utility info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Utility & Net Metering</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">Local Utility</span><span className="font-semibold">{cityRow.utility_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Net Metering Policy</span><span className="font-semibold">{utility?.net_metering_policy ?? stateRow.net_metering_policy}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Compensation Rate</span><span className="font-semibold">{utility?.net_metering_compensation ?? 'Full retail rate'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Capacity Limit</span><span className="font-semibold">{utility?.net_metering_capacity_limit ?? 'Check with utility'}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Electricity Rate</span><span className="font-semibold">${cityRow.avg_electricity_rate.toFixed(3)}/kWh</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Peak Sun Hours</span><span className="font-semibold">{cityRow.avg_sun_hours} hrs/day</span></div>
            </div>
          </div>

          {/* Incentives */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Available Incentives</h2>
            <div className="space-y-3 text-sm">
              <div className="flex gap-3"><span className="text-green-600 font-bold">30%</span><div><strong>Federal ITC</strong> — Deduct 30% of your system cost from federal taxes. Available through 2032.</div></div>
              {stateRow.state_incentive_value > 0 && (
                <div className="flex gap-3"><span className="text-blue-600 font-bold">{fmt(stateRow.state_incentive_value)}</span><div><strong>{stateRow.name} State Incentive</strong> — {stateRow.state_incentive_description}</div></div>
              )}
            </div>
            <a href={`/solar-incentives/${state}`} className="mt-4 inline-block text-blue-600 text-sm hover:underline">View all {stateRow.name} incentives →</a>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Common Questions</h2>
            <div className="space-y-4">
              {faqSchema.mainEntity.map((q, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-5">
                  <h3 className="font-semibold text-gray-900">{q.name}</h3>
                  <p className="mt-2 text-gray-600 text-sm">{q.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <LeadForm city={cityRow.name} state={stateRow.name} />
        </div>
      </div>
    </>
  );
}
