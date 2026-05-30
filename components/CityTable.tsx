'use client';
import { useState } from 'react';
import Link from 'next/link';

interface City {
  slug: string;
  name: string;
  state_slug: string;
  avg_sun_hours: number;
  avg_electricity_rate: number;
  population: number;
  utility_name: string;
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

function cityStats(city: City, cpw: number, incentive: number) {
  const kw = Math.min(20, Math.max(3, (150 / city.avg_electricity_rate) / (city.avg_sun_hours * 30)));
  const annualProd = kw * city.avg_sun_hours * 365 * 0.80;
  const gross = kw * cpw * 1000;
  const net = gross - gross * 0.30 - incentive;
  const annSav = annualProd * city.avg_electricity_rate;
  return {
    payback: Math.round((net / annSav) * 10) / 10,
    annualSavings: Math.round(annSav),
  };
}

type SortKey = 'name' | 'payback' | 'annualSavings' | 'population';

export default function CityTable({ cities, cpw, incentive }: { cities: City[]; cpw: number; incentive: number }) {
  const [sort, setSort] = useState<SortKey>('population');
  const [asc, setAsc] = useState(false);

  const withStats = cities.map(c => ({ ...c, ...cityStats(c, cpw, incentive) }));

  const sorted = [...withStats].sort((a, b) => {
    const va = a[sort];
    const vb = b[sort];
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number);
    return asc ? cmp : -cmp;
  });

  const toggle = (key: SortKey) => {
    if (sort === key) setAsc(!asc);
    else { setSort(key); setAsc(false); }
  };

  const th = (label: string, key: SortKey) => (
    <th onClick={() => toggle(key)} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-900 select-none whitespace-nowrap">
      {label} {sort === key ? (asc ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {th('City', 'name')}
            {th('Annual Savings', 'annualSavings')}
            {th('Payback (yrs)', 'payback')}
            {th('Population', 'population')}
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Utility</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {sorted.map(city => (
            <tr key={city.slug} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3">
                <Link href={`/solar-cost/${city.state_slug}/${city.slug}`} className="font-medium text-blue-600 hover:text-blue-800">
                  {city.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-green-700 font-semibold">{fmt(city.annualSavings)}</td>
              <td className="px-4 py-3 font-medium">{city.payback}</td>
              <td className="px-4 py-3 text-gray-600">{city.population.toLocaleString()}</td>
              <td className="px-4 py-3 text-gray-600 text-sm">{city.utility_name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
