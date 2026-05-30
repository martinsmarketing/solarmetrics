'use client';
import { useState, useEffect, useCallback } from 'react';

interface CalcResult {
  system_size_kw: number;
  gross_system_cost: number;
  federal_incentive: number;
  state_incentive: number;
  net_cost: number;
  annual_production_kwh: number;
  annual_savings: number;
  monthly_savings: number;
  payback_period_years: number;
  year_25_savings: number;
  co2_offset_lbs: number;
  homes_equivalent: number;
}

const STATE_SLUGS: Record<string, string> = {
  'Alabama': 'alabama', 'Alaska': 'alaska', 'Arizona': 'arizona', 'Arkansas': 'arkansas',
  'California': 'california', 'Colorado': 'colorado', 'Connecticut': 'connecticut',
  'Delaware': 'delaware', 'Florida': 'florida', 'Georgia': 'georgia', 'Hawaii': 'hawaii',
  'Idaho': 'idaho', 'Illinois': 'illinois', 'Indiana': 'indiana', 'Iowa': 'iowa',
  'Kansas': 'kansas', 'Kentucky': 'kentucky', 'Louisiana': 'louisiana', 'Maine': 'maine',
  'Maryland': 'maryland', 'Massachusetts': 'massachusetts', 'Michigan': 'michigan',
  'Minnesota': 'minnesota', 'Mississippi': 'mississippi', 'Missouri': 'missouri',
  'Montana': 'montana', 'Nebraska': 'nebraska', 'Nevada': 'nevada',
  'New Hampshire': 'new-hampshire', 'New Jersey': 'new-jersey', 'New Mexico': 'new-mexico',
  'New York': 'new-york', 'North Carolina': 'north-carolina', 'North Dakota': 'north-dakota',
  'Ohio': 'ohio', 'Oklahoma': 'oklahoma', 'Oregon': 'oregon', 'Pennsylvania': 'pennsylvania',
  'Rhode Island': 'rhode-island', 'South Carolina': 'south-carolina',
  'South Dakota': 'south-dakota', 'Tennessee': 'tennessee', 'Texas': 'texas',
  'Utah': 'utah', 'Vermont': 'vermont', 'Virginia': 'virginia', 'Washington': 'washington',
  'West Virginia': 'west-virginia', 'Wisconsin': 'wisconsin', 'Wyoming': 'wyoming',
};

