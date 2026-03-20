'use client';

import { LoadingMoreState } from './states';
import { ResultItem } from './result-item';
import type { UnifiedFoodSearchResultItem } from './types';

type TabKey = 'Common' | 'Branded' | 'Custom';

const TAB_LABELS: Record<TabKey, string> = {
  Common: 'Common',
  Branded: 'Branded',
  Custom: 'Custom',
};

interface TabsProps {
  results: UnifiedFoodSearchResultItem[];
  query: string;
  showCustomTab: boolean;
  highlightedIndex: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  onSelect: (item: UnifiedFoodSearchResultItem) => void;
  onLoadMore: () => void;
}

export function Tabs({
  results,
  query,
  showCustomTab,
  highlightedIndex,
  hasMore,
  isLoadingMore,
  onSelect,
  onLoadMore,
}: TabsProps) {
  const commonItems = results.filter((r) => r.foodType === 'Generic');
  const brandedItems = results.filter((r) => r.foodType === 'Brand');
  const customItems = results.filter((r) => r.foodType === 'Custom');

  const availableTabs: TabKey[] = showCustomTab
    ? ['Common', 'Branded', 'Custom']
    : ['Common', 'Branded'];

  // Find which tab has content to determine a good default
  const defaultTab =
    availableTabs.find((t) => {
      if (t === 'Common') return commonItems.length > 0;
      if (t === 'Branded') return brandedItems.length > 0;
      if (t === 'Custom') return customItems.length > 0;
      return false;
    }) ?? 'Common';

  const [activeTab, setActiveTab] = React.useState<TabKey>(defaultTab);

  // Switch to a tab that has items when results change (initial load / query change)
  React.useEffect(() => {
    const current = activeTab;
    const currentItems =
      current === 'Common' ? commonItems : current === 'Branded' ? brandedItems : customItems;
    if (currentItems.length === 0) {
      const nextTab = availableTabs.find((t) => {
        if (t === 'Common') return commonItems.length > 0;
        if (t === 'Branded') return brandedItems.length > 0;
        if (t === 'Custom') return customItems.length > 0;
        return false;
      });
      if (nextTab) setActiveTab(nextTab);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results.length]);

  // After "load more" completes, switch to a tab that received new items if the current tab didn't
  const prevCountsRef = React.useRef<Record<TabKey, number>>({ Common: 0, Branded: 0, Custom: 0 });
  const wasLoadingMoreRef = React.useRef(false);
  React.useEffect(() => {
    if (isLoadingMore && !wasLoadingMoreRef.current) {
      wasLoadingMoreRef.current = true;
      prevCountsRef.current = { Common: commonItems.length, Branded: brandedItems.length, Custom: customItems.length };
    } else if (!isLoadingMore && wasLoadingMoreRef.current) {
      wasLoadingMoreRef.current = false;
      const currentCount = activeTab === 'Common' ? commonItems.length : activeTab === 'Branded' ? brandedItems.length : customItems.length;
      if (currentCount === prevCountsRef.current[activeTab]) {
        const nextTab = availableTabs.find((t) => {
          const curr = t === 'Common' ? commonItems.length : t === 'Branded' ? brandedItems.length : customItems.length;
          return curr > prevCountsRef.current[t];
        });
        if (nextTab) setActiveTab(nextTab);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingMore]);

  const activeItems =
    activeTab === 'Common' ? commonItems : activeTab === 'Branded' ? brandedItems : customItems;

  // Compute per-tab highlighted index offset
  const commonOffset = 0;
  const brandedOffset = commonItems.length;
  const customOffset = commonItems.length + brandedItems.length;

  const tabOffset =
    activeTab === 'Common' ? commonOffset : activeTab === 'Branded' ? brandedOffset : customOffset;

  return (
    <div>
      {/* Tab headers */}
      <div className="sticky top-0 z-10 bg-muted flex gap-2 border-b border-border px-4 pt-3 pb-2" role="tablist">
        {availableTabs.map((tab) => {
          const count =
            tab === 'Common' ? commonItems.length : tab === 'Branded' ? brandedItems.length : customItems.length;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-green-600 text-white'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
              data-testid={`tab-${tab.toLowerCase()}`}
            >
              {TAB_LABELS[tab]}
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-green-600 text-white text-[10px] font-semibold px-1 leading-none ring-2 ring-background">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div role="listbox" aria-label={`${activeTab} food results`}>
        {activeItems.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">No {TAB_LABELS[activeTab].toLowerCase()} results</p>
        ) : (
          activeItems.map((item, i) => (
            <ResultItem
              key={`${item.fatSecretId ?? item.id}-${i}`}
              item={item}
              query={query}
              highlighted={highlightedIndex === tabOffset + i}
              onSelect={onSelect}
            />
          ))
        )}
      </div>

      {/* Load more */}
      {(hasMore || isLoadingMore) && activeTab !== 'Custom' && (
        <div className="px-4 pb-2 pt-1 flex justify-center">
          {isLoadingMore ? (
            <LoadingMoreState />
          ) : (
            <button
              type="button"
              onClick={onLoadMore}
              className="text-xs font-medium text-green-700 hover:text-green-800"
            >
              Load more results
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Need React import for useState/useEffect
import React from 'react';
