'use client';

import { useEffect, useRef } from 'react';
import { Tabs } from './tabs';
import { LoadingSkeleton, EmptyState, ErrorState, PromptState } from './states';
import type { UnifiedFoodSearchResultItem } from './types';

interface DropdownProps {
  /** Inline below input (fills layout height); default is overlay under input */
  stacked?: boolean;
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
  stacked = false,
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

  // Keep the tab UI mounted as soon as we have *any* results so selected tab state
  // doesn't reset if one of the parallel queries briefly flips isLoading=true.
  // (Playwright interacts with tabs; unmount/remount causes missed clicks + state reset.)
  const showTabs = query.length >= 3 && !error && results.length > 0;

  const positionClass = stacked
    ? 'relative mt-2 w-full max-h-[min(56dvh,28rem)]'
    : 'absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(60dvh,32rem)]';

  return (
    <div
      ref={dropdownRef}
      className={`${positionClass} flex flex-col overflow-hidden rounded-lg border border-border bg-background shadow-lg`}
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
            {isLoading && results.length === 0 && <LoadingSkeleton />}
            {!isLoading && error && <ErrorState message={error} onRetry={onRetry} />}
            {!isLoading && !error && results.length === 0 && <EmptyState query={query} />}
            {showTabs && (
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
      {showTabs && (
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
