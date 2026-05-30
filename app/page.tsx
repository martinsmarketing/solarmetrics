import Calculator from '@/components/Calculator';
import StateCard from '@/components/StateCard';
import getDb from '@/lib/db';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SolarMetrics – Solar Cost & Savings Calculator for All 50 States',
  description: 'Calculate your solar savings, compare costs by state, and get free quotes from licensed installers. Real data for all 50 states.',
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    { '@type': 'Question', name: 'How much does solar cost in 2026?', acceptedAnswer: { '@type': 'Answer', text: 'The average solar installation costs between $15,000 and $30,000 before incentives. After the 30% federal tax credit, most homeowners pay $10,000–$21,000. Costs vary by state, system size, and installer.' } },
    { '@type': 'Question', name: 'What is the federal solar tax credit?', acceptedAnswer: { '@type': 'Answer', text: 'The Residential Clean Energy Credit lets you deduct 30% of your solar installation cost from your federal taxes. On a $20,000 system, that\'s a $6,000 tax credit. It applies through 2032.' } },
    { '@type': 'Question', name: 'How long does it take for solar to pay for itself?', acceptedAnswer: { '@type': 'Answer', text: 'The average solar payback period in the US is 7–12 years. Sunny states with high electricity rates like Hawaii, Massachusetts, and California often see payback in 5–8 years.' } },
    { '@type': 'Question', name: 'What is net metering and why does it matter?', acceptedAnswer: { '@type': 'Answer', text: 'Net metering lets you sell excess solar power back to the grid, receiving credits on your bill. Full retail net metering gives you the most value. Some states offer avoided-cost rates instead, which are lower.' } },
    { '@type': 'Question', name: 'How big of a solar system do I need?', acceptedAnswer: { '@type': 'Answer', text: 'Divide your monthly kWh usage by your peak sun hours × 30 days to get the system size in kW. Most homes use 8–12 kW systems. Our calculator estimates this automatically from your electric bill.' } },
  ],
};

export default async function HomePage() {
  const db = getDb();
  const result = await db.execute('SELECT * FROM states ORDER BY name');
  const states = result.rows as unknown as {
    slug: string; name: string; avg_sun_hours: number; avg_electricity_rate: number;
    avg_cost_per_watt: number; state_incentive_value: number; net_metering_policy: string;
  }[];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* Hero */}
      <section className="bg-gradient-to-br from-yellow-50 via-orange-50 to-white py-20 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              ☀️ Free solar data for all 50 states
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight">
              How Much Can <span className="text-yellow-500">Solar Save You</span> This Year?
            </h1>
            <p className="mt-5 text-xl text-gray-600">
              Get an instant estimate of your solar savings based on real data from your state — no email required.
            </p>
            <div className="mt-8 flex flex-wrap gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">✅ 500+ licensed installers</span>
              <span className="flex items-center gap-1.5">✅ Avg. $1,400/yr savings</span>
              <span className="flex items-center gap-1.5">✅ 30% federal tax credit</span>
            </div>
          </div>
          <div>
            <Calculator defaultState="texas" defaultBill={150} />
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { n: '500+', label: 'Licensed Installers' },
            { n: '50', label: 'States Covered' },
            { n: '$1,400', label: 'Avg Annual Savings' },
            { n: '7.5 yrs', label: 'Avg Payback Period' },
          ].map(stat => (
            <div key={stat.label}>
              <div className="text-3xl font-extrabold text-yellow-400">{stat.n}</div>
              <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* States grid */}
      <section id="states" className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Solar Costs by State</h2>
        <p className="text-gray-500 mb-8">Click any state to see detailed costs, city-by-city data, and local incentives.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {states.map(s => <StateCard key={s.slug} {...s} />)}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '1', icon: '🔢', title: 'Enter Your Bill', desc: 'Tell us your monthly electric bill and state. We calculate your ideal system size.' },
              { step: '2', icon: '📊', title: 'See Your Savings', desc: 'Get an instant breakdown of costs, incentives, payback period, and 25-year savings.' },
              { step: '3', icon: '☀️', title: 'Get Free Quotes', desc: 'Connect with licensed local installers and compare quotes at no cost or obligation.' },
            ].map(s => (
              <div key={s.step} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <div className="text-4xl mb-4">{s.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Step {s.step}: {s.title}</h3>
                <p className="text-gray-600 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqSchema.mainEntity.map((q, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-6">
              <h3 className="font-semibold text-gray-900 text-lg">{q.name}</h3>
              <p className="mt-2 text-gray-600">{q.acceptedAnswer.text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
