export const MEAL_TYPE_ORDER = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'morning_snack',
  'afternoon_snack',
  'evening_snack',
  'pre_workout',
  'post_workout',
  'other',
] as const;
export type MealType = (typeof MEAL_TYPE_ORDER)[number];

export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
  morning_snack: 'Morning Snack',
  afternoon_snack: 'Afternoon Snack',
  evening_snack: 'Evening Snack',
  pre_workout: 'Pre-Workout',
  post_workout: 'Post-Workout',
  other: 'Other',
};

export const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  lunch: 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300',
  dinner: 'bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300',
  snack: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  morning_snack: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  afternoon_snack: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  evening_snack: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300',
  pre_workout: 'bg-lime-100 text-lime-800 dark:bg-lime-900/40 dark:text-lime-300',
  post_workout: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  other: 'bg-muted text-muted-foreground',
};

/** Tailwind bg classes for macro progress bars and UI elements */
export const MACRO_COLORS = {
  protein: 'bg-rose-500',
  carbs: 'bg-amber-500',
  fat: 'bg-sky-500',
} as const;

/** Tailwind text classes for macro values and labels */
export const MACRO_TEXT_COLORS = {
  protein: 'text-rose-500',
  carbs: 'text-amber-500',
  fat: 'text-sky-500',
} as const;

/** Hex values for charts that cannot use Tailwind utility classes */
export const MACRO_HEX_COLORS = {
  protein: '#f43f5e', // rose-500
  carbs: '#f59e0b',   // amber-500
  fat: '#0ea5e9',     // sky-500
} as const;
