import { Suspense } from 'react';
import { FoodLogContent } from './food-log-content';

export default function FoodLogPage() {
  return (
    <Suspense>
      <FoodLogContent />
    </Suspense>
  );
}
