import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import {
  Navbar,
  Hero,
  SocialProof,
  AppPreview,
  FeaturesGrid,
  ForIndividuals,
  ForProfessionals,
  HowItWorks,
  Testimonials,
  Pricing,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing';

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <SocialProof />
      <AppPreview />
      <FeaturesGrid />
      <ForIndividuals />
      <ForProfessionals />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
    </main>
  );
}
