'use client';
import { useState } from 'react';
import Calculator from './Calculator';
import SavingsChart from './SavingsChart';
import LeadForm from './LeadForm';
import { STATE_DATA } from '@/lib/stateData';

function buildTimeline(bill: number, stateSlug: string) {
  const s = STATE_DATA[stateSlug] ?? { rate: 0.135, sun: 5.0, cpw: 3.00, incentive: 0 };
  const kw = Math.min(20, Math.max(3, (bill / s.rate) / (s.sun * 30)));
  const annualProd = kw * s.sun * 365 * 0.80;
  const gross = kw * s.cpw * 1000;
  const netCost = gross - s.incentive; // federal §25D credit expired Dec 31, 2025
  let cumulative = -netCost;
  let r = s.rate;
  return Array.from({ length: 25 }, (_, i) => {
    cumulative += annualProd * r;
    r *= 1.025;
    return { year: i + 1, cumulative_savings: Math.round(cumulative) };
  });
}

export default function CalculatorWithChart() {
  const [stateSlug, setStateSlug] = useState('texas');
  const [bill, setBill] = useState(150);

  const timeline = buildTimeline(bill, stateSlug);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
      <div>
        <Calculator
          defaultState={stateSlug}
          defaultBill={bill}
          onStateChange={setStateSlug}
          onBillChange={setBill}
        />
      </div>
      <div className="space-y-8">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-1">25-Year Cumulative Savings</h2>
          <p className="text-xs text-gray-400 mb-4">Updates live as you change state or bill amount</p>
          <SavingsChart data={timeline} />
        </div>
        <LeadForm />
      </div>
    </div>
  );
}
