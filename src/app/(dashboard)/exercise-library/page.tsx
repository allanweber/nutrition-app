import { Dumbbell } from 'lucide-react';
import { CreateExerciseButton } from '@/components/create-action-buttons';
import { PageHeader } from '@/components/page-header';

export default function ExerciseLibraryPage() {
  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
      <PageHeader
        overline="My Library"
        title="Exercise Library"
        subtitle="Your personal exercise and workout catalog"
      >
        <CreateExerciseButton />
      </PageHeader>

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
