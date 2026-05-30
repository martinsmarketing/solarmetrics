import getDb from './db';

export function calculateSolarSavings(input: {
  monthly_bill: number;
  state_slug: string;
  system_size_kw?: number;
}): {
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
} {
  const db = getDb();
  const state = db.prepare('SELECT * FROM states WHERE slug = ?').get(input.state_slug) as {
    avg_electricity_rate: number;
    avg_sun_hours: number;
    avg_cost_per_watt: number;
    state_incentive_value: number;
  } | undefined;

  const rate = state?.avg_electricity_rate ?? 0.135;
  const sunHours = state?.avg_sun_hours ?? 5.0;
  const costPerWatt = state?.avg_cost_per_watt ?? 3.00;
  const stateIncentive = state?.state_incentive_value ?? 0;

  let systemKw = input.system_size_kw;
  if (!systemKw) {
    const monthlyKwh = input.monthly_bill / rate;
    systemKw = monthlyKwh / (sunHours * 30);
  }
  systemKw = Math.min(20, Math.max(3, systemKw));

  const annualProduction = systemKw * sunHours * 365 * 0.80;
  const grossCost = systemKw * costPerWatt * 1000;
  const federalIncentive = grossCost * 0.30;
  const netCost = grossCost - federalIncentive - stateIncentive;
  const annualSavings = annualProduction * rate;
  const monthlySavings = annualSavings / 12;
  const payback = netCost / annualSavings;

  // 25-year cumulative savings with 2.5% annual rate escalation
  let year25 = 0;
  let yearlyRate = rate;
  for (let y = 1; y <= 25; y++) {
    year25 += annualProduction * yearlyRate;
    yearlyRate *= 1.025;
  }
  year25 -= netCost; // net of system cost

  const co2 = annualProduction * 0.92;
  const homes = co2 / 14920;

  return {
    system_size_kw: Math.round(systemKw * 10) / 10,
    gross_system_cost: Math.round(grossCost),
    federal_incentive: Math.round(federalIncentive),
    state_incentive: Math.round(stateIncentive),
    net_cost: Math.round(netCost),
    annual_production_kwh: Math.round(annualProduction),
    annual_savings: Math.round(annualSavings),
    monthly_savings: Math.round(monthlySavings),
    payback_period_years: Math.round(payback * 10) / 10,
    year_25_savings: Math.round(year25),
    co2_offset_lbs: Math.round(co2),
    homes_equivalent: Math.round(homes * 10) / 10,
  };
}

export function getSavingsTimeline(input: {
  monthly_bill: number;
  state_slug: string;
}): { year: number; cumulative_savings: number }[] {
  const db = getDb();
  const state = db.prepare('SELECT * FROM states WHERE slug = ?').get(input.state_slug) as {
    avg_electricity_rate: number;
    avg_sun_hours: number;
    avg_cost_per_watt: number;
    state_incentive_value: number;
  } | undefined;

  const rate = state?.avg_electricity_rate ?? 0.135;
  const sunHours = state?.avg_sun_hours ?? 5.0;
  const costPerWatt = state?.avg_cost_per_watt ?? 3.00;
  const stateIncentive = state?.state_incentive_value ?? 0;

  const monthlyKwh = input.monthly_bill / rate;
  let systemKw = monthlyKwh / (sunHours * 30);
  systemKw = Math.min(20, Math.max(3, systemKw));

  const annualProduction = systemKw * sunHours * 365 * 0.80;
  const grossCost = systemKw * costPerWatt * 1000;
  const federalIncentive = grossCost * 0.30;
  const netCost = grossCost - federalIncentive - stateIncentive;

  const timeline: { year: number; cumulative_savings: number }[] = [];
  let cumulative = -netCost;
  let yearlyRate = rate;
  for (let y = 1; y <= 25; y++) {
    cumulative += annualProduction * yearlyRate;
    yearlyRate *= 1.025;
    timeline.push({ year: y, cumulative_savings: Math.round(cumulative) });
  }
  return timeline;
}
