'use client';

import { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DietPlanDTO } from '@/server/services/diet-plan.service';
import { MACRO_TEXT_COLORS } from '@/lib/nutrition-constants';
import { PlanOptionsMenu } from './plan-card';

interface MobilePlanCarouselProps {
  plans: DietPlanDTO[];
  isLoading: boolean;
  selectedPlanId: string | null;
  onSelectPlan: (planId: string) => void;
  onAddNew: () => void;
  onPlanDeleted: (planId: string) => void;
}

interface MobilePlanCardProps {
  plan: DietPlanDTO;
  isSelected: boolean;
  onSelect: () => void;
  onDeleted: (planId: string) => void;
}

function MobilePlanCard({ plan, isSelected, onSelect, onDeleted }: MobilePlanCardProps) {
  const isActive = plan.status === 'active';

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex flex-col gap-3 p-4 rounded-2xl border cursor-pointer transition-all select-none shrink-0 w-[min(85vw,300px)]',
        isSelected && 'bg-primary/10 dark:bg-secondary',
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full',
            isActive
              ? 'bg-primary text-primary-foreground'
              : plan.status === 'draft'
                ? 'bg-muted text-muted-foreground border border-border'
                : 'bg-muted text-muted-foreground',
          )}
        >
          {isActive ? 'Active Plan' : plan.status === 'draft' ? 'Draft' : 'Archived'}
        </span>
        <PlanOptionsMenu plan={plan} onDeleted={onDeleted} testIdPrefix="mobile-plan" />
      </div>

      <p className="text-lg font-bold truncate text-foreground">{plan.name}</p>

      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold tabular-nums text-foreground">
          {plan.targetCalories ? Math.round(plan.targetCalories).toLocaleString() : '—'}
        </span>
        <span className="text-xs text-muted-foreground">kcal/day</span>
      </div>

      <div className="flex gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Protein</p>
          <p className={`text-sm font-bold ${MACRO_TEXT_COLORS.protein}`}>{plan.targetProtein ? `${Math.round(plan.targetProtein)}g` : '—'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Carbs</p>
          <p className={`text-sm font-bold ${MACRO_TEXT_COLORS.carbs}`}>{plan.targetCarbs ? `${Math.round(plan.targetCarbs)}g` : '—'}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Fats</p>
          <p className={`text-sm font-bold ${MACRO_TEXT_COLORS.fat}`}>{plan.targetFat ? `${Math.round(plan.targetFat)}g` : '—'}</p>
        </div>
      </div>
    </div>
  );
}

export function MobilePlanCarousel({ plans, isLoading, selectedPlanId, onSelectPlan, onAddNew, onPlanDeleted }: MobilePlanCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // When a plan is selected, center it in the carousel.
  useEffect(() => {
    if (!selectedPlanId) return;
    const el = scrollRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>(`[data-plan-id="${selectedPlanId}"]`);
    if (!card) return;
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [selectedPlanId, plans.length, isLoading]);

  function updateScrollState() {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    // Plan card is w-[min(85vw,300px)] — approximate as 300px + gap
    const planCardWidth = 313;
    setActiveIndex(Math.round(el.scrollLeft / planCardWidth));
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
  }, [plans.length]);

  function scroll(dir: 'left' | 'right') {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -280 : 280, behavior: 'smooth' });
  }

  return (
    <div className="md:hidden mb-4 space-y-3">
      <div className="relative">
        {canScrollLeft && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 shadow border"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-none px-1 py-1"
          style={{ scrollSnapType: 'x mandatory', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Mobile: "Add Plan" card hidden (use FAB or other entry points) */}

          {/* Loading skeletons */}
          {isLoading && [1, 2].map((i) => (
            <div key={i} className="w-[min(85vw,300px)] h-[148px] rounded-2xl bg-muted animate-pulse shrink-0" style={{ scrollSnapAlign: 'start' }} />
          ))}

          {/* Plan cards */}
          {!isLoading && plans.map((plan) => (
            <div key={plan.id} data-plan-id={plan.id} style={{ scrollSnapAlign: 'start' }}>
              <MobilePlanCard
                plan={plan}
                isSelected={plan.id === selectedPlanId}
                onSelect={() => onSelectPlan(plan.id)}
                onDeleted={onPlanDeleted}
              />
            </div>
          ))}
        </div>

        {canScrollRight && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-8 w-8 bg-background/80 shadow border"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Dots — one per plan */}
      {plans.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {plans.map((_, i) => (
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
