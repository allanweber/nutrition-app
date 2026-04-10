'use client';

import {
  Armchair,
  ChevronLeft,
  Dumbbell,
  Flame,
  Footprints,
  Leaf,
  Scale,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useNutritionGoals } from '@/hooks/use-nutrition-goals';
import { MACRO_HEX_COLORS } from '@/lib/nutrition-constants';
import type { ActivityLevel, GoalType } from '@/types/goals';
import { Button } from './ui/button';

// ─── Types ────────────────────────────────────────────────────────────────────

type Sex = 'male' | 'female';
type MacroPreset = 'balanced' | 'high_protein' | 'low_carb' | 'keto';
type UnitSystem = 'metric' | 'imperial';

interface WizardState {
  unitSystem: UnitSystem;
  age: number;
  sex: Sex;
  weightKg: number;
  heightCm: number;
  goalType: GoalType;
  activityLevel: ActivityLevel;
  macroPreset: MacroPreset;
}

interface CalcResults {
  bmr: number;
  tdee: number;
  targetCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  hydrationMl: number;
  fiber: number;
  sodium: number;
  strategy: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  extra_active: 1.9,
};

const CALORIE_ADJUSTMENTS: Partial<Record<GoalType, number>> = {
  weight_loss: -500,
  fat_loss: -500,
  maintenance: 0,
  muscle_gain: 300,
  weight_gain: 300,
};

// Protein g/kg factor and fat % of calories per preset × goal combination
// protein_gPerKg: grams of protein per kg bodyweight
// fat_ratio: fraction of total calories from fat
const MACRO_PRESETS: Record<
  MacroPreset,
  { proteinGPerKg: number; fatRatio: number }
> = {
  balanced: { proteinGPerKg: 1.4, fatRatio: 0.3 },
  high_protein: { proteinGPerKg: 2.0, fatRatio: 0.25 },
  low_carb: { proteinGPerKg: 1.6, fatRatio: 0.4 },
  keto: { proteinGPerKg: 1.6, fatRatio: 0.7 },
};

const STRATEGY_LABELS: Partial<Record<GoalType, string>> = {
  weight_loss: 'Moderate Deficit for Fat Loss',
  fat_loss: 'Moderate Deficit for Fat Loss',
  maintenance: 'Balanced Maintenance',
  muscle_gain: 'Lean Bulk for Muscle Growth',
  weight_gain: 'Caloric Surplus for Weight Gain',
};

// ─── Unit conversion helpers ──────────────────────────────────────────────────

function kgToLbs(kg: number) {
  return Math.round(kg * 2.20462);
}
function lbsToKg(lbs: number) {
  return lbs / 2.20462;
}
function cmToFtIn(cm: number) {
  const totalIn = cm / 2.54;
  const ft = Math.floor(totalIn / 12);
  const ins = Math.round(totalIn % 12);
  return { ft, in: ins };
}
function ftInToCm(ft: number, inches: number) {
  return (ft * 12 + inches) * 2.54;
}

// ─── BMR/TDEE calculation ─────────────────────────────────────────────────────

