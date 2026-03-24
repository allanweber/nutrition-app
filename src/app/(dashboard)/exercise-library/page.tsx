import { Dumbbell } from 'lucide-react';
import { CreateExerciseButton } from '@/components/create-action-buttons';

export default function ExerciseLibraryPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      <div className="mb-8">
        <h1 className="text-4xl font-headline font-bold text-foreground">Exercise Library</h1>
        <p className="text-on-surface-variant mt-1">Your personal exercise and workout catalog</p>
      </div>

      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-surface-container flex items-center justify-center">
          <Dumbbell className="h-8 w-8 text-on-surface-variant/40" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No exercises yet</h2>
        <p className="text-sm text-on-surface-variant max-w-sm">
          Add exercises to your library to track workouts and monitor calories burned alongside your nutrition.
        </p>
        <div className="mt-2">
          <CreateExerciseButton />
        </div>
      </div>
    </div>
  );
}
