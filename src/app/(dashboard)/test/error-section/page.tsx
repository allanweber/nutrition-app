'use client';

/**
 * Test-only page: renders a SectionErrorBoundary in its error state.
 *
 * Used by E2E tests to verify the error UI (Story 3, scenario 2) without
 * needing to mock server-side RSC streaming.  Gated to non-production
 * environments so it never ships in a real build.
 */

import { notFound } from 'next/navigation';
import { SectionErrorBoundary } from '@/components/dashboard/shared/section-error-boundary';
import { BentoCell } from '@/components/dashboard/shared/bento-cell';

function ThrowingSection(): never {
  throw new Error('Intentional test error: section data unavailable');
}

function StableSection() {
  return (
    <BentoCell className="min-h-[200px] flex items-center justify-center">
      <p className="text-sm font-semibold text-foreground" data-testid="stable-section">
        Stable section — unaffected by sibling error
      </p>
    </BentoCell>
  );
}

export default function TestErrorSectionPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="space-y-6 py-6">
      <h1 className="text-3xl font-headline font-extrabold text-foreground">
        Error Boundary Test
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* This section always errors — tests the error UI */}
        <SectionErrorBoundary minHeight="min-h-[200px]">
          <ThrowingSection />
        </SectionErrorBoundary>

        {/* This section is stable — tests that siblings are unaffected */}
        <SectionErrorBoundary minHeight="min-h-[200px]">
          <StableSection />
        </SectionErrorBoundary>
      </div>
    </div>
  );
}
