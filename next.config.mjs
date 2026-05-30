import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const DB_PATH = join(process.cwd(), 'data', 'solar.db');
if (!existsSync(DB_PATH)) {
  console.log('Database not found — running seed script...');
  try {
    execSync('npx ts-node --transpile-only --compiler-options \'{"module":"commonjs","moduleResolution":"node"}\' scripts/seed.ts', { stdio: 'inherit' });
  } catch (e) {
    console.error('Seed failed:', e.message);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // better-sqlite3 is a native module — don't bundle it through webpack for server
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = [...(config.externals || []), 'better-sqlite3'];
    }
    return config;
  },
};

export default nextConfig;
