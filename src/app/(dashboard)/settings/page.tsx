import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/page-header';

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        overline="Preferences"
        title="Settings"
        subtitle="Manage your application preferences"
      />

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Settings are being built out</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Notifications — email reminders and daily log alerts</li>
            <li>Privacy — data sharing and account visibility controls</li>
            <li>Data Export — download your food log history as CSV or PDF</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
