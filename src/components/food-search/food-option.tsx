'use client';
import type { NutritionSourceFood } from '@/lib/nutrition-sources/types';
import { MacroBadges, MacroRow } from './macro-badges';
import { Per100g } from './types';
import Image from 'next/image';

// function SelectedFoodPanel(props: {
//   food: NutritionSourceFood;
//   isBusy?: boolean;
//   actionLabel?: string;
//   onCancel: () => void;
//   onConfirm: () => void;
//   onChange?: (selection: FoodSelection) => void;
//   onServingSelectOpenChange?: (open: boolean) => void;
// }) {
//   const {
//     food,
//     isBusy = false,
//     actionLabel = 'Add to Log',
//     onCancel,
//     onConfirm,
//     onChange,
//     onServingSelectOpenChange,
//   } = props;

//   const { options, defaultId } = useMemo(
//     () => buildServingOptions(food),
//     [food],
//   );

//   const [selectedOptionId, setSelectedOptionId] = useState<string>(defaultId);
//   const selectedOption = useMemo(
//     () => options.find((o) => o.id === selectedOptionId) ?? options[0],
//     [options, selectedOptionId],
//   );

//   const [grams, setGrams] = useState<number>(() =>
//     safeGrams(selectedOption?.grams),
//   );

//   useEffect(() => {
//     setSelectedOptionId(defaultId);
//   }, [defaultId]);

//   useEffect(() => {
//     setGrams(safeGrams(selectedOption?.grams));
//   }, [selectedOptionId, selectedOption?.grams]);

//   const baseServingGrams =
//     Number.isFinite(food.servingWeightGrams) &&
//     (food.servingWeightGrams ?? 0) > 0
//       ? food.servingWeightGrams!
//       : 100;

//   const selectedUnitGrams = selectedOption?.grams ?? baseServingGrams;
//   const maxUnits = Math.max(
//     1,
//     Math.floor(500 / Math.max(1, selectedUnitGrams)) || 1,
//   );
//   const unitCount = Math.max(
//     1,
//     Math.min(maxUnits, Math.round(grams / Math.max(1, selectedUnitGrams))),
//   );

//   const multiplier = baseServingGrams > 0 ? grams / baseServingGrams : 1;

//   const macros: MacroSummary = useMemo(
//     () => ({
//       calories: Math.round(asNumber(food.calories) * multiplier),
//       fat: roundTo(asNumber(food.fat) * multiplier, 1),
//       carbs: roundTo(asNumber(food.carbs) * multiplier, 1),
//       protein: roundTo(asNumber(food.protein) * multiplier, 1),
//       fiber:
//         food.fiber != null
//           ? roundTo(asNumber(food.fiber) * multiplier, 1)
//           : undefined,
//       sugar:
//         food.sugar != null
//           ? roundTo(asNumber(food.sugar) * multiplier, 1)
//           : undefined,
//       sodium:
//         food.sodium != null
//           ? Math.round(asNumber(food.sodium) * multiplier)
//           : undefined,
//     }),
//     [
//       food.calories,
//       food.carbs,
//       food.fat,
//       food.fiber,
//       food.protein,
//       food.sodium,
//       food.sugar,
//       multiplier,
//     ],
//   );

//   const quantityValue = computeQuantityFromGrams({
//     grams,
//     servingWeightGrams: selectedOption?.grams ?? baseServingGrams,
//     servingQty: selectedOption?.qty ?? 1,
//   });

//   const selection: FoodSelection = useMemo(
//     () => ({
//       grams,
//       servingUnit: selectedOption?.measure ?? food.servingUnit,
//       quantity: String(roundTo(quantityValue, 2)),
//       macros,
//       servingLabel:
//         selectedOption?.label ?? `${food.servingQty} ${food.servingUnit}`,
//     }),
//     [
//       food.servingQty,
//       food.servingUnit,
//       grams,
//       macros,
//       quantityValue,
//       selectedOption?.label,
//       selectedOption?.measure,
//     ],
//   );

//   useEffect(() => {
//     onChange?.(selection);
//   }, [onChange, selection]);

//   const canSeeFood =
//     (food.source === 'fatsecret' && food.sourceId.trim().length > 0) ||
//     (typeof food.id === 'number' && Number.isFinite(food.id));

//   const foodDetailsHref = (() => {
//     if (food.source === 'fatsecret' && food.sourceId.trim().length > 0) {
//       return `/food/${encodeURIComponent(food.sourceId)}`;
//     }
//     if (typeof food.id === 'number' && Number.isFinite(food.id)) {
//       return `/food/${encodeURIComponent(`db-${food.id}`)}`;
//     }
//     return null;
//   })();

//   const brandName = food.brandName?.trim();

//   return (
//     <div className="p-3">
//       <div className="min-w-0">
//         <div className="truncate text-2xl font-semibold text-foreground">
//           {food.name}
//         </div>
//         {brandName ? (
//           <div className="truncate text-xs text-muted-foreground">
//             {brandName}
//           </div>
//         ) : null}
//       </div>

//       <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-[340px_1fr]">

