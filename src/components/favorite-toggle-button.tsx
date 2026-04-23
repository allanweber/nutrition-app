'use client';

import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFavoriteIdsQuery, useToggleFavoriteMutation } from '@/queries/favorites';
import { useFavoritesQuery } from '@/queries/favorites';

interface FavoriteToggleButtonProps {
  foodId?: string;
  dishId?: string;
  className?: string;
}

export function FavoriteToggleButton({ foodId, dishId, className = '' }: FavoriteToggleButtonProps) {
  const idsQuery = useFavoriteIdsQuery();
  const favsQuery = useFavoritesQuery();
  const toggleMutation = useToggleFavoriteMutation();

  const foodIds = idsQuery.data?.foodIds ?? [];
  const dishIds = idsQuery.data?.dishIds ?? [];

  const isFavorite = foodId
    ? foodIds.includes(foodId)
    : dishId
    ? dishIds.includes(dishId)
    : false;

  // Find the favoriteId for removal
  const favoriteId = isFavorite
    ? favsQuery.data?.favorites.find((f) =>
        foodId ? f.itemId === foodId && f.type === 'food' : f.itemId === dishId && f.type === 'dish'
      )?.id
    : undefined;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (isFavorite) {
      if (favoriteId) {
        toggleMutation.mutate({ favoriteId, action: 'remove' });
      }
    } else {
      toggleMutation.mutate({ foodId, dishId, action: 'add' });
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      disabled={toggleMutation.isPending || idsQuery.isLoading}
      className={`size-7 ${
        isFavorite
          ? 'text-amber-500 hover:text-amber-600 hover:bg-transparent'
          : 'text-muted-foreground/40 hover:text-amber-500 hover:bg-transparent'
      } ${className}`}
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      data-testid={`favorite-toggle-${foodId ?? dishId}`}
    >
      <Star
        className="h-4 w-4"
        fill={isFavorite ? 'currentColor' : 'none'}
      />
    </Button>
  );
}
