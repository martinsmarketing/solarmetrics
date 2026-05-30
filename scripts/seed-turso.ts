import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const [k, ...rest] = line.split('=');
    if (k && rest.length) process.env[k.trim()] = rest.join('=').trim();
  }
}

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function run() {
  // Create tables
  await client.executeMultiple(`
    CREATE TABLE IF NOT EXISTS states (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avg_cost_per_watt REAL NOT NULL,
      state_incentive_description TEXT NOT NULL,
      state_incentive_value REAL NOT NULL,
      net_metering_policy TEXT NOT NULL,
      avg_sun_hours REAL NOT NULL,
      avg_electricity_rate REAL NOT NULL,
      top_utility TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cities (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state_slug TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      avg_sun_hours REAL NOT NULL,
      avg_electricity_rate REAL NOT NULL,
      population INTEGER NOT NULL,
      utility_name TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS utilities (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      state_slug TEXT NOT NULL,
      avg_rate_per_kwh REAL NOT NULL,
      net_metering_policy TEXT NOT NULL,
      net_metering_compensation TEXT NOT NULL,
      net_metering_capacity_limit TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT,
      phone TEXT,
      monthly_bill REAL,
      city TEXT,
      state TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('Tables created');

  // Seed states
  const states = [
    ['alabama','Alabama',2.95,'Alabama does not offer a statewide solar tax credit.',0,'Avoided Cost',4.9,0.132,'Alabama Power'],
    ['alaska','Alaska',3.80,'Alaska provides a rebate of up to $500 for solar installations.',500,'Modified Net Metering',3.5,0.224,'Chugach Electric'],
    ['arizona','Arizona',2.70,'Arizona offers a 25% state tax credit up to $1,000.',1000,'Full Retail',6.5,0.128,'Arizona Public Service'],
    ['arkansas','Arkansas',2.85,'Arkansas has no statewide solar incentive.',0,'Avoided Cost',4.8,0.102,'Entergy Arkansas'],
    ['california','California',3.20,'California offers property tax exclusion for solar installations.',2000,'Modified Net Metering',5.8,0.220,'Pacific Gas & Electric'],
    ['colorado','Colorado',2.95,'Colorado offers sales tax exemption on solar equipment.',500,'Full Retail',5.5,0.135,'Xcel Energy'],
    ['connecticut','Connecticut',3.60,'Connecticut offers a Residential Solar Investment Program rebate.',1500,'Full Retail',4.2,0.235,'Eversource CT'],
    ['delaware','Delaware',3.10,'Delaware offers a Solar Renewable Energy Credit (SREC) program.',1000,'Full Retail',4.4,0.138,'Delmarva Power'],
    ['florida','Florida',2.80,'Florida exempts solar equipment from sales and property tax.',1000,'Full Retail',5.5,0.128,'Florida Power & Light'],
    ['georgia','Georgia',2.90,'Georgia has no statewide solar tax credit but offers property tax exemption.',500,'Avoided Cost',5.0,0.118,'Georgia Power'],
    ['hawaii','Hawaii',4.00,'Hawaii offers a 35% state tax credit up to $5,000.',5000,'Avoided Cost',5.8,0.280,'Hawaiian Electric'],
    ['idaho','Idaho',2.90,'Idaho offers a 40% deduction on solar installation costs over 4 years.',2000,'Full Retail',5.0,0.102,'Idaho Power'],
    ['illinois','Illinois',3.10,'Illinois offers a Solar Renewable Energy Credit (SREC) program worth up to $10,000.',10000,'Full Retail',4.5,0.148,'ComEd'],
    ['indiana','Indiana',2.85,'Indiana offers a property tax deduction for solar installations.',1000,'Full Retail',4.5,0.138,'AES Indiana'],
    ['iowa','Iowa',3.00,'Iowa offers a 15% state tax credit up to $5,000.',5000,'Full Retail',4.6,0.115,'MidAmerican Energy'],
    ['kansas','Kansas',2.90,'Kansas offers a property tax exemption for solar installations.',500,'Full Retail',5.0,0.118,'Evergy'],
    ['kentucky','Kentucky',2.80,'Kentucky has no statewide solar incentive program.',0,'Full Retail',4.6,0.112,'LG&E and KU Energy'],
    ['louisiana','Louisiana',2.75,'Louisiana offers a 50% state tax credit up to $12,500.',12500,'Full Retail',5.0,0.090,'Entergy Louisiana'],
    ['maine','Maine',3.40,'Maine offers a solar rebate program up to $2,000.',2000,'Full Retail',4.2,0.198,'Central Maine Power'],
    ['maryland','Maryland',3.10,'Maryland offers a $1,000 state grant for residential solar.',1000,'Full Retail',4.5,0.148,'BGE'],
    ['massachusetts','Massachusetts',3.50,'Massachusetts offers a 15% state tax credit up to $1,000 plus SMART program.',1000,'Full Retail',4.2,0.248,'Eversource MA'],
    ['michigan','Michigan',3.10,'Michigan offers a property tax exemption for solar installations.',500,'Full Retail',4.2,0.182,'DTE Energy'],
    ['minnesota','Minnesota',3.10,'Minnesota offers a Solar*Rewards program rebate.',1500,'Full Retail',4.5,0.148,'Xcel Energy MN'],
    ['mississippi','Mississippi',2.75,'Mississippi has no statewide solar incentive program.',0,'Avoided Cost',5.0,0.112,'Entergy Mississippi'],
    ['missouri','Missouri',2.90,'Missouri offers a property tax exemption for solar installations.',500,'Full Retail',4.8,0.118,'Ameren Missouri'],
    ['montana','Montana',3.10,'Montana offers a $500 tax credit for residential solar.',500,'Full Retail',4.8,0.112,'NorthWestern Energy'],
    ['nebraska','Nebraska',2.90,'Nebraska offers a personal property tax exemption for solar.',500,'Full Retail',5.0,0.108,'OPPD'],
    ['nevada','Nevada',2.80,'Nevada offers a property tax abatement for solar installations.',1000,'Avoided Cost',6.2,0.115,'NV Energy'],
    ['new-hampshire','New Hampshire',3.40,'New Hampshire offers a rebate of up to $1,500 for solar installations.',1500,'Full Retail',4.2,0.218,'Eversource NH'],
    ['new-jersey','New Jersey',3.20,'New Jersey offers Transition Renewable Energy Certificates (TRECs).',2000,'Full Retail',4.4,0.165,'PSE&G'],
    ['new-mexico','New Mexico',2.75,'New Mexico offers a 10% state tax credit up to $6,000.',6000,'Full Retail',6.4,0.128,'Public Service NM'],
    ['new-york','New York',3.60,'New York offers a 25% state tax credit up to $5,000.',5000,'Full Retail',4.2,0.218,'Con Edison'],
    ['north-carolina','North Carolina',2.85,'North Carolina offers a property tax exemption for solar installations.',500,'Full Retail',5.0,0.118,'Duke Energy Carolinas'],
    ['north-dakota','North Dakota',2.90,'North Dakota offers a 15% state tax credit up to $3,000.',3000,'Full Retail',4.6,0.098,'Xcel Energy ND'],
    ['ohio','Ohio',2.95,'Ohio offers a sales tax exemption on solar equipment.',500,'Full Retail',4.4,0.138,'AEP Ohio'],
    ['oklahoma','Oklahoma',2.80,'Oklahoma offers a property tax exemption for solar installations.',500,'Full Retail',5.2,0.108,'OG&E'],
    ['oregon','Oregon',3.10,'Oregon offers a rebate of up to $5,000 through the Oregon Solar + Storage Rebate Program.',5000,'Full Retail',4.2,0.115,'Pacific Power'],
    ['pennsylvania','Pennsylvania',3.10,'Pennsylvania offers a Solar Renewable Energy Credit (SREC) program.',1000,'Full Retail',4.4,0.148,'PECO'],
    ['rhode-island','Rhode Island',3.50,'Rhode Island offers a 25% state tax credit up to $7,500.',7500,'Full Retail',4.2,0.228,'National Grid RI'],
    ['south-carolina','South Carolina',2.85,'South Carolina offers a 25% state tax credit up to $35,000 over 5 years.',35000,'Full Retail',5.0,0.138,'Duke Energy SC'],
    ['south-dakota','South Dakota',2.90,'South Dakota has no state income tax, making federal credits more valuable.',0,'Full Retail',5.0,0.112,'Otter Tail Power'],
    ['tennessee','Tennessee',2.85,'Tennessee has no statewide solar incentive program.',0,'Avoided Cost',4.8,0.118,'TVA'],
    ['texas','Texas',2.75,'Texas offers a property tax exemption for the added home value from solar.',1000,'Avoided Cost',5.5,0.120,'Oncor'],
    ['utah','Utah',2.85,'Utah offers a 25% state tax credit up to $1,600.',1600,'Full Retail',6.0,0.108,'Rocky Mountain Power'],
    ['vermont','Vermont',3.40,'Vermont offers a sales tax exemption and a net metering credit program.',1000,'Full Retail',4.0,0.198,'Green Mountain Power'],
    ['virginia','Virginia',2.95,'Virginia offers a sales tax exemption on solar equipment.',500,'Full Retail',4.6,0.138,'Dominion Energy VA'],
    ['washington','Washington',3.10,'Washington offers a sales tax exemption on solar installations.',1000,'Full Retail',4.0,0.102,'Puget Sound Energy'],
    ['west-virginia','West Virginia',2.90,'West Virginia has no statewide solar incentive program.',0,'Full Retail',4.4,0.118,'Appalachian Power'],
    ['wisconsin','Wisconsin',3.10,'Wisconsin offers a Focus on Energy rebate up to $500.',500,'Full Retail',4.4,0.168,'We Energies'],
    ['wyoming','Wyoming',2.90,'Wyoming has no statewide solar incentive program.',0,'Full Retail',5.2,0.108,'Rocky Mountain Power WY'],
  ];

  for (const s of states) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO states VALUES (?,?,?,?,?,?,?,?,?)',
      args: s,
    });
  }
  console.log(`Seeded ${states.length} states`);

  // Read cities and utilities from the local SQLite DB (already seeded)
  const Database = require('better-sqlite3');
  const localDb = new Database('data/solar.db');

  const cities = localDb.prepare('SELECT * FROM cities').all();
  for (const c of cities as any[]) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO cities VALUES (?,?,?,?,?,?,?,?,?)',
      args: [c.slug, c.name, c.state_slug, c.lat, c.lng, c.avg_sun_hours, c.avg_electricity_rate, c.population, c.utility_name],
    });
  }
  console.log(`Seeded ${cities.length} cities`);

  const utilities = localDb.prepare('SELECT * FROM utilities').all();
  for (const u of utilities as any[]) {
    await client.execute({
      sql: 'INSERT OR REPLACE INTO utilities VALUES (?,?,?,?,?,?,?)',
      args: [u.slug, u.name, u.state_slug, u.avg_rate_per_kwh, u.net_metering_policy, u.net_metering_compensation, u.net_metering_capacity_limit],
    });
  }
  console.log(`Seeded ${utilities.length} utilities`);

  localDb.close();
  console.log('Turso database seeded successfully!');
}

run().catch(console.error);
