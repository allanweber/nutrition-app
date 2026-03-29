'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GoalsForm } from '@/components/forms/goals-form';
import { Target } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

export default function GoalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        overline="Targets"
        title="Nutrition Goals"
        subtitle="Set your daily nutrition targets to track your progress"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Nutrition Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalsForm />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goal Calculator</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <Target className="h-12 w-12 text-primary mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">
                    Use our calculator to get personalized recommendations based
                    on your age, gender, weight, and activity level.
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  Open Calculator
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Start with realistic goals</li>
                <li>Track consistently for best results</li>
                <li>Adjust goals based on your progress</li>
                <li>Consult a professional for personalized advice</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
