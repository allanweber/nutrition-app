import { Beef, Droplets, Flame, Wheat } from "lucide-react";
import { roundTo } from "./utilities";

export type MacroRow = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export function MacroBadges({ macros }: { macros: MacroRow }) {
  return (
    <div className="mt-2.5 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
      <div className="inline-flex w-full max-w-[220px] items-center justify-between gap-2 rounded-md bg-orange-100 px-2.5 py-1.5 text-xs font-medium text-orange-600 tabular-nums">
      <span className="inline-flex items-center gap-1">
        <Flame className="h-3 w-3" />
        Calories
      </span>
      <span>{Math.round(macros.calories)} kcal</span>
      </div>
      <div className="inline-flex w-full max-w-[220px] items-center justify-between gap-2 rounded-md bg-red-100 px-2.5 py-1.5 text-xs font-medium text-red-600 tabular-nums">
      <span className="inline-flex items-center gap-1">
        <Beef className="h-3 w-3" />
        Protein
      </span>
      <span>{roundTo(macros.protein, 2)}g</span>
      </div>
      <div className="inline-flex w-full max-w-[220px] items-center justify-between gap-2 rounded-md bg-amber-100 px-2.5 py-1.5 text-xs font-medium text-amber-700 tabular-nums">
      <span className="inline-flex items-center gap-1">
        <Wheat className="h-3 w-3" />
        Carbs
      </span>
      <span>{roundTo(macros.carbs, 2)}g</span>
      </div>
      <div className="inline-flex w-full max-w-[220px] items-center justify-between gap-2 rounded-md bg-rose-100 px-2.5 py-1.5 text-xs font-medium text-rose-700 tabular-nums">
      <span className="inline-flex items-center gap-1">
        <Droplets className="h-3 w-3" />
        Fat
      </span>
      <span>{roundTo(macros.fat, 2)}g</span>
      </div>
    </div>
  );
}