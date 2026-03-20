'use client';

import { useEffect, useRef } from 'react';
import { Tabs } from './tabs';
import { LoadingSkeleton, EmptyState, ErrorState, PromptState } from './states';
import type { UnifiedFoodSearchResultItem } from './types';

interface DropdownProps {
  open: boolean;
  query: string;
  results: UnifiedFoodSearchResultItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  showCustomTab: boolean;
  highlightedIndex: number;
  onSelect: (item: UnifiedFoodSearchResultItem) => void;
  onLoadMore: () => void;
  onRetry: () => void;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  historyList?: React.ReactNode;
  suggestions?: React.ReactNode;
}

export function Dropdown({
  open,
  query,
  results,
  isLoading,
  isLoadingMore,
  error,
  hasMore,
  showCustomTab,
  highlightedIndex,
  onSelect,
  onLoadMore,
  onRetry,
  onClose,
  anchorRef,
  historyList,
  suggestions,
}: DropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleMouseDown(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const showResults = query.length >= 3 && !isLoading && !error && results.length > 0;

  return (
    <div
      ref={dropdownRef}
      className="absolute left-0 right-0 top-full mt-2 z-50 bg-background border border-border rounded-2xl shadow-lg overflow-hidden max-h-[520px] flex flex-col"
      data-testid="food-search-dropdown"
    >
      {/* Scrollable content area */}
      <div className="overflow-y-auto flex-1 min-h-0">
        {/* History: shown when query is empty */}
        {query === '' && historyList && historyList}

        {/* Suggestions: shown when query is 1-2 chars */}
        {query.length >= 1 && query.length < 3 && suggestions && suggestions}

        {/* Prompt: shown when query is 1-2 chars and no suggestions */}
        {query.length >= 1 && query.length < 3 && !suggestions && <PromptState />}

        {/* Prompt when no query and no history */}
        {query === '' && !historyList && (
          <div className="px-3 py-4 text-sm text-muted-foreground">
            Type to search for foods
          </div>
        )}

        {/* Search results */}
        {query.length >= 3 && (
          <>
            {isLoading && <LoadingSkeleton />}
            {!isLoading && error && <ErrorState message={error} onRetry={onRetry} />}
            {!isLoading && !error && results.length === 0 && <EmptyState query={query} />}
            {showResults && (
              <Tabs
                results={results}
                query={query}
                showCustomTab={showCustomTab}
                highlightedIndex={highlightedIndex}
                hasMore={hasMore}
                isLoadingMore={isLoadingMore}
                onSelect={onSelect}
                onLoadMore={onLoadMore}
              />
            )}
          </>
        )}
      </div>

      {/* Keyboard shortcuts footer — hidden on mobile */}
      {showResults && (
        <div className="hidden sm:block border-t border-border px-4 py-3 bg-muted flex-shrink-0">
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1.5 font-mono font-medium text-[10px]">↑</kbd>
              <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1.5 font-mono font-medium text-[10px]">↓</kbd>
              <span>to navigate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1.5 font-mono font-medium text-[10px]">↵</kbd>
              <span>to select</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center rounded border border-border bg-background px-1.5 font-mono font-medium text-[10px]">ESC</kbd>
              <span>to clear</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
