'use client';

export default function PrivacyPage() {
  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground">
            Last updated: {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        <div className="bg-primary/5 dark:bg-primary/10 rounded-xl p-6 mb-8">
          <p className="text-muted-foreground leading-relaxed">
            At NutritionTracker, we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, and protect your information when you use our nutrition tracking service.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Information We Collect</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">1.1 Personal Information</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  When you create an account, we collect:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Name and email address</li>
                  <li>Account preferences and settings</li>
                  <li>Device information and usage data</li>
                  <li>Authentication credentials (encrypted)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">1.2 Nutrition Data</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We collect information you voluntarily provide, including:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Daily food logs and quantities</li>
                  <li>Nutritional goals and targets</li>
                  <li>Meal timing and frequency</li>
                  <li>Physical activity information (if provided)</li>
                  <li>Weight and body measurements (if provided)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">1.3 Automatically Collected Data</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  Our service automatically collects:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>IP address and location information</li>
                  <li>Browser type and version</li>
                  <li>Device type and operating system</li>
                  <li>Pages visited and time spent</li>
                  <li>Error logs and crash reports</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. How We Use Your Information</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">2.1 Core Service Functions</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We use your information to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>Provide personalized nutrition tracking and analysis</li>
                  <li>Generate nutritional insights and recommendations</li>
                  <li>Track progress toward your health goals</li>
                  <li>Synchronize data across your devices</li>
                  <li>Authenticate and secure your account</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">2.2 Communication</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We may contact you about service updates, security notifications, and important account information.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">2.3 Improvement</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We analyze aggregated, anonymized data to improve our service, fix bugs, and develop new features.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Information Sharing</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">3.1 When We Share Information</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We may share your information in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
                  <li>With third-party food databases for accurate nutritional data</li>
                  <li>With service providers who help operate our service</li>
                  <li>When required by law or to protect our rights</li>
                  <li>With your explicit consent for specific purposes</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">3.2 What We Don't Share</h3>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  We never sell your personal information to third parties for marketing purposes.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Data Security</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              We implement appropriate security measures to protect your information:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-4">
              <li>256-bit SSL encryption for data transmission</li>
              <li>Encrypted storage of sensitive information</li>
              <li>Regular security audits and penetration testing</li>
              <li>Employee access controls and background checks</li>
              <li>Compliance with industry security standards</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Data Retention</h2>
            <p className="text-muted-foreground leading-relaxed">
              We retain your personal information only as long as necessary to provide the service and fulfill the purposes outlined in this privacy policy. You may request deletion of your account and data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Your Rights</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">6.1 Access and Correction</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You have the right to access, update, or correct your personal information at any time through your account settings.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">6.2 Data Portability</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You can request a copy of your data in a structured, machine-readable format.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">6.3 Deletion</h3>
                <p className="text-muted-foreground leading-relaxed">
                  You have the right to request deletion of your personal information. We will delete it within 30 days of your request.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Children's Privacy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If we become aware of such collection, we will take immediate steps to delete this information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. International Users</h2>
            <p className="text-muted-foreground leading-relaxed">
              Your personal information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information in accordance with applicable data protection laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <button
                onClick={() => handleEmailClick('privacy@nutritiontracker.com')}
                className="text-primary hover:underline cursor-pointer"
              >
                privacy@nutritiontracker.com
              </button>
            </p>
          </section>
        </div>

        <div className="mt-16 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground text-center">
            This Privacy Policy is effective as of the date stated above and governs your use of NutritionTracker.
          </p>
        </div>
      </div>
    </div>
  );
}
