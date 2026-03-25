'use client';

import { useState, useRef, useCallback } from 'react';
import { SearchInput } from './input';
import { Dropdown } from './dropdown';
import { HistoryList } from './history-list';
import { Suggestions } from './suggestions';
import { useSearchHistory } from '@/hooks/use-search-history';
import type { FoodSearchFieldProps, UnifiedFoodSearchResultItem } from './types';

export function FoodSearchField({
  state,
  onQueryChange,
  onLoadMore,
  onSelect,
  showCustomTab = true,
  preferCustomTab = false,
  placeholder,
  className,
  size = 'default',
}: FoodSearchFieldProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const { history, addEntry } = useSearchHistory();

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const total = state.results.length;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((i) => (i < total - 1 ? i + 1 : i));
        setDropdownOpen(true);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((i) => (i > 0 ? i - 1 : -1));
      } else if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && highlightedIndex < total) {
          e.preventDefault();
          handleSelect(state.results[highlightedIndex]);
        }
      } else if (e.key === 'Escape') {
        onQueryChange('');
        setHighlightedIndex(-1);
        setDropdownOpen(false);
      }
    },
    [state.results, highlightedIndex, handleSelect, onQueryChange],
  );

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

  return (
    <div className={`relative ${className ?? ''}`} ref={containerRef}>
      <SearchInput
        value={state.query}
        onChange={handleQueryChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        placeholder={placeholder}
        size={size}
      />
      <Dropdown
        open={dropdownOpen}
        query={state.query}
        results={state.results}
        isLoading={state.isLoading}
        isLoadingMore={state.isLoadingMore}
        error={state.error}
        hasMore={state.hasMore}
        showCustomTab={showCustomTab}
        preferCustomTab={preferCustomTab}
        highlightedIndex={highlightedIndex}
        onSelect={handleSelect}
        onLoadMore={onLoadMore}
        onRetry={handleRetry}
        onClose={handleClose}
        anchorRef={containerRef}
        historyList={historyNode}
        suggestions={suggestionsNode ? suggestionsNode : undefined}
      />
    </div>
  );
}
