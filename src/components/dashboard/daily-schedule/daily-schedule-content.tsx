'use client';

import Link from 'next/link';
import { Utensils, Cookie } from 'lucide-react';
import { type ScheduleEntry, type DailyScheduleDTO } from '@/server/services/dashboard.service';

interface TimeGroupCardProps {
  label: string;
  entries: ScheduleEntry[];
  iconBgClass: string;
}

function TimeGroupCard({ label, entries, iconBgClass }: TimeGroupCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Nothing logged yet</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center gap-3">
              <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${iconBgClass}`}>
                {entry.iconType === 'snack' ? (
                  <Cookie className="w-4 h-4 text-foreground/70" />
                ) : (
                  <Utensils className="w-4 h-4 text-foreground/70" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{entry.name}</p>
                <p className="text-xs text-muted-foreground">{entry.time}</p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-foreground/80">
                {entry.calories} kcal
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface DailyScheduleContentProps {
  morning: DailyScheduleDTO['morning'];
  midday: DailyScheduleDTO['midday'];
  evening: DailyScheduleDTO['evening'];
}

export function DailyScheduleContent({ morning, midday, evening }: DailyScheduleContentProps) {
  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-headline font-bold text-foreground">
            Daily Schedule
          </h2>
        </div>
        <Link
          href="/food-log"
          className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <TimeGroupCard label="Morning" entries={morning} iconBgClass="bg-primary/10" />
        <TimeGroupCard label="Midday" entries={midday} iconBgClass="bg-muted" />
        <TimeGroupCard label="Evening" entries={evening} iconBgClass="bg-secondary" />
      </div>
    </div>
  );
}
