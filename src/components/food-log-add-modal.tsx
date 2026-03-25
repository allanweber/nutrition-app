'use client';

import { useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import { FoodLogAddForm } from '@/components/forms/food-log-add-form';
import { FavoriteToggleButton } from '@/components/favorite-toggle-button';
import type { FoodAddModalProps } from '@/components/food-search-field/types';

export function FoodLogAddModal({ open, food, foodDetail, isDetailLoading, onClose, onAdded }: FoodAddModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open || !food) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
      data-testid="food-add-modal"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Dialog */}
      <div
        className="relative z-10 bg-background border border-border rounded-lg shadow-xl w-full max-w-md"
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-modal-title"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border">
          <div>
            <h2 id="add-modal-title" className="font-semibold text-foreground">
              Add to Diary
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5 truncate max-w-[280px]">{food.name}</p>
            {food.brandName && (
              <p className="text-xs text-muted-foreground">{food.brandName}</p>
            )}
          </div>
          <div className="flex items-center gap-1 ml-4 shrink-0">
            {food.itemKind === 'dish' && food.dishId ? (
              <FavoriteToggleButton dishId={food.dishId} />
            ) : food.id ? (
              <FavoriteToggleButton foodId={food.id} />
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-4">
          {isDetailLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-4 justify-center">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading nutrition info…</span>
            </div>
          ) : foodDetail ? (
            <FoodLogAddForm foodDetail={foodDetail} onAdded={onAdded} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
