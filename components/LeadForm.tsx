'use client';
import { useState } from 'react';

export default function LeadForm({ city = '', state = '' }: { city?: string; state?: string }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', monthly_bill: '', city, state });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, monthly_bill: Number(form.monthly_bill) }),
      });
      setStatus(res.ok ? 'success' : 'error');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-3">☀️</div>
        <h3 className="text-xl font-bold text-green-800">You're on the list!</h3>
        <p className="text-green-700 mt-2">We'll connect you with licensed installers in your area. Check your email for next steps.</p>
        <a
          href="https://www.energysage.com/?utm_source=solarmetrics&utm_medium=leadform&utm_campaign=quotes"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-4 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-6 py-3 rounded-lg transition-colors"
        >
          Compare Quotes Now →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900">Get Free Solar Quotes</h3>
        <p className="text-sm text-gray-500 mt-1">Connect with licensed installers in your area. No obligation.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <input required value={form.name} onChange={e => update('name', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
            placeholder="Jane Smith" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input required type="email" value={form.email} onChange={e => update('email', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
            placeholder="jane@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
            placeholder="(555) 000-0000" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Electric Bill</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input required type="number" min={20} value={form.monthly_bill} onChange={e => update('monthly_bill', e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-transparent outline-none"
              placeholder="150" />
          </div>
        </div>
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>
      )}

      <button type="submit" disabled={status === 'loading'}
        className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-bold py-3 rounded-xl transition-colors text-lg">
        {status === 'loading' ? 'Sending...' : 'Get My Free Quotes →'}
      </button>
      <p className="text-xs text-gray-400 text-center">By submitting, you agree to be contacted about solar installation quotes.</p>
    </form>
  );
}
