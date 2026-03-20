'use client';

import { useState, useCallback } from 'react';

export interface SearchHistoryEntry {
  term: string;
  normalizedTerm: string;
  lastAccessedAt: number;
}

const STORAGE_KEY = 'fsf-search-history';
const MAX_ENTRIES = 30;
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function readHistory(): SearchHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const entries = JSON.parse(raw) as SearchHistoryEntry[];
    const cutoff = Date.now() - TTL_MS;
    return entries.filter((e) => e.lastAccessedAt >= cutoff);
  } catch {
    return [];
  }
}

function writeHistory(entries: SearchHistoryEntry[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage may be unavailable (private browsing quota exceeded)
  }
}

export function useSearchHistory() {
  const [history, setHistory] = useState<SearchHistoryEntry[]>(readHistory);

  const addEntry = useCallback((term: string) => {
    const normalizedTerm = term.toLowerCase().trim();
    if (!normalizedTerm) return;

    setHistory((prev) => {
      const now = Date.now();
      const existing = prev.findIndex((e) => e.normalizedTerm === normalizedTerm);
      let next: SearchHistoryEntry[];

      if (existing !== -1) {
        // Move to front with updated timestamp
        const updated = { ...prev[existing], lastAccessedAt: now };
        next = [updated, ...prev.slice(0, existing), ...prev.slice(existing + 1)];
      } else {
        // Prepend new entry, trim to MAX_ENTRIES
        next = [{ term, normalizedTerm, lastAccessedAt: now }, ...prev].slice(0, MAX_ENTRIES);
      }

      writeHistory(next);
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    }
  }, []);

  return { history, addEntry, clearHistory };
}
