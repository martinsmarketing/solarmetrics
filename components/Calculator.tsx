'use client';
import { useState, useEffect, useCallback } from 'react';
import { STATE_SLUGS, STATE_DATA } from '@/lib/stateData';

interface CalcResult {
  system_size_kw: number;
  gross_system_cost: number;
  federal_incentive: number;
  state_incentive: number;
  net_cost: number;
  annual_production_kwh: number;
  annual_savings: number;
  monthly_savings: number;
  payback_period_years: number | null; // null = incentives cover the system (immediate)
  year_25_savings: number;
  co2_offset_lbs: number;
  homes_equivalent: number;
}

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
  // If incentives meet or exceed net cost, payback is immediate (null). Otherwise
  // cap at 30 years and never show a negative figure.
  const payback = (net <= 0 || annSav <= 0) ? null : Math.min(30, net / annSav);
  let y25 = -net;
  let r = s.rate;
  for (let y = 1; y <= 25; y++) { y25 += annualProd * r; r *= 1.025; }
  const co2 = annualProd * 0.92;
  return {
    system_size_kw: Math.round(kw * 10) / 10,
    gross_system_cost: Math.round(gross),
    federal_incentive: Math.round(fed),
    state_incentive: Math.round(s.incentive),
    net_cost: Math.round(Math.max(0, net)),
    annual_production_kwh: Math.round(annualProd),
    annual_savings: Math.round(annSav),
    monthly_savings: Math.round(monthlySav),
    payback_period_years: payback === null ? null : Math.round(payback * 10) / 10,
    year_25_savings: Math.round(y25),
    co2_offset_lbs: Math.round(co2),
    homes_equivalent: Math.round((co2 / 14920) * 10) / 10,
  };
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function Calculator({
  defaultState = 'texas',
  defaultBill = 150,
  onStateChange,
  onBillChange,
}: {
  defaultState?: string;
  defaultBill?: number;
  onStateChange?: (slug: string) => void;
  onBillChange?: (bill: number) => void;
}) {
  const [bill, setBill] = useState(defaultBill);
  const [stateSlug, setStateSlug] = useState(defaultState);
  const [result, setResult] = useState<CalcResult | null>(null);

  const handleBillChange = (v: number) => { setBill(v); onBillChange?.(v); };
  const handleStateChange = (s: string) => { setStateSlug(s); onStateChange?.(s); };

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
              onChange={e => handleBillChange(Number(e.target.value))}
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none text-lg font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select
            value={stateSlug}
            onChange={e => handleStateChange(e.target.value)}
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
                <div className="text-2xl font-bold text-blue-700">{result.payback_period_years === null ? 'Immediate' : `${result.payback_period_years} yrs`}</div>
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
