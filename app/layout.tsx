import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Link from 'next/link';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SolarMetrics – Solar Cost & Savings Calculator',
  description: 'Find out how much solar costs in your state, calculate your savings, and compare quotes from licensed installers.',
  verification: {
    google: 'RP8J1d34BJ-kWBh9tR3N6DDpGaxJr0POWJtxtMSu22I',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Impact.com affiliate verification — requires value= not content= */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <meta name="impact-site-verification" {...{ value: 'de99534b-7766-4bd7-ad01-4ae2b603ea3c' } as any} />
      </head>
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-yellow-500">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              SolarMetrics
            </Link>
            <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
              <Link href="/solar-calculator" className="hover:text-yellow-500 transition-colors">Calculator</Link>
              <Link href="/#states" className="hover:text-yellow-500 transition-colors">States</Link>
              <Link href="/#faq" className="hover:text-yellow-500 transition-colors">About</Link>
              <a
                href="https://www.energysage.com/?utm_source=solarmetrics&utm_medium=nav&utm_campaign=quotes"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-4 py-2 rounded-lg transition-colors font-semibold"
              >
                Get Free Quotes
              </a>
            </div>
          </nav>
        </header>

        <main>{children}</main>

        <footer className="bg-gray-900 text-gray-400 mt-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
              <div>
                <span className="text-yellow-400 font-bold text-lg">SolarMetrics</span>
                <p className="mt-2 text-sm">Your trusted source for solar cost data and savings calculations across all 50 states.</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3">Tools</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/solar-calculator" className="hover:text-white transition-colors">Solar Calculator</Link></li>
                  <li><Link href="/#states" className="hover:text-white transition-colors">State Solar Costs</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3">Resources</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/#faq" className="hover:text-white transition-colors">Solar FAQ</Link></li>
                  <li><a href="https://www.energysage.com/?utm_source=solarmetrics&utm_medium=footer" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Get Installer Quotes</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-3">Disclaimer</h4>
                <p className="text-xs">Data is for informational purposes only. Actual costs and savings vary by system, installer, and local conditions. Always get multiple quotes.</p>
              </div>
            </div>
            <div className="mt-10 pt-8 border-t border-gray-800 text-xs text-center">
              © {new Date().getFullYear()} SolarMetrics. All rights reserved. Not affiliated with any solar installer or utility company.
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