function calculate(state: WizardState): CalcResults {
  const { weightKg, heightCm, age, sex, activityLevel, goalType, macroPreset } =
    state;
  const bmr =
    10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
  const tdee = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  const adjustment = CALORIE_ADJUSTMENTS[goalType] ?? 0;
  const targetCalories = Math.round(tdee + adjustment);
  const preset = MACRO_PRESETS[macroPreset];
  // Protein: weight-based (g/kg), Fat: % of calories, Carbs: remainder
  const protein = Math.round(weightKg * preset.proteinGPerKg);
  const fat = Math.round((targetCalories * preset.fatRatio) / 9);
  const carbsCalories = targetCalories - protein * 4 - fat * 9;
  const carbs = Math.max(0, Math.round(carbsCalories / 4));
  const hydrationMl = Math.round(weightKg * 35); // ~35ml/kg
  const fiber = Math.round((targetCalories / 1000) * 14); // 14g per 1000 kcal
  const sodium = 2300; // standard ≤2300 mg/day
  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetCalories,
    protein,
    carbs,
    fat,
    hydrationMl,
    fiber,
    sodium,
    strategy: STRATEGY_LABELS[goalType] ?? 'Personalized Plan',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

const DEFAULT_STATE: WizardState = {
  unitSystem: 'metric',
  age: 25,
  sex: 'male',
  weightKg: 75,
  heightCm: 170,
  goalType: 'maintenance',
  activityLevel: 'moderate',
  macroPreset: 'balanced',
};

interface GoalWizardModalProps {
  open: boolean;
  onClose: () => void;
}

export function GoalWizardModal({ open, onClose }: GoalWizardModalProps) {
  const router = useRouter();
  const { updateGoals } = useNutritionGoals();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(DEFAULT_STATE);
  const [results, setResults] = useState<CalcResults | null>(null);
  const [saving, setSaving] = useState(false);
  const [macroAdj, setMacroAdj] = useState<{
    proteinPct: number;
    carbsPct: number;
    fatPct: number;
  } | null>(null);

  // Imperial display values
  const displayWeightLbs = kgToLbs(state.weightKg);
  const displayHeightFtIn = cmToFtIn(state.heightCm);

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setState((prev) => ({ ...prev, [key]: value }));
  }

  function handleWeightChange(raw: number) {
    if (state.unitSystem === 'imperial') {
      update('weightKg', lbsToKg(raw));
    } else {
      update('weightKg', raw);
    }
  }

  function handleHeightChange(raw: number, field?: 'ft' | 'in') {
    if (state.unitSystem === 'imperial') {
      if (field === 'ft') {
        update('heightCm', ftInToCm(raw, displayHeightFtIn.in));
      } else {
        update('heightCm', ftInToCm(displayHeightFtIn.ft, raw));
      }
    } else {
      update('heightCm', raw);
    }
  }

  function goTo(s: number) {
    setStep(s);
  }
  function goBack() {
    if (step > 0) goTo(step - 1);
  }

  function handleCalculate() {
    const calc = calculate(state);
    setResults(calc);
    setMacroAdj(null); // initialized lazily when user opens step 7
    goTo(6);
  }

  function openAdjustMacros() {
    if (!results) return;
    if (!macroAdj) {
      const totalCals = results.targetCalories;
      const pPct = Math.round(((results.protein * 4) / totalCals) * 100);
      const fPct = Math.round(((results.fat * 9) / totalCals) * 100);
      const cPct = 100 - pPct - fPct;
      setMacroAdj({ proteinPct: pPct, carbsPct: cPct, fatPct: fPct });
    }
    goTo(7);
  }

  // Adjust one macro %, redistribute remainder proportionally between the other two
  function adjustMacro(
    key: 'proteinPct' | 'carbsPct' | 'fatPct',
    newVal: number,
  ) {
    setMacroAdj((prev) => {
      if (!prev) return prev;
      const clamped = Math.min(95, Math.max(5, newVal));
      const other = (['proteinPct', 'carbsPct', 'fatPct'] as const).filter(
        (k) => k !== key,
      );
      const oldOtherTotal = prev[other[0]] + prev[other[1]];
      const remaining = 100 - clamped;
      let a: number, b: number;
      if (oldOtherTotal === 0) {
        a = Math.round(remaining / 2);
        b = remaining - a;
      } else {
        a = Math.round((remaining * prev[other[0]]) / oldOtherTotal);
        b = remaining - a;
      }
      return { ...prev, [key]: clamped, [other[0]]: a, [other[1]]: b };
    });
  }

  // Compute macros from adjustment percentages (calories-locked)
  function getAdjustedMacros() {
    if (!results || !macroAdj) return null;
    const { targetCalories } = results;
    const protein = Math.round(
      (targetCalories * macroAdj.proteinPct) / 100 / 4,
    );
    const fat = Math.round((targetCalories * macroAdj.fatPct) / 100 / 9);
    const carbs = Math.round((targetCalories * macroAdj.carbsPct) / 100 / 4);
    return { protein, carbs, fat };
  }

  async function handleSave() {
    if (!results) return;
    setSaving(true);
    const adjusted = getAdjustedMacros();
    try {
      await updateGoals({
        calories: results.targetCalories,
        protein: adjusted?.protein ?? results.protein,
        carbs: adjusted?.carbs ?? results.carbs,
        fat: adjusted?.fat ?? results.fat,
        fiber: results.fiber,
        hydration: results.hydrationMl,
        sodium: results.sodium,
        goalType: state.goalType,
        activityLevel: state.activityLevel,
        // Wizard snapshot fields
        ageYears: state.age,
        sex: state.sex,
        heightCm: state.heightCm,
        weightKg: state.weightKg,
        activityMultiplier: ACTIVITY_MULTIPLIERS[state.activityLevel],
        bmrCalories: results.bmr,
        tdeeCalories: results.tdee,
        macroPresetId: state.macroPreset,
        inputUnitSystem: state.unitSystem,
        wizardInputs: { ...state },
      } as Parameters<typeof updateGoals>[0]);
      onClose();
      router.push('/dashboard');
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    onClose();
    setTimeout(() => {
      setStep(0);
      setState(DEFAULT_STATE);
      setResults(null);
      setMacroAdj(null);
    }, 300);
  }

  const totalSteps = 5;
  const showProgress = step >= 1 && step <= 5;
  const progressPct = (step / totalSteps) * 100;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleClose();
      }}
    >
      <DialogContent className="max-w-lg p-0 gap-0 border-0 rounded-[2.5rem] shadow-2xl shadow-primary/10 overflow-hidden sm:rounded-[2.5rem]">
        <DialogTitle className="sr-only">Goal Calculator</DialogTitle>
        {/* Progress bar */}
        {showProgress && (
          <div className="px-5 pt-4 pb-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-widest text-primary">
                Step {step} of {totalSteps}
              </span>
              <button
                type="button"
                onClick={goBack}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm font-bold"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="p-5">
          {/* ── Step 0: Splash ── */}
          {step === 0 && (
            <div className="text-center space-y-5">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl md:text-3xl font-headline font-extrabold tracking-tight">
                  Let&apos;s personalize your nutrition plan
                </h1>
                <p className="text-sm text-muted-foreground font-medium max-w-md mx-auto">
                  Take a quick moment to discover the perfect fuel for your
                  unique body and lifestyle.
                </p>
              </div>
              <Button
                onClick={() => goTo(1)}
                variant="default"
                size="lg"
                className="w-full"
              >
                Start My Journey
              </Button>
            </div>
          )}

          {/* ── Step 1: Personal Info ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h2 className="text-xl font-headline font-extrabold">
                    Tell us a bit about yourself
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    We use these details to find your perfect daily balance.
                  </p>
                </div>
                {/* Unit toggle */}
                <div className="flex gap-1 shrink-0 ml-4 border border-border rounded-lg p-0.5">
                  {(['metric', 'imperial'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => update('unitSystem', u)}
                      className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${
                        state.unitSystem === u
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {u === 'metric' ? 'kg / cm' : 'lbs / ft'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Age */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Age
                  </label>
                  <input
                    type="number"
                    value={state.age}
                    onChange={(e) =>
                      update('age', parseInt(e.target.value, 10) || 25)
                    }
                    placeholder="25"
                    min={1}
                    max={120}
                    className="w-full bg-muted border-none rounded-lg px-4 py-2 text-base font-bold focus:ring-2 focus:ring-primary/10 transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                {/* Sex */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Gender
                  </label>
                  <div className="flex gap-2">
                    {(['male', 'female'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => update('sex', s)}
                        className={`flex-1 py-2 border-2 rounded-lg font-semibold text-sm transition-all capitalize ${
                          state.sex === s
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-border/30 hover:border-primary/40'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Weight */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      Current Weight
                    </label>
                    <span className="text-base font-bold text-primary">
                      {state.unitSystem === 'metric'
                        ? `${Math.round(state.weightKg)} kg`
                        : `${displayWeightLbs} lbs`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={state.unitSystem === 'metric' ? 40 : 88}
                    max={state.unitSystem === 'metric' ? 200 : 440}
                    value={
                      state.unitSystem === 'metric'
                        ? Math.round(state.weightKg)
                        : displayWeightLbs
                    }
                    onChange={(e) =>
                      handleWeightChange(parseFloat(e.target.value))
                    }
                    className="w-full h-2 rounded-full accent-primary cursor-pointer"
                  />
                </div>

                {/* Height */}
                <div className="md:col-span-2 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                      Height
                    </label>
                    <span className="text-base font-bold text-primary">
                      {state.unitSystem === 'metric'
                        ? `${Math.round(state.heightCm)} cm`
                        : `${displayHeightFtIn.ft}ft ${displayHeightFtIn.in}in`}
                    </span>
                  </div>
                  {state.unitSystem === 'metric' ? (
                    <input
                      type="range"
                      min={140}
                      max={220}
                      value={Math.round(state.heightCm)}
                      onChange={(e) =>
                        handleHeightChange(parseFloat(e.target.value))
                      }
                      className="w-full h-2 rounded-full accent-primary cursor-pointer"
                    />
                  ) : (
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <input
                          type="range"
                          min={4}
                          max={7}
                          value={displayHeightFtIn.ft}
                          onChange={(e) =>
                            handleHeightChange(
                              parseInt(e.target.value, 10),
                              'ft',
                            )
                          }
                          className="w-full h-2 rounded-full accent-primary cursor-pointer"
                        />
                        <p className="text-xs text-center text-muted-foreground mt-1">
                          feet
                        </p>
                      </div>
                      <div className="flex-1">
                        <input
                          type="range"
                          min={0}
                          max={11}
                          value={displayHeightFtIn.in}
                          onChange={(e) =>
                            handleHeightChange(
                              parseInt(e.target.value, 10),
                              'in',
                            )
                          }
                          className="w-full h-2 rounded-full accent-primary cursor-pointer"
                        />
                        <p className="text-xs text-center text-muted-foreground mt-1">
                          inches
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Button
                onClick={() => goTo(2)}
                variant="default"
                size="lg"
                className="w-full"
              >
                Continue
              </Button>
            </div>
          )}

          {/* ── Step 2: Main Goal ── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1 text-center">
                <h2 className="text-xl font-headline font-extrabold">
                  What&apos;s your main goal?
                </h2>
                <p className="text-muted-foreground text-sm">
                  Focusing on one goal helps us create a clearer map for your
                  progress.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {(
                  [
                    {
                      value: 'weight_loss',
                      label: 'Lose weight',
                      desc: 'Sustainable fat loss with vibrant energy.',
                      Icon: Target,
                    },
                    {
                      value: 'maintenance',
                      label: 'Maintain weight',
                      desc: 'Fuel your lifestyle and feel your best.',
                      Icon: Scale,
                    },
                    {
                      value: 'muscle_gain',
                      label: 'Gain muscle',
                      desc: 'Build strength and lean muscle mass.',
                      Icon: Dumbbell,
                    },
                  ] as const
                ).map(({ value, label, desc, Icon }) => {
                  const selected = state.goalType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update('goalType', value)}
                      className={`relative flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all text-left ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border/30 hover:border-primary hover:bg-primary/5'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 shrink-0 transition-colors ${
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{label}</h3>
                        <p className="text-xs text-muted-foreground font-medium">
                          {desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => goTo(3)}
                variant="default"
                size="lg"
                className="w-full"
              >
                Next
              </Button>
            </div>
          )}

          {/* ── Step 3: Activity Level ── */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-headline font-extrabold">
                  How active is your lifestyle?
                </h2>
                <p className="text-muted-foreground text-sm">
                  Understanding your daily movement helps us find your calorie
                  sweet spot.
                </p>
              </div>

              <div className="space-y-2">
                {(
                  [
                    {
                      value: 'sedentary',
                      label: 'Sedentary',
                      desc: 'Desk job, little intentional exercise',
                      Icon: Armchair,
                    },
                    {
                      value: 'light',
                      label: 'Lightly Active',
                      desc: 'Active hobby, 1–3 workouts/week',
                      Icon: Footprints,
                    },
                    {
                      value: 'moderate',
                      label: 'Moderately Active',
                      desc: 'Moving often, 3–5 workouts/week',
                      Icon: Zap,
                    },
                    {
                      value: 'active',
                      label: 'Very Active',
                      desc: 'Daily training, physically demanding job',
                      Icon: Flame,
                    },
                    {
                      value: 'extra_active',
                      label: 'Extra Active',
                      desc: 'Athlete-level training twice a day',
                      Icon: Trophy,
                    },
                  ] as const
                ).map(({ value, label, desc, Icon }) => {
                  const selected = state.activityLevel === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update('activityLevel', value)}
                      className={`w-full p-3 border-2 rounded-xl text-left flex items-center gap-3 transition-all ${
                        selected
                          ? 'border-primary bg-primary/5'
                          : 'border-border/30 hover:border-primary/40'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          selected
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p
                          className={`font-semibold text-sm ${selected ? 'text-primary' : ''}`}
                        >
                          {label}
                        </p>
                        <p className="text-xs text-muted-foreground">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => goTo(4)}
                variant="default"
                size="lg"
                className="w-full"
              >
                Almost there!
              </Button>
            </div>
          )}

          {/* ── Step 4: Preferences ── */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h2 className="text-xl font-headline font-extrabold">
                  Any personal preferences?
                </h2>
                <p className="text-muted-foreground text-sm">
                  Choose a style that feels natural and sustainable for you.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { value: 'high_protein', label: 'High Protein' },
                    { value: 'balanced', label: 'Balanced' },
                    { value: 'low_carb', label: 'Low Carb' },
                    { value: 'keto', label: 'Keto' },
                  ] as const
                ).map(({ value, label }) => {
                  const selected = state.macroPreset === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => update('macroPreset', value)}
                      className={`p-3 border-2 rounded-xl font-semibold text-sm transition-all ${
                        selected
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border/30 hover:border-primary/40'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Visual toggles (UI only) */}
              <div className="pt-3 space-y-3 border-t border-border/20">
                {['Vegetarian / Vegan', 'Low Sodium focus'].map((label) => (
                  <div
                    key={label}
                    className="flex items-center justify-between"
                  >
                    <span className="font-medium text-sm">{label}</span>
                    <div className="w-12 h-6 bg-muted rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-background rounded-full shadow-sm" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button onClick={() => goTo(5)} variant="outline" size="lg" className="flex-1">
                  Skip
                </Button>
                <Button
                  onClick={() => goTo(5)}
                  variant="default"
                  size="lg"
                  className="flex-1"
                >
                  Review Plan
                </Button>
              </div>
            </div>
          )}

          {/* ── Step 5: Review Summary ── */}
          {step === 5 && (
            <div className="space-y-4 text-center">
              <div className="space-y-1">
                <h2 className="text-xl font-headline font-extrabold">
                  Ready for your results?
                </h2>
                <p className="text-muted-foreground text-sm">
                  We&apos;ve gathered everything we need to build your custom
                  path.
                </p>
              </div>

              <div className="bg-muted rounded-2xl p-4 text-left space-y-3">
                {(
                  [
                    {
                      Icon: Target,
                      label: 'Your Goal',
                      value: state.goalType.replace(/_/g, ' '),
                      valueClass: 'text-primary',
                    },
                    {
                      Icon: Zap,
                      label: 'Activity',
                      value: state.activityLevel.replace(/_/g, ' '),
                      valueClass: '',
                    },
                    {
                      Icon: Scale,
                      label: 'Details',
                      value: `${state.age}y, ${Math.round(state.weightKg)}kg`,
                      valueClass: '',
                    },
                    {
                      Icon: Leaf,
                      label: 'Preference',
                      value: state.macroPreset.replace(/_/g, ' '),
                      valueClass: '',
                    },
                  ] as const
                ).map(({ Icon, label, value, valueClass }, i, arr) => (
                  <div
                    key={label}
                    className={`flex justify-between items-center ${i < arr.length - 1 ? 'border-b border-border/20 pb-4' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-primary/60" />
                      <span className="text-muted-foreground font-medium">
                        {label}
                      </span>
                    </div>
                    <span
                      className={`font-semibold uppercase tracking-wider ${valueClass}`}
                    >
                      {value}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleCalculate}
                variant="default"
                  size="lg"
                  className='w-full'
              >
                Calculate my plan
              </Button>
            </div>
          )}

          {/* ── Step 6: Results ── */}
          {step === 6 && results && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-black uppercase tracking-widest">
                  <Star className="w-3 h-3" /> Personalized for you
                </div>
                <h2 className="text-2xl font-headline font-black">
                  Your Custom Daily Plan
                </h2>
              </div>

              {/* Calorie hero */}
              <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 text-center">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/70">
                  Estimated Daily Energy
                </span>
                <div className="flex items-baseline justify-center gap-2 mt-1">
                  <span className="text-5xl font-headline font-black tracking-tighter">
                    {results.targetCalories.toLocaleString('en-US')}
                  </span>
                  <span className="text-lg font-bold text-muted-foreground">
                    kcal
                  </span>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 text-primary font-semibold bg-white px-4 py-1 rounded-full shadow-sm border border-primary/5 text-xs">
                  {results.strategy}
                </div>
              </div>

              {/* Macro distribution */}
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    {
                      key: 'protein',
                      label: 'Protein',
                      g: getAdjustedMacros()?.protein ?? results.protein,
                      color: MACRO_HEX_COLORS.protein,
                      desc: 'Muscle repair.',
                    },
                    {
                      key: 'carbs',
                      label: 'Carbs',
                      g: getAdjustedMacros()?.carbs ?? results.carbs,
                      color: MACRO_HEX_COLORS.carbs,
                      desc: 'Fuel for energy.',
                    },
                    {
                      key: 'fat',
                      label: 'Fats',
                      g: getAdjustedMacros()?.fat ?? results.fat,
                      color: MACRO_HEX_COLORS.fat,
                      desc: 'Hormone balance.',
                    },
                  ] as const
                ).map(({ key, label, g, color, desc }) => {
                  const calsPer = key === 'fat' ? 9 : 4;
                  const pct = Math.round(
                    ((g * calsPer) / results.targetCalories) * 100,
                  );
                  return (
                    <div
                      key={key}
                      className="p-3 rounded-xl bg-white border border-border/30 shadow-sm flex flex-col items-center text-center"
                    >
                      <div
                        className="w-9 h-9 rounded-full border-4 flex items-center justify-center mb-2"
                        style={{ borderColor: `${color}33` }}
                      >
                        <span
                          className="text-[9px] font-black"
                          style={{ color }}
                        >
                          {pct}%
                        </span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {label}
                      </span>
                      <div className="text-xl font-black">{g}g</div>
                      <p className="text-[9px] mt-1 text-muted-foreground leading-tight">
                        {desc}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Info tiles */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <span className="text-blue-600 text-sm">💧</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Hydration
                    </span>
                    <span className="text-base font-black">
                      {(results.hydrationMl / 1000).toFixed(1)} L
                    </span>
                  </div>
                </div>
                <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                    <span className="text-emerald-600 text-sm">🌿</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Fiber
                    </span>
                    <span className="text-base font-black">
                      {results.fiber} g
                    </span>
                  </div>
                </div>
                <div className="bg-muted rounded-xl p-3 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0">
                    <span className="text-orange-600 text-sm">🧂</span>
                  </div>
                  <div>
                    <span className="block text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                      Sodium
                    </span>
                    <span className="text-base font-black">
                      {results.sodium} mg
                    </span>
                  </div>
                </div>
              </div>

              {/* CTAs */}
              <div className="space-y-2">
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  variant="default"
                  size="lg"
                  className='w-full'
                >
                  {saving ? 'Saving...' : 'Start Tracking My Plan'}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={openAdjustMacros}
                  >
                    Adjust Macros
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => goTo(4)}
                  >
                    Refine My Plan
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      goTo(0);
                      setState(DEFAULT_STATE);
                      setResults(null);
                      setMacroAdj(null);
                    }}
                  >
                    Start Over
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 7: Adjust Macros ── */}
          {step === 7 && results && macroAdj && (
            <div className="space-y-5">
              <div className="space-y-0.5">
                <h2 className="text-xl font-headline font-black">
                  Fine-tune Your Macros
                </h2>
                <p className="text-sm text-muted-foreground">
                  Drag to adjust. Total calories stay at{' '}
                  {results.targetCalories.toLocaleString('en-US')} kcal.
                </p>
              </div>

              <div className="space-y-4">
                {(
                  [
                    {
                      key: 'proteinPct',
                      label: 'Protein',
                      pct: macroAdj.proteinPct,
                      color: MACRO_HEX_COLORS.protein,
                      calsPerG: 4,
                    },
                    {
                      key: 'carbsPct',
                      label: 'Carbs',
                      pct: macroAdj.carbsPct,
                      color: MACRO_HEX_COLORS.carbs,
                      calsPerG: 4,
                    },
                    {
                      key: 'fatPct',
                      label: 'Fat',
                      pct: macroAdj.fatPct,
                      color: MACRO_HEX_COLORS.fat,
                      calsPerG: 9,
                    },
                  ] as const
                ).map(({ key, label, pct, color, calsPerG }) => {
                  const grams = Math.round(
                    (results.targetCalories * pct) / 100 / calsPerG,
                  );
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-sm font-semibold">{label}</span>
                        </div>
                        <div className="flex items-baseline gap-1.5">
                          <span
                            className="text-xl font-black"
                            style={{ color }}
                          >
                            {pct}%
                          </span>
                          <span className="text-sm text-muted-foreground font-medium">
                            {grams} g
                          </span>
                        </div>
                      </div>
                      <input
                        type="range"
                        min={5}
                        max={95}
                        step={1}
                        value={pct}
                        onChange={(e) =>
                          adjustMacro(key, Number(e.target.value))
                        }
                        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-muted"
                        style={{ accentColor: color }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Total check */}
              <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/30 pt-3">
                <span>Total</span>
                <span className="font-black">
                  {macroAdj.proteinPct + macroAdj.carbsPct + macroAdj.fatPct}% ·{' '}
                  {results.targetCalories.toLocaleString('en-US')} kcal
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => goTo(6)}
                  className="flex-1 py-3 rounded-xl border-2 border-border/30 text-sm font-semibold hover:bg-muted transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => goTo(6)}
                  className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-md shadow-primary/20 transition-all hover:scale-[1.02]"
                >
                  Apply Changes
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
