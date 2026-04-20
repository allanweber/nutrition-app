'use client';

import { Star, Loader2, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFavoritesQuery, useDeleteFavoriteMutation } from '@/queries/favorites';
import type { FavoriteItem } from '@/types/favorites';

interface FavoritesModalProps {
  open: boolean;
  onClose: () => void;
  onSelectFood?: (item: FavoriteItem) => void;
  onSelectDish?: (item: FavoriteItem) => void;
}

export function FavoritesModal({ open, onClose, onSelectFood, onSelectDish }: FavoritesModalProps) {
  const { data, isLoading } = useFavoritesQuery();
  const deleteMutation = useDeleteFavoriteMutation();

  const favorites = data?.favorites ?? [];

  const handleSelect = (item: FavoriteItem) => {
    if (item.type === 'food') {
      onSelectFood?.(item);
    } else {
      onSelectDish?.(item);
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            Favorites
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : favorites.length === 0 ? (
            <div className="text-center py-12">
              <Star className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No favorites yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Star foods or dishes from search results
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/10">
              {favorites.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-muted/50 transition-colors group"
                >
                  <Button
                    variant="ghost"
                    onClick={() => handleSelect(item)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0 h-auto px-0 py-0 justify-start hover:bg-transparent"
                    data-testid={`favorite-item-${item.id}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                          item.type === 'dish'
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                            : 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
                        }`}>
                          {item.type === 'dish' ? 'Dish' : 'Food'}
                        </span>
                        {item.calories != null && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {item.calories} kcal
                          </span>
                        )}
                      </div>
                    </div>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 shrink-0"
                    aria-label={`Remove ${item.name} from favorites`}
                    data-testid={`remove-favorite-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
