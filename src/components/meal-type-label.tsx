import { Badge } from '@/components/ui/badge';
import { MEAL_TYPE_COLORS } from '@/lib/nutrition-constants';

export function MealTypeLabel({ mealType }: { mealType: string }) {
  return (
    <Badge
      variant="secondary"
      className={MEAL_TYPE_COLORS[mealType] ?? 'bg-muted text-muted-foreground'}
    >
      {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
    </Badge>
  );
}
