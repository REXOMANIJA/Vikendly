'use client';

import dynamic from 'next/dynamic';

/** The map library needs the browser, so the map loads after the page (sand box meanwhile) */
const AreaMapLazy = dynamic(() => import('@/components/house/AreaMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-sand" />,
});

export default AreaMapLazy;
