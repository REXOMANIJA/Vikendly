import { ViewTransition } from 'react';

/**
 * Page-change animation. A template (unlike the layout) is created anew on every navigation,
 * so the old page can animate out and the new one in:
 * - links marked "nav-forward" (category, destination, house) slide the new page in from the right
 * - links marked "nav-back" ("Nazad") slide it in from the left
 * - everything else (menu, browser back) fades softly
 * Browsers without View Transitions simply switch pages as before.
 */
const animation = { 'nav-forward': 'nav-forward', 'nav-back': 'nav-back', default: 'page-fade' };

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={animation} exit={animation} default="none">
      <div>{children}</div>
    </ViewTransition>
  );
}
