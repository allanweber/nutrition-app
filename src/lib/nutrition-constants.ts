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
  protein: 'bg-[#FFEBEC] dark:bg-rose-950/40',
  carbs:   'bg-[#FEF6D4] dark:bg-amber-950/40',
  fat:     'bg-[#DFF2FE] dark:bg-sky-950/40',
} as const;

/** Text color classes for macro values inside colored table cells */
export const MACRO_CELL_TEXT = {
  protein: 'text-[#D54069] dark:text-rose-400',
  carbs:   'text-[#CC7A40] dark:text-amber-400',
  fat:     'text-[#408FBE] dark:text-sky-400',
} as const;

/** Progress bar fill color classes for macro table cells */
export const MACRO_CELL_FILL = {
  protein: 'bg-[#D54069] dark:bg-rose-400',
  carbs:   'bg-[#CC7A40] dark:bg-amber-400',
  fat:     'bg-[#408FBE] dark:bg-sky-400',
} as const;

/** Left border color classes for macro cards */
export const MACRO_CELL_BORDER = {
  protein: 'border-l-[#D54069] dark:border-l-rose-400',
  carbs:   'border-l-[#CC7A40] dark:border-l-amber-400',
  fat:     'border-l-[#408FBE] dark:border-l-sky-400',
} as const;

/** Background, text, and fill color classes for fiber, sugar, and sodium */
export const NUTRIENT_COLORS = {
  fiber:  { bg: 'bg-[#F3E8FF]', text: 'text-[#7E22CE]', fill: 'bg-[#7E22CE]' },
  sugar:  { bg: 'bg-[#FFF1F2]', text: 'text-[#E11D48]', fill: 'bg-[#E11D48]' },
  sodium: { bg: 'bg-[#F1F5F9]', text: 'text-[#475569]', fill: 'bg-[#475569]' },
} as const;