// Client-side calculation (mirrors server logic with fallback rates)
const STATE_DATA: Record<string, { rate: number; sun: number; cpw: number; incentive: number }> = {
  'alabama': { rate: 0.132, sun: 4.9, cpw: 2.95, incentive: 0 },
  'alaska': { rate: 0.224, sun: 3.5, cpw: 3.80, incentive: 500 },
  'arizona': { rate: 0.128, sun: 6.5, cpw: 2.70, incentive: 1000 },
  'arkansas': { rate: 0.102, sun: 4.8, cpw: 2.85, incentive: 0 },
  'california': { rate: 0.220, sun: 5.8, cpw: 3.20, incentive: 2000 },
  'colorado': { rate: 0.135, sun: 5.5, cpw: 2.95, incentive: 500 },
  'connecticut': { rate: 0.235, sun: 4.2, cpw: 3.60, incentive: 1500 },
  'delaware': { rate: 0.138, sun: 4.4, cpw: 3.10, incentive: 1000 },
  'florida': { rate: 0.128, sun: 5.5, cpw: 2.80, incentive: 1000 },
  'georgia': { rate: 0.118, sun: 5.0, cpw: 2.90, incentive: 500 },
  'hawaii': { rate: 0.280, sun: 5.8, cpw: 4.00, incentive: 5000 },
  'idaho': { rate: 0.102, sun: 5.0, cpw: 2.90, incentive: 2000 },
  'illinois': { rate: 0.148, sun: 4.5, cpw: 3.10, incentive: 10000 },
  'indiana': { rate: 0.138, sun: 4.5, cpw: 2.85, incentive: 1000 },
  'iowa': { rate: 0.115, sun: 4.6, cpw: 3.00, incentive: 5000 },
  'kansas': { rate: 0.118, sun: 5.0, cpw: 2.90, incentive: 500 },
  'kentucky': { rate: 0.112, sun: 4.6, cpw: 2.80, incentive: 0 },
  'louisiana': { rate: 0.090, sun: 5.0, cpw: 2.75, incentive: 12500 },
  'maine': { rate: 0.198, sun: 4.2, cpw: 3.40, incentive: 2000 },
  'maryland': { rate: 0.148, sun: 4.5, cpw: 3.10, incentive: 1000 },
  'massachusetts': { rate: 0.248, sun: 4.2, cpw: 3.50, incentive: 1000 },
  'michigan': { rate: 0.182, sun: 4.2, cpw: 3.10, incentive: 500 },
  'minnesota': { rate: 0.148, sun: 4.5, cpw: 3.10, incentive: 1500 },
  'mississippi': { rate: 0.112, sun: 5.0, cpw: 2.75, incentive: 0 },
  'missouri': { rate: 0.118, sun: 4.8, cpw: 2.90, incentive: 500 },
  'montana': { rate: 0.112, sun: 4.8, cpw: 3.10, incentive: 500 },
  'nebraska': { rate: 0.108, sun: 5.0, cpw: 2.90, incentive: 500 },
  'nevada': { rate: 0.115, sun: 6.2, cpw: 2.80, incentive: 1000 },
  'new-hampshire': { rate: 0.218, sun: 4.2, cpw: 3.40, incentive: 1500 },
  'new-jersey': { rate: 0.165, sun: 4.4, cpw: 3.20, incentive: 2000 },
  'new-mexico': { rate: 0.128, sun: 6.4, cpw: 2.75, incentive: 6000 },
  'new-york': { rate: 0.218, sun: 4.2, cpw: 3.60, incentive: 5000 },
  'north-carolina': { rate: 0.118, sun: 5.0, cpw: 2.85, incentive: 500 },
  'north-dakota': { rate: 0.098, sun: 4.6, cpw: 2.90, incentive: 3000 },
  'ohio': { rate: 0.138, sun: 4.4, cpw: 2.95, incentive: 500 },
  'oklahoma': { rate: 0.108, sun: 5.2, cpw: 2.80, incentive: 500 },
  'oregon': { rate: 0.115, sun: 4.2, cpw: 3.10, incentive: 5000 },
  'pennsylvania': { rate: 0.148, sun: 4.4, cpw: 3.10, incentive: 1000 },
  'rhode-island': { rate: 0.228, sun: 4.2, cpw: 3.50, incentive: 7500 },
  'south-carolina': { rate: 0.138, sun: 5.0, cpw: 2.85, incentive: 35000 },
  'south-dakota': { rate: 0.112, sun: 5.0, cpw: 2.90, incentive: 0 },
  'tennessee': { rate: 0.118, sun: 4.8, cpw: 2.85, incentive: 0 },
  'texas': { rate: 0.120, sun: 5.5, cpw: 2.75, incentive: 1000 },
  'utah': { rate: 0.108, sun: 6.0, cpw: 2.85, incentive: 1600 },
  'vermont': { rate: 0.198, sun: 4.0, cpw: 3.40, incentive: 1000 },
  'virginia': { rate: 0.138, sun: 4.6, cpw: 2.95, incentive: 500 },
  'washington': { rate: 0.102, sun: 4.0, cpw: 3.10, incentive: 1000 },
  'west-virginia': { rate: 0.118, sun: 4.4, cpw: 2.90, incentive: 0 },
  'wisconsin': { rate: 0.168, sun: 4.4, cpw: 3.10, incentive: 500 },
  'wyoming': { rate: 0.108, sun: 5.2, cpw: 2.90, incentive: 0 },
};

