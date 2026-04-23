'use client';

import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SearchHistoryEntry } from '@/hooks/use-search-history';
import type { UnifiedFoodSearchResultItem } from './types';

interface SuggestionsProps {
  query: string;
  history: SearchHistoryEntry[];
  results: UnifiedFoodSearchResultItem[];
  onSelect: (term: string) => void;
}

export function Suggestions({ query, history, results, onSelect }: SuggestionsProps) {
  const normalizedQuery = query.toLowerCase();

  // Partial matches from history
  const historyMatches = history
    .filter((e) => e.normalizedTerm.startsWith(normalizedQuery) && e.normalizedTerm !== normalizedQuery)
    .map((e) => e.term);

  // Result titles that start with the query
  const resultMatches = results
    .map((r) => r.name)
    .filter((name) => name.toLowerCase().startsWith(normalizedQuery))
    .filter((name) => !historyMatches.some((h) => h.toLowerCase() === name.toLowerCase()));

  const suggestions = [...historyMatches, ...resultMatches].slice(0, 5);

  if (suggestions.length === 0) return null;

  return (
    <div data-testid="search-suggestions">
      {suggestions.map((term) => (
        <Button
          key={term}
          type="button"
          variant="ghost"
          onClick={() => onSelect(term)}
          className="flex items-center gap-3 w-full px-3 py-2 h-auto justify-start text-sm text-foreground"
          data-testid="suggestion-item"
        >
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          {term}
        </Button>
      ))}
    </div>
  );
}
