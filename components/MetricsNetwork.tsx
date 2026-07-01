// The Metrics Network — sibling data-driven home-energy tools. Cross-links are
// genuinely related (solar, heat pumps, and batteries are complementary home
// upgrades), which helps both users and topical authority. Update `live` and
// URLs as new sites launch (HeatPumpMetrics currently on its Vercel subdomain
// until its custom domain is connected).
type Site = { key: string; name: string; url: string; blurb: string; live: boolean };

export const NETWORK_SITES: Site[] = [
  { key: 'solar', name: 'SolarMetrics', url: 'https://www.getsolarmetrics.com', blurb: 'Solar panel cost & savings by state', live: true },
  { key: 'heatpump', name: 'HeatPumpMetrics', url: 'https://heatpumpmetrics.vercel.app', blurb: 'Heat pump cost & savings by state', live: true },
  { key: 'battery', name: 'BatteryMetrics', url: 'https://batterymetrics.vercel.app', blurb: 'Home battery cost, backup & payback', live: true },
  { key: 'evcharger', name: 'EVChargerMetrics', url: 'https://evchargermetrics.vercel.app', blurb: 'Home EV charger cost & savings', live: true },
];

export default function MetricsNetwork({ current }: { current: string }) {
  const others = NETWORK_SITES.filter(s => s.key !== current);
  return (
    <div>
      <h4 className="text-white font-semibold mb-3">The Metrics Network</h4>
      <ul className="space-y-2 text-sm">
        {others.map(s => (
          <li key={s.key}>
            {s.live ? (
              <a href={s.url} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                {s.name} <span className="text-gray-500">— {s.blurb}</span>
              </a>
            ) : (
              <span className="text-gray-600">{s.name} <span className="text-gray-700">— coming soon</span></span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Compact inline cross-link for use within page content (contextual, not a footer dump).
export function NetworkCallout({ current }: { current: string }) {
  const others = NETWORK_SITES.filter(s => s.key !== current && s.live);
  if (others.length === 0) return null;
  return (
    <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 rounded-2xl p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-2">Planning other home-energy upgrades?</h3>
      <p className="text-sm text-gray-600 mb-4">Solar pairs well with heat pumps and battery storage. Run the numbers on the rest of your electrification plan:</p>
      <div className="flex flex-wrap gap-3">
        {others.map(s => (
          <a key={s.key} href={s.url} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200 hover:border-sky-400 rounded-lg px-4 py-2 text-sm font-semibold text-gray-800 transition-colors">
            {s.name} →
          </a>
        ))}
      </div>
    </div>
  );
}
