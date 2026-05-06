'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { SearchInput } from './input';
import { Dropdown } from './dropdown';
import { HistoryList } from './history-list';
import { Suggestions } from './suggestions';
import { useSearchHistory } from '@/hooks/use-search-history';
import { Search } from 'lucide-react';
import type { FoodSearchFieldProps, UnifiedFoodSearchResultItem } from './types';

export function FoodSearchField({
  state,
  onQueryChange,
  onLoadMore,
  onSelect,
  showCustomTab = true,
  placeholder,
  className,
  size = 'default',
  dropdownLayout = 'floating',
  inputTestId,
}: FoodSearchFieldProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [useMobileSheet, setUseMobileSheet] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mobileSheetRef = useRef<HTMLDivElement>(null);
  const { history, addEntry } = useSearchHistory();

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const update = () => {
      setIsMobileViewport(mediaQuery.matches);
      setUseMobileSheet(mediaQuery.matches && dropdownLayout === 'floating');
    };

    update();
    mediaQuery.addEventListener('change', update);

    return () => mediaQuery.removeEventListener('change', update);
  }, [dropdownLayout]);

  const handleQueryChange = useCallback(
    (value: string) => {
      onQueryChange(value);
      setHighlightedIndex(-1);
      setDropdownOpen(true);
    },
    [onQueryChange],
  );

  const handleFocus = useCallback(() => {
    setDropdownOpen(true);
  }, []);

  const handleSelect = useCallback(
    (item: UnifiedFoodSearchResultItem) => {
      addEntry(item.name);
      onSelect(item);
      setDropdownOpen(false);
      setHighlightedIndex(-1);
    },
    [onSelect, addEntry],
  );

  const handleHistorySelect = useCallback(
    (term: string) => {
      onQueryChange(term);
      setDropdownOpen(true);
    },
    [onQueryChange],
  );

  const handleSuggestionSelect = useCallback(
    (term: string) => {
      onQueryChange(term);
      setDropdownOpen(true);
    },
    [onQueryChange],
  );

  const handleClose = useCallback(() => {
    setDropdownOpen(false);
    setHighlightedIndex(-1);
  }, []);

  useEffect(() => {
    if (!useMobileSheet || !dropdownOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!mobileSheetRef.current?.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [dropdownOpen, handleClose, useMobileSheet]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const total = state.results.length;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        // If results haven't arrived yet, still move to index 0 so "Enter" can
        // select the first result as soon as the list renders.
        if (total === 0) {
          setHighlightedIndex(0);
        } else {
          setHighlightedIndex((i) => (i < total - 1 ? i + 1 : i));
        }
        setDropdownOpen(true);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : -1));
      } else if (e.key === 'Enter') {
        if (isMobileViewport) {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (total > 0) {
          e.preventDefault();
          const idx =
            highlightedIndex >= 0 && highlightedIndex < total ? highlightedIndex : 0;
          handleSelect(state.results[idx]);
        }
      } else if (e.key === 'Escape') {
        onQueryChange('');
        setHighlightedIndex(-1);
        setDropdownOpen(false);
      }
    },
    [state.results, highlightedIndex, handleSelect, isMobileViewport, onQueryChange],
  );

  // Open dropdown when query is set externally (e.g. quick add)
  useEffect(() => {
    if (state.query.length === 0) return;

    const frameId = window.requestAnimationFrame(() => {
      setDropdownOpen(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [state.query]);

  const handleRetry = useCallback(() => {
    onQueryChange(state.query);
  }, [onQueryChange, state.query]);

  const historyNode =
    state.query === '' && history.length > 0 ? (
      <HistoryList history={history} onSelect={handleHistorySelect} />
    ) : undefined;

  const suggestionsNode =
    state.query.length >= 1 && state.query.length < 3 ? (
      <Suggestions
        query={state.query}
        history={history}
        results={state.results}
        onSelect={handleSuggestionSelect}
      />
    ) : undefined;

  const rootClass =
    dropdownLayout === 'stacked'
      ? `flex min-w-0 flex-col ${className ?? ''}`
      : `relative ${className ?? ''}`;

  const searchInput = (
    <SearchInput
      value={state.query}
      onChange={handleQueryChange}
      onKeyDown={handleKeyDown}
      onFocus={handleFocus}
      placeholder={placeholder}
      size={size}
      inputTestId={inputTestId}
    />
  );

  return (
    <div className={rootClass.trim()} ref={containerRef}>
      {(!useMobileSheet || !dropdownOpen) && searchInput}
      {!useMobileSheet && (
        <Dropdown
          stacked={dropdownLayout === 'stacked'}
          open={dropdownOpen}
          query={state.query}
          results={state.results}
          isLoading={state.isLoading}
          isLoadingMore={state.isLoadingMore}
          error={state.error}
          hasMore={state.hasMore}
          showCustomTab={showCustomTab}
          highlightedIndex={highlightedIndex}
          onSelect={handleSelect}
          onLoadMore={onLoadMore}
          onRetry={handleRetry}
          onClose={handleClose}
          anchorRef={containerRef}
          historyList={historyNode}
          suggestions={suggestionsNode ? suggestionsNode : undefined}
        />
      )}
      {useMobileSheet && (
        dropdownOpen && (
          <div className="fixed inset-0 z-60 bg-black/30">
            <div
              ref={mobileSheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="Search foods"
              className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 overflow-hidden rounded-2xl border bg-background p-0 shadow-lg"
            >
              <div className="shrink-0 px-4 pb-2 pt-4">
                <h2 className="flex items-center gap-2 text-base font-semibold">
                  <Search className="h-4 w-4" />
                  Search foods
                </h2>
              </div>
              <div className="flex max-h-[50dvh] flex-col overflow-hidden px-4 pb-4 pt-2">
                <SearchInput
                  value={state.query}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                  onFocus={handleFocus}
                  placeholder={placeholder}
                  size="small"
                  inputTestId={`${inputTestId}-mobile`}
                  autoFocus
                />
                <Dropdown
                  stacked
                  open={dropdownOpen}
                  query={state.query}
                  results={state.results}
                  isLoading={state.isLoading}
                  isLoadingMore={state.isLoadingMore}
                  error={state.error}
                  hasMore={state.hasMore}
                  showCustomTab={showCustomTab}
                  highlightedIndex={highlightedIndex}
                  onSelect={handleSelect}
                  onLoadMore={onLoadMore}
                  onRetry={handleRetry}
                  onClose={handleClose}
                  anchorRef={mobileSheetRef}
                  historyList={historyNode}
                  suggestions={suggestionsNode ? suggestionsNode : undefined}
                />
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
