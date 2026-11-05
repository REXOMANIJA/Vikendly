'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserAdminClient } from '@/lib/supabase/browser';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await createBrowserAdminClient().auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message === 'Invalid login credentials'
          ? 'Pogrešan email ili lozinka.'
          : `Prijava nije uspela: ${error.message}`
      );
      setLoading(false);
      return;
    }
    router.replace('/admin/kuce');
    router.refresh();
  };

  const field =
    'w-full h-11 px-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary';

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl space-y-4">
        <div>
          <p className="font-serif text-2xl font-bold text-primary">Vikendly</p>
          <h1 className="text-text/70">Administracija</h1>
        </div>
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
          <input id="email" type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Lozinka</label>
          <input id="password" type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)} className={field} />
        </div>
        {error && <p role="alert" className="rounded-lg bg-accent/10 px-3 py-2 text-sm text-accent-dark">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-primary py-3 font-medium text-white hover:bg-accent-dark transition-colors disabled:opacity-60">
          {loading ? 'Prijavljivanje…' : 'Prijavite se'}
        </button>
      </form>
    </main>
  );
}
