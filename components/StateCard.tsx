import Link from 'next/link';

interface StateCardProps {
  slug: string;
  name: string;
  avg_sun_hours: number;
  avg_electricity_rate: number;
  avg_cost_per_watt: number;
  state_incentive_value: number;
  net_metering_policy: string;
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export default function StateCard({ slug, name, avg_sun_hours, avg_electricity_rate, avg_cost_per_watt, state_incentive_value, net_metering_policy }: StateCardProps) {
  // Quick estimate: 8kW system, state data. Federal §25D credit expired
  // Dec 31, 2025, so net cost no longer deducts it for purchases.
  const annualProd = 8 * avg_sun_hours * 365 * 0.80;
  const gross = 8 * avg_cost_per_watt * 1000;
  const net = gross - state_incentive_value;
  const annSav = annualProd * avg_electricity_rate;
  const payback = (net <= 0 || annSav <= 0) ? 0 : Math.min(30, Math.round((net / annSav) * 10) / 10);
  const annSavFmt = fmt(annSav);

  return (
    <Link href={`/solar-cost/${slug}`} className="group block bg-white border border-gray-200 rounded-xl p-5 hover:border-yellow-400 hover:shadow-md transition-all">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">{name}</h3>
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{avg_sun_hours} hrs/day</span>
      </div>
      <div className="mt-3 space-y-1.5 text-sm text-gray-600">
        <div className="flex justify-between">
          <span>Avg annual savings</span>
          <span className="font-semibold text-green-700">{annSavFmt}</span>
        </div>
        <div className="flex justify-between">
          <span>Payback period</span>
          <span className="font-semibold">{payback === 0 ? 'Immediate' : `${payback} yrs`}</span>
        </div>
        <div className="flex justify-between">
          <span>Net metering</span>
          <span className={`font-medium text-xs ${net_metering_policy === 'Full Retail' ? 'text-green-600' : 'text-orange-600'}`}>{net_metering_policy}</span>
        </div>
      </div>
    </Link>
  );
}
