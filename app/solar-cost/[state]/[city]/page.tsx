import { notFound } from 'next/navigation';
import getDb from '@/lib/db';
import { generatePageMeta } from '@/lib/metadata';
import { calculateSolarSavings, getSavingsTimeline } from '@/lib/calculator';
import { distanceMiles } from '@/lib/geo';
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
  const result = await db.execute('SELECT slug, state_slug FROM cities');
  return (result.rows as unknown as { slug: string; state_slug: string }[]).map(c => ({ state: c.state_slug, city: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ state: string; city: string }> }): Promise<Metadata> {
  const { state, city } = await params;
  const db = getDb();
  const [cr, sr] = await Promise.all([
    db.execute({ sql: 'SELECT name FROM cities WHERE slug = ?', args: [city] }),
    db.execute({ sql: 'SELECT name FROM states WHERE slug = ?', args: [state] }),
  ]);
  const c = cr.rows[0] as unknown as { name: string } | undefined;
  const s = sr.rows[0] as unknown as { name: string } | undefined;
  if (!c || !s) return {};
  return generatePageMeta({
    title: `Solar Panel Cost in ${c.name}, ${s.name} – 2026 Prices`,
    description: `How much does solar cost in ${c.name}, ${s.name}? Get local pricing, payback estimates, utility net metering info, and free quotes.`,
    path: `/solar-cost/${state}/${city}`,
  });
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default async function CityPage({ params }: { params: Promise<{ state: string; city: string }> }) {
  const { state, city } = await params;
  const db = getDb();
  const [cityRes, stateRes] = await Promise.all([
    db.execute({ sql: 'SELECT * FROM cities WHERE slug = ?', args: [city] }),
    db.execute({ sql: 'SELECT * FROM states WHERE slug = ?', args: [state] }),
  ]);
  const cityRow = cityRes.rows[0] as unknown as CityRow | undefined;
  const stateRow = stateRes.rows[0] as unknown as StateRow | undefined;
  if (!cityRow || !stateRow) notFound();

  const utilityRes = await db.execute({
    sql: 'SELECT * FROM utilities WHERE name = ? OR name LIKE ? LIMIT 1',
    args: [cityRow.utility_name, `%${cityRow.utility_name.split(' ')[0]}%`],
  });
  const utility = utilityRes.rows[0] as unknown as UtilityRow | undefined;

  // Nearby cities in the same state — drives internal linking for SEO.
  const siblingsRes = await db.execute({
    sql: 'SELECT slug, name, lat, lng, population FROM cities WHERE state_slug = ? AND slug != ?',
    args: [state, city],
  });
  const nearbyCities = (siblingsRes.rows as unknown as { slug: string; name: string; lat: number; lng: number; population: number }[])
    .map(c => ({ ...c, distance: distanceMiles(cityRow.lat, cityRow.lng, c.lat, c.lng) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 6);

  const [savings, timeline] = await Promise.all([
    calculateSolarSavings({
      monthly_bill: 150,
      state_slug: state,
      rate_override: cityRow.avg_electricity_rate,
      sun_hours_override: cityRow.avg_sun_hours,
    }),
    getSavingsTimeline({
      monthly_bill: 150,
      state_slug: state,
      rate_override: cityRow.avg_electricity_rate,
      sun_hours_override: cityRow.avg_sun_hours,
    }),
  ]);

  const localBusinessSchema = {
    '@context': 'https://schema.org', '@type': 'LocalBusiness',
    name: `Solar Installation in ${cityRow.name}, ${stateRow.name}`,
    address: { '@type': 'PostalAddress', addressLocality: cityRow.name, addressRegion: stateRow.name, addressCountry: 'US' },
    geo: { '@type': 'GeoCoordinates', latitude: cityRow.lat, longitude: cityRow.lng },
    description: `Solar panel installation services in ${cityRow.name}, ${stateRow.name}. Average savings of ${fmt(savings.annual_savings)}/year.`,
  };
  const panelCount = Math.ceil((savings.system_size_kw * 1000) / 400);
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: [
      { '@type': 'Question', name: `How much does solar cost in ${cityRow.name}?`, acceptedAnswer: { '@type': 'Answer', text: `Solar in ${cityRow.name}, ${stateRow.name} costs approximately ${fmt(savings.gross_system_cost)} for a ${savings.system_size_kw} kW system. After the 30% federal tax credit, your net cost is about ${fmt(savings.net_cost)}.` } },
      { '@type': 'Question', name: `What is the solar payback period in ${cityRow.name}?`, acceptedAnswer: { '@type': 'Answer', text: `The estimated payback period for solar in ${cityRow.name} is ${savings.payback_period_years} years, based on a $150/month electric bill and local sun hours of ${cityRow.avg_sun_hours} hrs/day.` } },
      { '@type': 'Question', name: `Is solar worth it in ${cityRow.name}?`, acceptedAnswer: { '@type': 'Answer', text: `For most ${cityRow.name} homeowners, yes. With ${cityRow.avg_sun_hours} peak sun hours per day and an electricity rate of $${cityRow.avg_electricity_rate.toFixed(3)}/kWh, a typical system saves ${fmt(savings.annual_savings)} per year and around ${fmt(savings.year_25_savings)} over 25 years after paying for itself in ${savings.payback_period_years} years.` } },
      { '@type': 'Question', name: `How many solar panels do I need in ${cityRow.name}?`, acceptedAnswer: { '@type': 'Answer', text: `A typical ${cityRow.name} home needs about ${panelCount} solar panels (a ${savings.system_size_kw} kW system) to offset a $150/month electric bill, producing roughly ${savings.annual_production_kwh.toLocaleString()} kWh per year at ${cityRow.avg_sun_hours} sun hours/day.` } },
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
              { label: 'Payback Period', value: savings.payback_period_years === null ? 'Immediate' : `${savings.payback_period_years} yrs` },
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
          {/* Unique local overview — written from this city's own data */}
          <div className="prose prose-sm max-w-none text-gray-700">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Solar in {cityRow.name}: What Homeowners Should Know</h2>
            <p>
              {cityRow.name} sees an average of <strong>{cityRow.avg_sun_hours} peak sun hours per day</strong>, which is what
              ultimately determines how much electricity a rooftop system produces here. Paired with {stateRow.name}&apos;s
              local electricity rate of <strong>${cityRow.avg_electricity_rate.toFixed(3)}/kWh</strong>, a typical home
              offsetting a $150/month bill would install a <strong>{savings.system_size_kw} kW system</strong> (about{' '}
              {panelCount} panels) generating roughly {savings.annual_production_kwh.toLocaleString()} kWh each year.
            </p>
            <p>
              At those numbers, a {cityRow.name} homeowner saves about <strong>{fmt(savings.monthly_savings)}/month</strong>{' '}
              ({fmt(savings.annual_savings)}/year). After the 30% federal tax credit brings the {fmt(savings.gross_system_cost)}{' '}
              sticker price down to a net <strong>{fmt(savings.net_cost)}</strong>, the system pays for itself in{' '}
              <strong>{savings.payback_period_years} years</strong> and goes on to produce free power for two decades beyond
              that — an estimated {fmt(savings.year_25_savings)} in lifetime savings. The local grid is served by{' '}
              {cityRow.utility_name}, whose net metering policy directly affects how much credit you earn for surplus power.
            </p>
          </div>

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

          {/* Installer tips */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Choosing a Solar Installer in {cityRow.name}</h2>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex gap-3"><span className="text-yellow-500 font-bold">1.</span><span><strong>Get at least 3 quotes.</strong> Prices in {stateRow.name} vary widely between installers — comparing bids on the same {savings.system_size_kw} kW system is the fastest way to avoid overpaying.</span></li>
              <li className="flex gap-3"><span className="text-yellow-500 font-bold">2.</span><span><strong>Confirm {cityRow.utility_name} interconnection experience.</strong> An installer who regularly files with your local utility will move your permit and net-metering paperwork through faster.</span></li>
              <li className="flex gap-3"><span className="text-yellow-500 font-bold">3.</span><span><strong>Check licensing &amp; the warranty.</strong> Look for NABCEP-certified installers and a workmanship warranty of 10+ years on top of the standard 25-year panel warranty.</span></li>
              <li className="flex gap-3"><span className="text-yellow-500 font-bold">4.</span><span><strong>Size for your actual usage.</strong> With {cityRow.avg_sun_hours} sun hours/day in {cityRow.name}, make sure the proposed system matches your kWh history — not just your roof space.</span></li>
            </ul>
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

          {/* Nearby cities — internal linking */}
          {nearbyCities.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Compare Solar Costs Near {cityRow.name}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {nearbyCities.map(nc => (
                  <a
                    key={nc.slug}
                    href={`/solar-cost/${state}/${nc.slug}`}
                    className="block border border-gray-200 rounded-lg p-3 hover:border-yellow-400 hover:bg-yellow-50 transition-colors"
                  >
                    <div className="font-semibold text-gray-900 text-sm">{nc.name}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{Math.round(nc.distance)} mi away</div>
                  </a>
                ))}
              </div>
              <a href={`/solar-cost/${state}`} className="mt-4 inline-block text-blue-600 text-sm hover:underline">
                View all {stateRow.name} cities →
              </a>
            </div>
          )}
        </div>

        <div>
          <LeadForm city={cityRow.name} state={stateRow.name} />
        </div>
      </div>
    </>
  );
}
