import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-7xl mb-6">☀️</div>
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">The page you're looking for doesn't exist. Try our solar calculator or browse by state.</p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link href="/" className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-xl transition-colors">
            Go Home
          </Link>
          <Link href="/solar-calculator" className="border border-gray-300 hover:border-gray-400 text-gray-700 font-medium px-6 py-3 rounded-xl transition-colors">
            Solar Calculator
          </Link>
        </div>
      </div>
    </div>
  );
}
