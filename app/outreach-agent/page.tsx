'use client';

import { useState, useEffect } from 'react';

const PASSWORD = 'SolarMetrics2026';
const SESSION_KEY = 'outreach_unlocked';

const DRAFT_TYPES = [
  { id: 'monday', label: 'Monday Cold Email' },
  { id: 'followup', label: 'Follow-Up Email' },
  { id: 'linkedin', label: 'LinkedIn Message' },
  { id: 'cold_call', label: 'Cold Call Script' },
];

const NICHES = [
  'Homeowners (suburban)',
  'Small business owners',
  'Commercial real estate',
  'Farms & agriculture',
  'Churches & nonprofits',
  'HOA communities',
  'Property managers',
  'Schools & education',
];

export default function OutreachAgentPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [draftType, setDraftType] = useState('monday');
  const [niche, setNiche] = useState('');
  const [customNiche, setCustomNiche] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Restore session on mount
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === '1') {
      setUnlocked(true);
    }
  }, []);

  function handleUnlock(e: React.FormEvent) {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setUnlocked(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  }

  async function handleDraft(e: React.FormEvent) {
    e.preventDefault();
    const topic = customNiche.trim() || niche;
    if (!topic) {
      setError('Please select or enter a niche.');
      return;
    }

    setLoading(true);
    setResult('');
    setError('');
    setCopied(false);

    try {
      const res = await fetch('/api/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: draftType, topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unknown error');
      setResult(data.result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ── Password gate ──────────────────────────────────────────────
  if (!unlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-2 mb-6">
            <svg className="w-6 h-6 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="5" />
              <path
                d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="font-bold text-lg text-gray-900">Outreach Agent</span>
          </div>
          <p className="text-sm text-gray-500 mb-6">Enter your password to access this tool.</p>
          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError(false);
              }}
              className={`w-full border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 ${
                passwordError ? 'border-red-400' : 'border-gray-300'
              }`}
              autoFocus
            />
            {passwordError && (
              <p className="text-xs text-red-500">Incorrect password. Try again.</p>
            )}
            <button
              type="submit"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Agent UI ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <svg className="w-6 h-6 text-yellow-500" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="5" />
              <path
                d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Solar Outreach Agent
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Generate AI-drafted outreach copy for any solar prospect niche.
          </p>
        </div>

        {/* Form card */}
        <form onSubmit={handleDraft} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
          {/* Draft type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Draft type</label>
            <div className="grid grid-cols-2 gap-2">
              {DRAFT_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDraftType(t.id)}
                  className={`text-sm py-2 px-3 rounded-lg border transition-colors text-left ${
                    draftType === t.id
                      ? 'border-yellow-400 bg-yellow-50 text-gray-900 font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Niche select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target niche</label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            >
              <option value="">Select a niche…</option>
              {NICHES.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Custom niche */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Or describe a custom niche
              <span className="text-gray-400 font-normal ml-1">(overrides dropdown)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. RV park owners, marina operators…"
              value={customNiche}
              onChange={(e) => setCustomNiche(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:opacity-60 text-gray-900 font-semibold py-3 rounded-lg transition-colors text-sm"
          >
            {loading ? 'Drafting…' : 'Generate Draft'}
          </button>
        </form>

        {/* Result */}
        {result && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Generated copy</span>
              <button
                onClick={handleCopy}
                className="text-xs text-gray-500 hover:text-gray-800 border border-gray-200 rounded-md px-3 py-1 transition-colors"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