function calcResult(bill: number, stateSlug: string): CalcResult {
  const s = STATE_DATA[stateSlug] ?? { rate: 0.135, sun: 5.0, cpw: 3.00, incentive: 0 };
  const monthlyKwh = bill / s.rate;
  let kw = monthlyKwh / (s.sun * 30);
  kw = Math.min(20, Math.max(3, kw));
  const annualProd = kw * s.sun * 365 * 0.80;
  const gross = kw * s.cpw * 1000;
  const fed = gross * 0.30;
  const net = gross - fed - s.incentive;
  const annSav = annualProd * s.rate;
  const monthlySav = annSav / 12;
  const payback = net / annSav;
  let y25 = -net;
  let r = s.rate;
  for (let y = 1; y <= 25; y++) { y25 += annualProd * r; r *= 1.025; }
  const co2 = annualProd * 0.92;
  return {
    system_size_kw: Math.round(kw * 10) / 10,
    gross_system_cost: Math.round(gross),
    federal_incentive: Math.round(fed),
    state_incentive: Math.round(s.incentive),
    net_cost: Math.round(net),
    annual_production_kwh: Math.round(annualProd),
    annual_savings: Math.round(annSav),
    monthly_savings: Math.round(monthlySav),
    payback_period_years: Math.round(payback * 10) / 10,
    year_25_savings: Math.round(y25),
    co2_offset_lbs: Math.round(co2),
    homes_equivalent: Math.round((co2 / 14920) * 10) / 10,
  };
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function Calculator({ defaultState = 'texas', defaultBill = 150 }: { defaultState?: string; defaultBill?: number }) {
  const [bill, setBill] = useState(defaultBill);
  const [stateSlug, setStateSlug] = useState(defaultState);
  const [result, setResult] = useState<CalcResult | null>(null);

  const recalc = useCallback(() => {
    if (bill > 0) setResult(calcResult(bill, stateSlug));
  }, [bill, stateSlug]);

  useEffect(() => { recalc(); }, [recalc]);

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-4">
        <h2 className="text-xl font-bold text-gray-900">Solar Savings Calculator</h2>
        <p className="text-sm text-gray-800 mt-0.5">Instant estimate — no email required</p>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Electric Bill</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
            <input
              type="number"
              min={20}
              max={2000}
              value={bill}
              onChange={e => setBill(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none text-lg font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select
            value={stateSlug}
            onChange={e => setStateSlug(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
          >
            {Object.entries(STATE_SLUGS).map(([name, slug]) => (
              <option key={slug} value={slug}>{name}</option>
            ))}
          </select>
        </div>

        {result && (
          <div className="mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{fmt(result.monthly_savings)}/mo</div>
                <div className="text-xs text-green-600 mt-1">Est. Monthly Savings</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{result.payback_period_years} yrs</div>
                <div className="text-xs text-blue-600 mt-1">Payback Period</div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-600">System Size</span><span className="font-semibold">{result.system_size_kw} kW</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Gross System Cost</span><span className="font-semibold">{fmt(result.gross_system_cost)}</span></div>
              <div className="flex justify-between text-green-700"><span>Federal Tax Credit (30%)</span><span className="font-semibold">-{fmt(result.federal_incentive)}</span></div>
              {result.state_incentive > 0 && (
                <div className="flex justify-between text-green-700"><span>State Incentive</span><span className="font-semibold">-{fmt(result.state_incentive)}</span></div>
              )}
              <div className="flex justify-between border-t pt-2"><span className="text-gray-600">Net Cost After Incentives</span><span className="font-bold">{fmt(result.net_cost)}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Annual Production</span><span className="font-semibold">{result.annual_production_kwh.toLocaleString()} kWh</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Annual Savings</span><span className="font-semibold">{fmt(result.annual_savings)}</span></div>
              <div className="flex justify-between border-t pt-2 text-purple-700"><span className="font-semibold">25-Year Net Savings</span><span className="font-bold text-lg">{fmt(result.year_25_savings)}</span></div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 flex justify-between items-center">
              <span>🌱 CO₂ offset/year</span>
              <span className="font-semibold text-gray-900">{result.co2_offset_lbs.toLocaleString()} lbs ({result.homes_equivalent} homes)</span>
            </div>

            <a
              href={`https://www.energysage.com/?utm_source=solarmetrics&utm_medium=calculator&utm_campaign=quotes&utm_content=${stateSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 rounded-xl transition-colors text-lg"
            >
              Get Free Installer Quotes →
            </a>
            <p className="text-xs text-gray-400 text-center">Compare quotes from licensed local installers. Free, no obligation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
