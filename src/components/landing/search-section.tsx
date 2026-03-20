'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FoodSearchField } from '@/components/food-search-field';
import { useFoodSearch } from '@/hooks/use-food-search';
import type { UnifiedFoodSearchResultItem } from '@/components/food-search-field/types';

const popularSearches = ['Chicken breast', 'Avocado', 'Greek yogurt', 'Protein bar', 'Brown rice', 'Almonds'];

const stats = [
  { value: '500,000+', label: 'Foods in database' },
  { value: '3', label: 'Categories: common, branded, custom' },
  { value: 'Real-time', label: 'Instant results as you type' },
];

export function SearchSection() {
  const router = useRouter();
  const foodSearch = useFoodSearch({ includeCustom: false, anonymous: true });
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const handleSelect = (item: UnifiedFoodSearchResultItem) => {
    if (item.fatSecretId) {
      router.push(`/foods/${item.fatSecretId}`);
    }
  };

  const handleChipClick = (term: string) => {
    foodSearch.setQuery(term);
    searchContainerRef.current?.querySelector('input')?.focus();
  };

  return (
    <section className="py-20 md:py-28 bg-background border-b border-border" data-testid="landing-search-section">
      <div className="container mx-auto px-4">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">
            Nutrition Database
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 leading-tight">
            Search 500,000+ foods{' '}
            <span className="text-primary">instantly</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-lg mx-auto">
            Common foods, branded products, and your own custom entries — all in one place, no account required to explore.
          </p>
        </motion.div>

        {/* Search field */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto mb-5"
        >
          <div ref={searchContainerRef}>
            <FoodSearchField
              state={foodSearch}
              onQueryChange={foodSearch.setQuery}
              onLoadMore={foodSearch.loadMore}
              onSelect={handleSelect}
              showCustomTab={false}
              placeholder="Search for any food or meal…"
            />
          </div>
        </motion.div>

        {/* Popular search chips */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-wrap justify-center gap-2 mb-14 max-w-2xl mx-auto"
        >
          <span className="text-sm text-muted-foreground self-center mr-1">Try:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => handleChipClick(term)}
              className="px-3 py-1 rounded-full bg-muted hover:bg-muted/80 text-sm text-foreground border border-border transition-colors"
            >
              {term}
            </button>
          ))}
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.25 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto text-center"
        >
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-bold text-foreground tabular-nums">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
