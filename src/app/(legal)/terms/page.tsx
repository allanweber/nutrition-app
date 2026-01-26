'use client';

export default function TermsPage() {
  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated:{' '}
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 mb-8">
          <p className="text-muted-foreground leading-relaxed">
            By accessing and using NutritionTracker, you accept and agree to be
            bound by terms and provision of this agreement. If you do not agree
            to abide by the above, please do not use this service.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using NutritionTracker, you accept and agree to
              be bound by the terms and provisions of this agreement. If you do
              not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              NutritionTracker is a nutrition tracking and analysis platform
              that allows users to:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-muted-foreground ml-4">
              <li>Track daily food intake and nutritional information</li>
              <li>Set and monitor nutrition goals</li>
              <li>Analyze nutritional trends through charts and insights</li>
              <li>Access a comprehensive food database</li>
              <li>Sync data across multiple devices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              3. User Accounts
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  3.1 Registration
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  You must provide accurate, current, and complete information
                  as prompted by our registration form. You are solely
                  responsible for maintaining the confidentiality of your
                  account and password.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  3.2 Account Security
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  You are responsible for all activities that occur under your
                  account. You must notify us immediately of any unauthorized
                  use of your account.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              4. Privacy and Data Protection
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Your privacy is important to us. Please review our Privacy Policy,
              which also governs your use of the Service, to understand our
              practices.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              By using NutritionTracker, you consent to the collection and use
              of your nutritional data as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              5. User Content
            </h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  5.1 Your Rights
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  You retain ownership of all content you submit to the service.
                  You grant us a license to use, modify, and display your
                  content solely for the purpose of providing our service.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  5.2 Your Responsibilities
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  You are responsible for the accuracy of your nutritional data
                  and for ensuring your content does not violate any laws or
                  regulations.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              6. Prohibited Uses
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You may not use our service for any unlawful purposes or in any
              way that could damage, disable, or impair the service.
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>Submitting false or misleading nutritional information</li>
              <li>Attempting to gain unauthorized access to our systems</li>
              <li>
                Using the service for commercial purposes without proper
                licensing
              </li>
              <li>Interfering with or disrupting the service to other users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              7. Service Availability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We strive to maintain the service but do not guarantee that our
              service will be uninterrupted or error-free. The service is
              provided &quot;as is&quot; without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              8. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              In no event shall NutritionTracker, its directors, employees,
              partners, agents, suppliers, or affiliates be liable for any
              indirect, incidental, special, consequential, or punitive damages,
              including without limitation, loss of profits, data, use,
              goodwill, or other intangible losses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              9. Termination
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and bar access to the
              service immediately, without prior notice or liability, under our
              sole discretion, for any reason whatsoever and without limitation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify or replace these Terms of Service
              at any time. If a revision is material, we will provide at least
              30 days notice prior to any new terms taking effect.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">
              11. Contact Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Questions about the Terms of Service should be sent to us at{' '}
              <button
                onClick={() => handleEmailClick('legal@nutritiontracker.com')}
                className="text-primary hover:underline cursor-pointer"
              >
                legal@nutritiontracker.com
              </button>
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            By using NutritionTracker, you acknowledge that you have read,
            understood, and agree to be bound by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
