import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';
import { PageHeader } from '@/components/page-header';
import { BiometricProfileForm } from '@/components/forms/biometric-profile-form';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-2">
      <PageHeader
        overline="Account"
        title="Biometric Profile"
        subtitle="Keep your physical metrics up to date for precise health calculations and personalized insights."
      />
      <BiometricProfileForm />
    </div>
  );
}
