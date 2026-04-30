'use client';

import React from 'react';
import { Tabs as TabsRoot, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
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

  // Prefer a tab that has results. If only Custom has results, default to Custom.
  const defaultTab =
    availableTabs.find((t) => {
      if (t === 'Common') return commonItems.length > 0;
      if (t === 'Branded') return brandedItems.length > 0;
      if (t === 'Custom') return customItems.length > 0;
      return false;
    }) ?? (showCustomTab ? 'Custom' : 'Common');

  const userHasManuallySelectedTab = React.useRef(false);
  const [activeTab, setActiveTab] = React.useState<TabKey>(defaultTab);

  const handleTabClick = (tab: TabKey) => {
    userHasManuallySelectedTab.current = true;
    setActiveTab(tab);
  };

  // Switch to a non-custom tab that has items when results change (initial load / query change)
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
          const curr =
            t === 'Common'
              ? commonItems.length
              : t === 'Branded'
                ? brandedItems.length
                : customItems.length;
          return curr > prevCountsRef.current[t];
        });
        if (nextTab) setActiveTab(nextTab);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingMore]);

  const commonOffset = 0;
  const brandedOffset = commonItems.length;
  const customOffset = commonItems.length + brandedItems.length;

  return (
    <TabsRoot value={activeTab} onValueChange={(v) => handleTabClick(v as TabKey)}>
      <TabsList className="sticky top-0 z-10 bg-muted border-b border-border w-full justify-start rounded-none h-auto px-4 pt-3 pb-2 gap-1 overflow-visible">
        {availableTabs.map((tab) => {
          const count =
            tab === 'Common' ? commonItems.length : tab === 'Branded' ? brandedItems.length : customItems.length;
          return (
            <TabsTrigger
              key={tab}
              value={tab}
              className="relative flex-none h-auto px-3 py-1 rounded-full text-xs font-medium"
              data-testid={`tab-${tab.toLowerCase()}`}
            >
              {TAB_LABELS[tab]}
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1 leading-none ring-2 ring-background">
                  {count}
                </span>
              )}
            </TabsTrigger>
          );
        })}
      </TabsList>

      {availableTabs.map((tab) => {
        const items = tab === 'Common' ? commonItems : tab === 'Branded' ? brandedItems : customItems;
        const offset = tab === 'Common' ? commonOffset : tab === 'Branded' ? brandedOffset : customOffset;
        return (
          <TabsContent key={tab} value={tab} role="listbox" aria-label={`${tab} food results`} className="m-0">
            {items.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">No {TAB_LABELS[tab].toLowerCase()} results</p>
            ) : (
              items.map((item, i) => (
                <ResultItem
                  key={`${item.fatSecretId ?? item.id}-${i}`}
                  item={item}
                  query={query}
                  highlighted={highlightedIndex === offset + i}
                  onSelect={onSelect}
                />
              ))
            )}
            {(hasMore || isLoadingMore) && tab !== 'Custom' && (
              <div className="px-4 pb-2 pt-1 flex justify-center">
                {isLoadingMore ? (
                  <LoadingMoreState />
                ) : (
                  <Button variant="ghost" size="sm" onClick={onLoadMore} className="text-xs font-medium text-primary hover:text-primary">
                    Load more results
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        );
      })}
    </TabsRoot>
  );
}
