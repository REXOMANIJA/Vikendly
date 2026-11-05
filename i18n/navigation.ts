import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Locale-aware versions of Next's navigation APIs.
// Use these instead of next/link and next/navigation so the /sr or /en prefix is handled for you.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
