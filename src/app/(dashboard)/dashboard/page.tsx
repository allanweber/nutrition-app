import { getCurrentUser } from '@/lib/session';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Track your nutrition and achieve your health goals
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Calories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">
              No food logged today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Protein
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0g</div>
            <p className="text-xs text-muted-foreground">
              of daily goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Carbs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0g</div>
            <p className="text-xs text-muted-foreground">
              of daily goal
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0g</div>
            <p className="text-xs text-muted-foreground">
              of daily goal
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link
              href="/foods/search"
              className="block w-full rounded-lg border p-4 text-center hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Search Foods</div>
              <div className="text-sm text-gray-600">
                Find nutrition information for any food
              </div>
            </Link>
            <Link
              href="/food-log"
              className="block w-full rounded-lg border p-4 text-center hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Log Food</div>
              <div className="text-sm text-gray-600">
                Add foods to today's log
              </div>
            </Link>
            <Link
              href="/goals"
              className="block w-full rounded-lg border p-4 text-center hover:bg-gray-50 transition-colors"
            >
              <div className="font-medium">Set Goals</div>
              <div className="text-sm text-gray-600">
                Update your nutrition targets
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-gray-500 py-8">
              No recent food logs
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}