export type UnitSystem = 'metric' | 'imperial';

export type GoalType =
  | 'weight_loss'
  | 'maintenance'
  | 'weight_gain'
  | 'muscle_gain'
  | 'fat_loss'
  | 'performance'
  | 'general_health';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'extra_active';

export interface NutritionGoals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sodium: number;
  goalType?: GoalType;
  activityLevel?: ActivityLevel;
}

export interface NutritionGoalWizardInputsSnapshot {
  unitSystem: UnitSystem;
  ageYears?: number;
  sex?: string;
  heightCm?: number;
  weightKg?: number;
  activityMultiplier?: number;
  goalType?: GoalType;
  goalRateKgPerWeek?: number | null;
  macroPresetId?: string | null;
  proteinGPerKg?: number | null;
}

export interface NutritionGoalHistoryRecord {
  id: number;
  goalType: GoalType;
  activityLevel?: ActivityLevel | null;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  createdAt: string;

  targets: NutritionGoals;

  // Wizard/calculation snapshot fields (optional while API is mid-migration)
  ageYears?: number | null;
  sex?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  activityMultiplier?: number | null;
  goalRateKgPerWeek?: number | null;
  macroPresetId?: string | null;
  proteinGPerKg?: number | null;
  bmrCalories?: number | null;
  tdeeCalories?: number | null;
  recommendedTargets?: Record<string, unknown> | null;
  wasManuallyOverridden?: boolean | null;
  calorieAdjustmentStrategy?: string | null;
  inputUnitSystem?: UnitSystem | null;
  wizardInputs?: Record<string, unknown> | null;
}

export type CheckinPhotoKey = 'front' | 'back' | 'left' | 'right';

export type BodyCheckinPhotos = Partial<Record<CheckinPhotoKey, string>>;

export interface BodyCheckin {
  id: number;
  userId: string;
  goalId?: number | null;
  checkInDate: string;

  weightKg: number;
  inputUnitSystem?: UnitSystem | null;
  rawWeight?: Record<string, unknown> | null;

  photos?: BodyCheckinPhotos | null;
  skinfoldsMm?: Record<string, number> | null;
  notes?: string | null;
  createdAt: string;
}
