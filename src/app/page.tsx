import { getCurrentUser } from '@/lib/session';
import { redirect } from 'next/navigation';
import {
  Navbar,
  Hero,
  SocialProof,
  FeaturesGrid,
  ForIndividuals,
  ForProfessionals,
  Pricing,
  FinalCTA,
  Footer,
  ScrollToTop,
} from '@/components/landing';
import { SearchSection } from '@/components/landing/search-section';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getCurrentUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <SearchSection />
      <SocialProof />
      <FeaturesGrid />
      <ForIndividuals />
      <ForProfessionals />
      <Pricing />
      <FinalCTA />
      <Footer />
      <ScrollToTop />
    </main>
  );
}