//         <div className="space-y-4">
//           <div className="space-y-1">
//             <label className="block text-xs font-medium text-foreground">
//               Serving
//             </label>
//             <Select
//               value={selectedOptionId}
//               onValueChange={(value) => setSelectedOptionId(value)}
//               onOpenChange={onServingSelectOpenChange}
//             >
//               <SelectTrigger className="h-9 w-full text-sm">
//                 <SelectValue placeholder="Select" />
//               </SelectTrigger>
//               <SelectContent>
//                 {options.map((o) => (
//                   <SelectItem key={o.id} value={o.id}>
//                     {o.label} ({Math.round(o.grams)}g)
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div className="space-y-1">
//             <div className="flex flex-nowrap items-center gap-2 text-xs">
//               <span className="font-medium text-foreground">Serving size</span>
//               <Input
//                 type="number"
//                 min={1}
//                 step={1}
//                 value={String(grams)}
//                 onChange={(e) => setGrams(safeGrams(e.target.value))}
//                 className="h-8 w-[72px] text-sm"
//                 aria-label="Serving size in grams"
//                 data-testid="serving-grams-input"
//               />
//               <span className="text-muted-foreground">g</span>
//               <span className="min-w-0 truncate text-muted-foreground">
//                 ({Math.round(selectedOption?.grams ?? baseServingGrams)}g ={' '}
//                 {selectedOption?.label})
//               </span>
//             </div>
//           </div>

//           <div>
//             <div className="flex items-center gap-2 text-xs text-muted-foreground">
//               <span className="w-7">1x</span>
//               <input
//                 type="range"
//                 min={1}
//                 max={maxUnits}
//                 step={1}
//                 value={String(unitCount)}
//                 onChange={(e) => {
//                   const nextUnits = Math.max(
//                     1,
//                     Math.min(maxUnits, Math.round(asNumber(e.target.value))),
//                   );
//                   setGrams(safeGrams(nextUnits * selectedUnitGrams));
//                 }}
//                 className="w-full flex-1"
//                 aria-label="Serving size slider"
//               />
//               <span className="w-10 text-right">{maxUnits}x</span>
//             </div>
//           </div>

//           <div className="text-xs text-muted-foreground">
//             Will log {selection.quantity} × {selection.servingUnit}
//           </div>

//           <div className="flex gap-2 pt-2">
//             <Button
//               type="button"
//               variant="outline"
//               className="flex-1"
//               onClick={onCancel}
//               disabled={isBusy}
//             >
//               Cancel
//             </Button>
//             <Button
//               type="button"
//               onClick={onConfirm}
//               disabled={isBusy}
//               className="flex-1"
//               data-testid="add-food-button"
//             >
//               {isBusy ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Working...
//                 </>
//               ) : (
//                 <>
//                   <Plus className="mr-2 h-4 w-4" />
//                   {actionLabel}
//                 </>
//               )}
//             </Button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

const toPer100g = (food: NutritionSourceFood): Per100g | null => {
    const grams = food.servingWeightGrams;
    if (!grams || grams <= 0) return null;
    const factor = 100 / grams;

    return {
      calories: Number(food.calories) * factor,
      protein: Number(food.protein) * factor,
      carbs: Number(food.carbs) * factor,
      fat: Number(food.fat) * factor,
      sodium: food.sodium != null ? Number(food.sodium) * factor : undefined,
    };
  };

export function FoodOption({
  food,
  index,
  selectFood,
}: {
  food: NutritionSourceFood;
  index: number;
  selectFood: (food: NutritionSourceFood) => void;
}) {
  const p100 = toPer100g(food);

  const macros: MacroRow = {
    calories: p100 ? p100.calories : Number(food.calories),
    protein: p100 ? p100.protein : Number(food.protein),
    carbs: p100 ? p100.carbs : Number(food.carbs),
    fat: p100 ? p100.fat : Number(food.fat),
  };

  const subtitle = (() => {
    const brandName = food.brandName?.trim();
    const servingLabel = p100
      ? '100 g'
      : `${food.servingQty ?? 1}${food.servingUnit ? ` ${food.servingUnit}` : ''}`;

    if (brandName) return `${brandName} · ${servingLabel}`;
    if (p100) return servingLabel;
    return `per serving · ${servingLabel}`;
  })();

  return (
    <>
      <button
        id={`food-option-${food.source}-${food.sourceId}`}
        type="button"
        role="option"
        data-testid={`food-result-${index}`}
        className="w-full mb-1 rounded-lg p-3 text-left transition-colors hover:bg-muted/80"
      >
        <div className="grid grid-cols-[44px_1fr] gap-4">
          <div className="flex flex-col items-center justify-center">
            {food.photo?.thumb ? (
              <Image
                src={food.photo.thumb}
                alt={food.name}
                className="h-11 w-11 rounded object-cover"
                loading="lazy"
                width={44}
                height={44}
              />
            ) : (
              <div className="h-11 w-11 rounded bg-muted" />
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">
              {food.name}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {subtitle}
            </div>
            <MacroBadges macros={macros} />
          </div>
        </div>
      </button>
    </>
  );
}
