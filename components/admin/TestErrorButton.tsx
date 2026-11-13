'use client';

import { useState, useTransition } from 'react';
import { BellRing, Loader2 } from 'lucide-react';
import { triggerTestError } from '@/app/admin/actions';

/** Admin: causes a test error on the server, to check that the Telegram error alert arrives */
export default function TestErrorButton() {
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = () =>
    startTransition(async () => {
      try {
        await triggerTestError();
      } catch {
        // Expected: the action fails on purpose
      }
      setDone(true);
    });

  return (
    <div className="mt-10 border-t border-primary/10 pt-4 text-sm text-text/60">
      <button type="button" onClick={run} disabled={pending} className="inline-flex items-center gap-1.5 hover:text-primary hover:underline">
        {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <BellRing className="size-4" aria-hidden />}
        Test: pošaljite probnu grešku na Telegram
      </button>
      {done && (
        <p className="mt-1">
          Probna greška je napravljena. Na živom sajtu za par sekundi stiže poruka „Greška na sajtu“ na Telegram
          (ista greška najviše jednom u 30 minuta; tokom razvoja se ne šalje).
        </p>
      )}
    </div>
  );
}
