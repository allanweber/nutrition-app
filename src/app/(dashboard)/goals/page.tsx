import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, Activity } from 'lucide-react';

export default async function GoalsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  const handleSaveGoals = async (formData: FormData) => {
    'use server';
    
    const goals = {
      goalType: formData.get('goalType'),
      targetCalories: formData.get('targetCalories'),
      targetProtein: formData.get('targetProtein'),
      targetCarbs: formData.get('targetCarbs'),
      targetFat: formData.get('targetFat'),
      activityLevel: formData.get('activityLevel'),
    };

    console.log('Saving goals:', goals);
    // TODO: Implement goals saving logic
  };

  // TODO: Fetch user's current goals
  const currentGoals = {
    goalType: 'maintenance',
    targetCalories: '2000',
    targetProtein: '150',
    targetCarbs: '250',
    targetFat: '65',
    activityLevel: 'moderate',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Nutrition Goals
        </h1>
        <p className="text-gray-600">
          Set your daily nutrition targets to track your progress
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Daily Nutrition Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <form action={handleSaveGoals} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="goalType">Goal Type</Label>
                    <Select name="goalType" defaultValue={currentGoals.goalType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weight_loss">Weight Loss</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="weight_gain">Weight Gain</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="activityLevel">Activity Level</Label>
                    <Select name="activityLevel" defaultValue={currentGoals.activityLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select activity level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary</SelectItem>
                        <SelectItem value="light">Light Activity</SelectItem>
                        <SelectItem value="moderate">Moderate Activity</SelectItem>
                        <SelectItem value="active">Very Active</SelectItem>
                        <SelectItem value="extra_active">Extra Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="targetCalories">Target Calories</Label>
                      <Input
                        id="targetCalories"
                        name="targetCalories"
                        type="number"
                        defaultValue={currentGoals.targetCalories}
                        placeholder="2000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetProtein">Target Protein (g)</Label>
                      <Input
                        id="targetProtein"
                        name="targetProtein"
                        type="number"
                        defaultValue={currentGoals.targetProtein}
                        placeholder="150"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetCarbs">Target Carbs (g)</Label>
                      <Input
                        id="targetCarbs"
                        name="targetCarbs"
                        type="number"
                        defaultValue={currentGoals.targetCarbs}
                        placeholder="250"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetFat">Target Fat (g)</Label>
                      <Input
                        id="targetFat"
                        name="targetFat"
                        type="number"
                        defaultValue={currentGoals.targetFat}
                        placeholder="65"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Save Goals</Button>
                </div>
              </form>
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
                  <Target className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <div className="text-sm text-gray-600">
                    Use our calculator to get personalized recommendations based on your age, gender, weight, and activity level.
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
              <CardTitle>Progress Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Current Streak</span>
                  </div>
                  <span className="font-semibold">0 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Goals Met This Week</span>
                  </div>
                  <span className="font-semibold">0/7</span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">0%</div>
                  <div className="text-sm text-gray-500">Goals achieved this month</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Start with realistic goals</li>
                <li>• Track consistently for best results</li>
                <li>• Adjust goals based on your progress</li>
                <li>• Consult a professional for personalized advice</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}