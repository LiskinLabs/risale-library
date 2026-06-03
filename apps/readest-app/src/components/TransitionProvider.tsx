'use client';

import { usePathname } from 'next/navigation';
import { ViewTransitions } from 'next-view-transitions';
import React from 'react';

/**
 * Conditionally applies View Transitions based on the route.
 *
 * Transitions are disabled for the /reader route to avoid "TimeoutError"
 * during the heavy DOM update phase when loading multiple books or
 * computing book navigation on mount.
 */
export default function TransitionProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isReader = pathname?.startsWith('/reader');

  if (isReader) {
    return <>{children}</>;
  }

  return <ViewTransitions>{children}</ViewTransitions>;
}
