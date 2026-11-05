'use client';

import { useState, useTransition } from 'react';
import { setHousePublished } from '@/app/admin/actions';

export default function PublishToggle({ id, published }: { id: string; published: boolean }) {
  const [value, setValue] = useState(published);
  const [error, setError] = useState('');
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    const next = !value;
    setError('');
    setValue(next); // update right away, roll back if the save fails
    startTransition(async () => {
      const result = await setHousePublished(id, next);
      if (!result.ok) {
        setValue(!next);
        setError(result.error);
      }
    });
  };

  return (
    <div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={toggle}
        disabled={pending}
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium transition-colors disabled:opacity-60 ${
          value ? 'bg-primary text-white' : 'bg-gray-200 text-text/70'
        }`}
      >
        <span className={`size-2 rounded-full ${value ? 'bg-white' : 'bg-text/40'}`} />
        {value ? 'Objavljena' : 'Skrivena'}
      </button>
      {error && <p className="mt-1 max-w-48 text-xs text-accent-dark">{error}</p>}
    </div>
  );
}
