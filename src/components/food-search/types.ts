
export type FoodSearchTab = 'common' | 'branded' | 'custom';

export type Per100g = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sodium?: number;
};

export type MacroSummary = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
};

export type FoodSelection = {
  grams: number;
  servingUnit: string;
  quantity: string;
  macros: MacroSummary;
  servingLabel: string;
};

export type ServingOption = {
  id: string;
  label: string;
  qty: number;
  measure: string;
  grams: number;
};