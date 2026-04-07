'use client';

import { useEffect, useRef } from 'react';
import { X, Loader2, Star, Trash2 } from 'lucide-react';
import { useFavoritesQuery, useDeleteFavoriteMutation } from '@/queries/favorites';
import type { FavoriteItem } from '@/types/favorites';

interface FavoritesModalProps {
  open: boolean;
  onClose: () => void;
  onSelectFood?: (item: FavoriteItem) => void;
  onSelectDish?: (item: FavoriteItem) => void;
}

export function FavoritesModal({ open, onClose, onSelectFood, onSelectDish }: FavoritesModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useFavoritesQuery();
  const deleteMutation = useDeleteFavoriteMutation();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

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
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="All Favorites"
        className="fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background rounded-2xl shadow-2xl border border-border/20 overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
            <h2 className="text-base font-bold text-foreground">Favorites</h2>
          </div>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-muted/80"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

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
                  <button
                    onClick={() => handleSelect(item)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
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
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(item.id)}
                    disabled={deleteMutation.isPending}
                    className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    aria-label={`Remove ${item.name} from favorites`}
                    data-testid={`remove-favorite-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
