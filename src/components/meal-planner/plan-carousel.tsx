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
  onEditPlan: (plan: DietPlanDTO) => void;
  onPlanDuplicated: (planId: string) => void;
  onPlanDeleted: (planId: string) => void;
}

export function PlanCarousel({
  plans,
  isLoading,
  selectedPlanId,
  onSelectPlan,
  onAddNew,
  onEditPlan,
  onPlanDuplicated,
  onPlanDeleted,
}: PlanCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile: hide the "Add plan" card and center the first plan
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    // Track active plan card index (skip the Add New Plan card at the start)
    const addCardWidth = isMobile ? 0 : 180 + 16; // Add New Plan card width + gap
    const planCardWidth = 320 + 16; // plan card width + gap
    const planScrollLeft = Math.max(0, el.scrollLeft - addCardWidth);
    setActiveIndex(Math.round(planScrollLeft / planCardWidth));
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
  }, [plans.length, isMobile]);

  // Keep the selected plan visible (e.g. after duplicate adds a new card at the end).
  useEffect(() => {
    if (!selectedPlanId || isLoading) return;
    if (!plans.some((p) => p.id === selectedPlanId)) return;

    const frame = requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      const card = el.querySelector<HTMLElement>(`[data-plan-id="${selectedPlanId}"]`);
      if (!card) return;
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    });

    return () => cancelAnimationFrame(frame);
  }, [selectedPlanId, plans, isLoading]);

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  }

  const totalItems = plans.length;
  const showArrows = canScrollLeft || canScrollRight;
  const showDots =  canScrollLeft || canScrollRight;

  return (
    <div data-testid="plan-carousel" className="mb-6 space-y-3">
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
          className={cn(
            'flex gap-4 overflow-x-auto scrollbar-none py-1',
            // Mobile: start centered on the first plan (padding = half the remaining width)
            'max-sm:px-[calc((100vw-320px)/2)] max-sm:snap-x max-sm:snap-mandatory',
            // Desktop/tablet: classic carousel padding
            'sm:px-1',
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Add New Plan card */}
          {!isMobile && (
            <Button
              data-testid="add-new-plan-card"
              onClick={onAddNew}
              variant="ghost"
              className="flex flex-col items-center justify-center gap-2 min-w-45 h-39.5 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 shrink-0"
            >
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">Add New Plan</span>
            </Button>
          )}

          {/* Skeleton cards while loading */}
          {isLoading &&
            [1, 2].map((i) => (
              <div key={i} className="w-[320px] h-55 rounded-2xl bg-muted animate-pulse shrink-0" />
            ))}

          {/* Plan cards */}
          {!isLoading &&
            plans.map((plan) => (
              <div
                key={plan.id}
                data-plan-id={plan.id}
                className={cn('shrink-0', isMobile && 'max-sm:snap-center')}
              >
                <PlanCard
                  plan={plan}
                  isSelected={plan.id === selectedPlanId}
                  onSelect={() => onSelectPlan(plan.id)}
                  onEdit={onEditPlan}
                  onDuplicated={onPlanDuplicated}
                  onDeleted={onPlanDeleted}
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
