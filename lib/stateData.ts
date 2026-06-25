// Single source of truth for the client-side calculator's per-state estimates.
// These mirror the seeded state averages in the DB and are used for the instant,
// no-network calculator on the homepage and /solar-calculator. City/state pages
// read live values from the DB instead.

export const STATE_SLUGS: Record<string, string> = {
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

export interface StateEstimate {
  rate: number; // $/kWh
  sun: number; // peak sun hours/day
  cpw: number; // installed cost per watt
  incentive: number; // representative upfront state incentive, $
}

export const STATE_DATA: Record<string, StateEstimate> = {
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
  // SC offers a 25% state tax credit capped at $3,500/yr — not a $35k upfront grant.
  'south-carolina': { rate: 0.138, sun: 5.0, cpw: 2.85, incentive: 3500 },
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
