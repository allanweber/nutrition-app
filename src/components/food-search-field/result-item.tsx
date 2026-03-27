'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, UtensilsCrossed } from 'lucide-react';
import { FavoriteToggleButton } from '@/components/favorite-toggle-button';
import type { UnifiedFoodSearchResultItem } from './types';

interface ResultItemProps {
  item: UnifiedFoodSearchResultItem;
  query: string;
  highlighted: boolean;
  onSelect: (item: UnifiedFoodSearchResultItem) => void;
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query || query.length < 1) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'i'));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-transparent font-semibold text-foreground">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

const FOOD_TYPE_LABEL: Record<string, string> = {
  Generic: 'Common',
  Brand: 'Branded',
  Custom: 'Custom',
};

export function ResultItem({ item, query, highlighted, onSelect }: ResultItemProps) {
  const isDish = item.itemKind === 'dish';

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 cursor-pointer rounded-md transition-colors group ${
        highlighted ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/60'
      }`}
      onClick={() => onSelect(item)}
      role="option"
      aria-selected={highlighted}
      data-testid="food-result-item"
    >
      {item.thumbnail ? (
        <Image
          src={item.thumbnail}
          alt={item.name}
          width={40}
          height={40}
          className="w-10 h-10 rounded object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-10 h-10 rounded bg-muted flex-shrink-0 flex items-center justify-center">
          <UtensilsCrossed className="h-5 w-5 text-muted-foreground/50" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{highlight(item.name, query)}</p>
        {item.brandName && (
          <p className="text-xs text-muted-foreground truncate">{item.brandName}</p>
        )}
        <div className="flex items-center gap-2 mt-0.5">
          {isDish ? (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400">
              Dish
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">{FOOD_TYPE_LABEL[item.foodType]}</span>
          )}
          {item.calories !== null && (
            <span className="text-xs text-muted-foreground tabular-nums">
              · {item.calories} kcal{isDish ? '' : '/100g'}
            </span>
          )}
        </div>
      </div>

      {/* Favorite toggle — visible on hover */}
      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        {isDish && item.dishId ? (
          <FavoriteToggleButton dishId={item.dishId} />
        ) : item.id ? (
          <FavoriteToggleButton foodId={item.id} />
        ) : null}
      </div>

      {item.fatSecretId && (
        <Link
          href={`/foods/${item.fatSecretId}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={`View nutrition details for ${item.name}`}
          title="View nutrition details"
          data-testid="food-detail-link"
        >
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}
