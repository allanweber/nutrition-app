import { DailyNutritionSummary, FoodLogEntry } from '@/types/food';
import type { NutritionGoals } from '@/types/goals';
import { create } from 'zustand';

interface DashboardStore {
  // State
  todaySummary: DailyNutritionSummary | null;
  weeklyData: DailyNutritionSummary[];
  goals: NutritionGoals | null;
  recentLogs: FoodLogEntry[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setTodaySummary: (summary: DailyNutritionSummary | null) => void;
  setWeeklyData: (data: DailyNutritionSummary[]) => void;
  setGoals: (goals: NutritionGoals | null) => void;
  setRecentLogs: (logs: FoodLogEntry[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  getCaloriePercentage: () => number;
  getProteinPercentage: () => number;
  getCarbsPercentage: () => number;
  getFatPercentage: () => number;
}

export const useDashboardStore = create<DashboardStore>((set, get) => ({
  // Initial state
  todaySummary: null,
  weeklyData: [],
  goals: null,
  recentLogs: [],
  isLoading: false,
  error: null,

  // Actions
  setTodaySummary: (summary) => set({ todaySummary: summary }),
  setWeeklyData: (data) => set({ weeklyData: data }),
  setGoals: (goals) => set({ goals }),
  setRecentLogs: (logs) => set({ recentLogs: logs }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Computed values
  getCaloriePercentage: () => {
    const { todaySummary, goals } = get();
    if (!todaySummary || !goals || goals.calories === 0) return 0;
    return Math.min(
      Math.round((todaySummary.calories / goals.calories) * 100),
      100,
    );
  },

  getProteinPercentage: () => {
    const { todaySummary, goals } = get();
    if (!todaySummary || !goals || goals.protein === 0) return 0;
    return Math.min(
      Math.round((todaySummary.protein / goals.protein) * 100),
      100,
    );
  },

  getCarbsPercentage: () => {
    const { todaySummary, goals } = get();
    if (!todaySummary || !goals || goals.carbs === 0) return 0;
    return Math.min(Math.round((todaySummary.carbs / goals.carbs) * 100), 100);
  },

  getFatPercentage: () => {
    const { todaySummary, goals } = get();
    if (!todaySummary || !goals || goals.fat === 0) return 0;
    return Math.min(Math.round((todaySummary.fat / goals.fat) * 100), 100);
  },
}));
