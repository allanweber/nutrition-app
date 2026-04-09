import Link from 'next/link';
import { CalendarPlus, UtensilsCrossed, Dumbbell } from 'lucide-react';

const base =
  'inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-colors';
const primary = `${base} bg-primary text-primary-foreground hover:bg-primary/90`;
const ghost = `${base} border border-border/50 text-muted-foreground hover:text-foreground hover:border-border`;

export function CreatePlanButton({ variant = 'ghost' }: { variant?: 'primary' | 'ghost' }) {
  return (
    <Link href="/meal-planner/create" className={variant === 'primary' ? primary : ghost}>
      <CalendarPlus className="h-4 w-4" />
      Create Plan
    </Link>
  );
}

export function CreateFoodButton({ variant = 'primary' }: { variant?: 'primary' | 'ghost' }) {
  return (
    <Link href="/my-foods/create" className={variant === 'primary' ? primary : ghost}>
      <UtensilsCrossed className="h-4 w-4" />
      Create Food
    </Link>
  );
}

export function CreateExerciseButton({ variant = 'primary' }: { variant?: 'primary' | 'ghost' }) {
  return (
    <Link href="/exercise-library/create" className={variant === 'primary' ? primary : ghost}>
      <Dumbbell className="h-4 w-4" />
      Create Exercise
    </Link>
  );
}
