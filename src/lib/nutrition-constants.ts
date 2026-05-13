/** Milliliters added per "Log Hydration" tap (must match `addWater` in dashboard.service). */
export const HYDRATION_LOG_INCREMENT_ML = 250;

export const MEAL_TYPE_ORDER = [
  'breakfast',
  'morning_snack',
  'lunch',
  'afternoon_snack',
  'dinner',
  'evening_snack',
  'pre_workout',
  'post_workout',
  'snack',
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
  protein: 'bg-rose-500', //#FFEBEC
  carbs: 'bg-amber-500',  //#FEF6D4
  fat: 'bg-sky-500',      //#DFF2FE
} as const;

/** Tailwind text classes for macro values and labels */
export const MACRO_TEXT_COLORS = {
  protein: 'text-rose-500', //#D54069
  carbs: 'text-amber-500',  //#CC7A40
  fat: 'text-sky-500',      //#408FBE
} as const;

/** Hex values for charts that cannot use Tailwind utility classes */
export const MACRO_HEX_COLORS = {
  protein: '#f43f5e', // rose-500
  carbs: '#f59e0b',   // amber-500
  fat: '#0ea5e9',     // sky-500
} as const;

//Background kcal #e6f4ee, protein #FFEBEC, carbs #FEF6D4, fat #DFF2FE
//Text kcal #008d4d, protein #D54069, carbs #CC7A40, fat #408FBE

/** Light-tinted cell background classes for macro table columns */
export const MACRO_CELL_BG = {
  calories: 'bg-[#e6f4ee] dark:bg-emerald-950/40',
  protein:  'bg-[#FFEBEC] dark:bg-rose-950/40',
  carbs:    'bg-[#FEF6D4] dark:bg-amber-950/40',
  fat:      'bg-[#DFF2FE] dark:bg-sky-950/40',
} as const;

/** Text color classes for macro values inside colored table cells */
export const MACRO_CELL_TEXT = {
  calories: 'text-[#008d4d] dark:text-emerald-400',
  protein:  'text-[#D54069] dark:text-rose-400',
  carbs:    'text-[#CC7A40] dark:text-amber-400',
  fat:      'text-[#408FBE] dark:text-sky-400',
} as const;

/** Progress bar fill color classes for macro table cells */
export const MACRO_CELL_FILL = {
  calories: 'bg-[#008d4d] dark:bg-emerald-400',
  protein:  'bg-[#D54069] dark:bg-rose-400',
  carbs:    'bg-[#CC7A40] dark:bg-amber-400',
  fat:      'bg-[#408FBE] dark:bg-sky-400',
} as const;

/** Solid bg dot indicator for each meal type (used in food log row headers) */
export const MEAL_DOT_COLORS: Record<string, string> = {
  breakfast: 'bg-amber-500',
  lunch: 'bg-sky-500',
  dinner: 'bg-violet-500',
  snack: 'bg-emerald-500',
  morning_snack: 'bg-amber-500',
  afternoon_snack: 'bg-orange-500',
  evening_snack: 'bg-indigo-500',
  pre_workout: 'bg-lime-500',
  post_workout: 'bg-teal-500',
  other: 'bg-muted-foreground',
};

/** Light-tinted badge bg+text classes for inline macro chips */
export const MACRO_BADGE_COLORS = {
  protein: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  carbs: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  fat: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
} as const;

/** Badge bg+text classes for food-vs-dish type indicators */
export const ITEM_TYPE_BADGE_COLORS = {
  dish: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  food: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
} as const;

/** Background, text, and fill color classes for fiber, sugar, and sodium */
export const NUTRIENT_COLORS = {
  fiber:  { bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]', fill: 'bg-[#7E22CE]' },
  sugar:  { bg: 'bg-[#FFF1F2]', text: 'text-[#E11D48]', fill: 'bg-[#E11D48]' },
  sodium: { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]', fill: 'bg-[#475569]' },
} as const;