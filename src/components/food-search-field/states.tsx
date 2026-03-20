'use client';

import { Loader2, SearchX, AlertCircle, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LoadingSkeleton() {
  return (
    <div className="px-3 py-4 flex items-center gap-2 text-muted-foreground" data-testid="search-loading">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Searching foods...</span>
    </div>
  );
}

export function EmptyState({ query }: { query: string }) {
  return (
    <div className="px-3 py-6 text-center" data-testid="search-empty">
      <SearchX className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
      <p className="text-sm font-medium text-foreground">
        No results for &ldquo;{query}&rdquo;
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        Try a shorter name, check spelling, or search by brand.
      </p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="px-3 py-4" data-testid="search-error">
      <div className="flex items-start gap-2 text-destructive mb-3">
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <p className="text-sm">{message}</p>
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export function LoadingMoreState() {
  return (
    <div className="flex items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      Loading more…
    </div>
  );
}

export function PromptState() {
  return (
    <div className="px-3 py-4 flex items-center gap-2 text-muted-foreground" data-testid="search-prompt">
      <Search className="h-4 w-4" />
      <span className="text-sm">Type at least 3 characters to search</span>
    </div>
  );
}
