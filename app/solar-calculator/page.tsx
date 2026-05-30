import Calculator from '@/components/Calculator';
import LeadForm from '@/components/LeadForm';
import SavingsChart from '@/components/SavingsChart';
import { generatePageMeta } from '@/lib/metadata';
import { getSavingsTimeline } from '@/lib/calculator';

export const metadata = generatePageMeta({
  title: 'Solar Savings Calculator – Estimate Your Solar ROI',
  description: 'Use our free solar calculator to estimate system size, costs, incentives, and 25-year savings for any US state.',
  path: '/solar-calculator',
});

export default function SolarCalculatorPage() {
  // Server-rendered default chart (Texas, $150/mo)
  const timeline = getSavingsTimeline({ monthly_bill: 150, state_slug: 'texas' });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-gray-900">Solar Savings Calculator</h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          Enter your monthly electric bill and state to see your estimated solar savings, system cost, and 25-year return.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div>
          <Calculator defaultState="texas" defaultBill={150} />
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">25-Year Cumulative Savings</h2>
            <SavingsChart data={timeline} />
            <p className="text-xs text-gray-400 mt-3 text-center">Chart shows net savings after system cost, with 2.5% annual rate escalation. Updates when you change state in calculator.</p>
          </div>
          <LeadForm />
        </div>
      </div>

      {/* Educational content */}
      <div className="mt-20 prose max-w-none">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">How Solar Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">☀️ Solar Panel Basics</h3>
            <p className="text-gray-600 text-sm">Solar panels convert sunlight into DC electricity. An inverter converts it to AC for your home. Excess power feeds back to the grid via net metering, earning you credits.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">💰 What Affects Your Payback?</h3>
            <p className="text-gray-600 text-sm">Key factors: your local electricity rate, peak sun hours, system size, installer pricing, and available incentives. States with high rates + good sun have the shortest payback periods.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">🏛️ Federal Tax Credit</h3>
            <p className="text-gray-600 text-sm">The 30% Residential Clean Energy Credit lets you deduct 30% of your total installation cost from your federal tax bill. A $20,000 system earns a $6,000 credit — guaranteed through 2032.</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">🔋 Net Metering</h3>
            <p className="text-gray-600 text-sm">Net metering credits you for surplus solar electricity fed to the grid. Full retail net metering (the best policy) credits you at the same rate you pay. Some states offer lower avoided-cost rates.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
