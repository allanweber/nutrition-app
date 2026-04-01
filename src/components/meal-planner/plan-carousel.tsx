'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DietPlanDTO } from '@/server/services/diet-plan.service';
import { PlanCard } from './plan-card';

interface PlanCarouselProps {
  plans: DietPlanDTO[];
  isLoading: boolean;
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  onAddNew: () => void;
}

export function PlanCarousel({ plans, isLoading, selectedPlanId, onSelectPlan, onAddNew }: PlanCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    // Approximate active index by scroll position
    const cardWidth = 280 + 16; // card width + gap
    setActiveIndex(Math.round(el.scrollLeft / cardWidth));
  }

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollState);
      ro.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans.length]);

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  }

  const totalItems = plans.length + 1; // +1 for add card
  const showArrows = canScrollLeft || canScrollRight;
  const showDots =  canScrollLeft || canScrollRight;

  return (
    <div className="mb-6 space-y-3">
      <div className="relative">
        {/* Left arrow */}
        {showArrows && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={cn(
              'absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 shadow border',
              !canScrollLeft && 'opacity-0 pointer-events-none',
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto scrollbar-none px-1 py-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Add New Plan card */}
          <button
            onClick={onAddNew}
            className="flex flex-col items-center justify-center gap-2 min-w-[180px] h-[158px] rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-colors shrink-0"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Plus className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-medium text-on-surface-variant">Add New Plan</span>
          </button>

          {/* Skeleton cards while loading */}
          {isLoading &&
            [1, 2].map((i) => (
              <div key={i} className="w-[320px] h-55 rounded-2xl bg-muted animate-pulse shrink-0" />
            ))}

          {/* Plan cards */}
          {!isLoading &&
            plans.map((plan) => (
              <div key={plan.id} className="shrink-0">
                <PlanCard
                  plan={plan}
                  isSelected={plan.id === selectedPlanId}
                  onSelect={() => onSelectPlan(plan.id)}
                />
              </div>
            ))}
        </div>

        {/* Right arrow */}
        {showArrows && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={cn(
              'absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 shadow border',
              !canScrollRight && 'opacity-0 pointer-events-none',
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dots */}
      {showDots && (
        <div className="flex justify-center gap-1.5">
          {Array.from({ length: totalItems }).map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === activeIndex ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/30',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
