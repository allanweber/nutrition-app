'use client';

import { useCallback, useEffect, useState } from 'react';

function getDismissKey(dateStr: string) {
  return `vitalis-plan-banner-${dateStr}`;
}

function readDismissed(dateStr: string) {
  if (typeof window === 'undefined') return false;

  try {
    return window.localStorage.getItem(getDismissKey(dateStr)) === 'true';
  } catch {
    return false;
  }
}

export function usePlanBannerDismissed(dateStr: string) {
  const [isDismissed, setIsDismissed] = useState(() => readDismissed(dateStr));

  useEffect(() => {
    setIsDismissed(readDismissed(dateStr));
  }, [dateStr]);

  const dismiss = useCallback(() => {
    setIsDismissed(true);

    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(getDismissKey(dateStr), 'true');
    } catch {
      // Ignore storage failures and keep local state.
    }
  }, [dateStr]);

  return { isDismissed, dismiss };
}