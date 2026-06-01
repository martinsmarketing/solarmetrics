import getDb from './db';

interface StateRow {
  avg_electricity_rate: number;
  avg_sun_hours: number;
  avg_cost_per_watt: number;
  state_incentive_value: number;
}

function compute(
  bill: number,
  rate: number,
  sunHours: number,
  costPerWatt: number,
  stateIncentive: number,
  systemKwOverride?: number
) {
  let systemKw = systemKwOverride ?? (bill / rate) / (sunHours * 30);
  systemKw = Math.min(20, Math.max(3, systemKw));

  const annualProduction = systemKw * sunHours * 365 * 0.80;
  const grossCost = systemKw * costPerWatt * 1000;
  const federalIncentive = grossCost * 0.30;
  const netCost = grossCost - federalIncentive - stateIncentive;
  const annualSavings = annualProduction * rate;
  const monthlySavings = annualSavings / 12;
  const paybackRaw = (netCost <= 0 || annualSavings <= 0) ? null : netCost / annualSavings;
  const payback = paybackRaw === null ? null : Math.min(30, Math.abs(paybackRaw));

  let year25 = -netCost;
  let yearlyRate = rate;
  for (let y = 1; y <= 25; y++) {
    year25 += annualProduction * yearlyRate;
    yearlyRate *= 1.025;
  }

  const co2 = annualProduction * 0.92;

  return {
    system_size_kw: Math.round(systemKw * 10) / 10,
    gross_system_cost: Math.round(grossCost),
    federal_incentive: Math.round(federalIncentive),
    state_incentive: Math.round(stateIncentive),
    net_cost: Math.round(netCost),
    annual_production_kwh: Math.round(annualProduction),
    annual_savings: Math.round(annualSavings),
    monthly_savings: Math.round(monthlySavings),
    payback_period_years: payback === null ? null : Math.round(payback * 10) / 10,
    year_25_savings: Math.round(year25),
    co2_offset_lbs: Math.round(co2),
    homes_equivalent: Math.round((co2 / 14920) * 10) / 10,
  };
}

export async function calculateSolarSavings(input: {
  monthly_bill: number;
  state_slug: string;
  system_size_kw?: number;
  rate_override?: number;
  sun_hours_override?: number;
}) {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT avg_electricity_rate, avg_sun_hours, avg_cost_per_watt, state_incentive_value FROM states WHERE slug = ?',
    args: [input.state_slug],
  });

  const row = result.rows[0] as unknown as StateRow | undefined;
  const rate = input.rate_override ?? Number(row?.avg_electricity_rate ?? 0.135);
  const sunHours = input.sun_hours_override ?? Number(row?.avg_sun_hours ?? 5.0);
  const costPerWatt = Number(row?.avg_cost_per_watt ?? 3.00);
  const stateIncentive = Number(row?.state_incentive_value ?? 0);

  return compute(input.monthly_bill, rate, sunHours, costPerWatt, stateIncentive, input.system_size_kw);
}

export async function getSavingsTimeline(input: {
  monthly_bill: number;
  state_slug: string;
  rate_override?: number;
  sun_hours_override?: number;
}) {
  const db = getDb();
  const result = await db.execute({
    sql: 'SELECT avg_electricity_rate, avg_sun_hours, avg_cost_per_watt, state_incentive_value FROM states WHERE slug = ?',
    args: [input.state_slug],
  });

  const row = result.rows[0] as unknown as StateRow | undefined;
  const rate = input.rate_override ?? Number(row?.avg_electricity_rate ?? 0.135);
  const sunHours = input.sun_hours_override ?? Number(row?.avg_sun_hours ?? 5.0);
  const costPerWatt = Number(row?.avg_cost_per_watt ?? 3.00);
  const stateIncentive = Number(row?.state_incentive_value ?? 0);

  const kw = Math.min(20, Math.max(3, (input.monthly_bill / rate) / (sunHours * 30)));
  const annualProd = kw * sunHours * 365 * 0.80;
  const gross = kw * costPerWatt * 1000;
  const netCost = gross - gross * 0.30 - stateIncentive;

  let cumulative = -netCost;
  let r = rate;
  return Array.from({ length: 25 }, (_, i) => {
    cumulative += annualProd * r;
    r *= 1.025;
    return { year: i + 1, cumulative_savings: Math.round(cumulative) };
  });
}
