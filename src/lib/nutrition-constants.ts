export const MEAL_TYPE_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPE_ORDER)[number];

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

export const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  lunch: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  dinner: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  snack: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
};

/** Tailwind bg classes for macro progress bars and UI elements */
export const MACRO_COLORS = {
  protein: 'bg-rose-500',
  carbs: 'bg-amber-500',
  fat: 'bg-sky-500',
} as const;

/** Hex values for charts that cannot use Tailwind utility classes */
export const MACRO_HEX_COLORS = {
  protein: '#f43f5e', // rose-500
  carbs: '#f59e0b',   // amber-500
  fat: '#0ea5e9',     // sky-500
} as const;
