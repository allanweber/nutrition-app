'use client';

import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SearchHistoryEntry } from '@/hooks/use-search-history';

interface HistoryListProps {
  history: SearchHistoryEntry[];
  onSelect: (term: string) => void;
}

export function HistoryList({ history, onSelect }: HistoryListProps) {
  if (history.length === 0) return null;

  const displayed = history.slice(0, 5);

  return (
    <div data-testid="search-history-list">
      <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Recent searches
      </p>
      {displayed.map((entry) => (
        <Button
          key={entry.normalizedTerm}
          type="button"
          variant="ghost"
          onClick={() => onSelect(entry.term)}
          className="flex items-center gap-3 w-full px-3 py-2 h-auto justify-start text-sm text-foreground"
          data-testid="history-item"
        >
          <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
          {entry.term}
        </Button>
      ))}
    </div>
  );
}
