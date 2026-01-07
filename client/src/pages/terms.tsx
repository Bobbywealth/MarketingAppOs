import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { HeaderLogo, FooterLogo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const COMPANY_LEGAL_NAME = "WolfpaqMarketing LLC DBA Marketing Team App";
const CONTACT_EMAIL = "business@marketingteam.app";
const LAST_UPDATED = "January 7, 2026";

export default function TermsOfServicePage() {
  useDocumentMeta({
    title: "Terms of Service",
    description: `Terms of Service for ${COMPANY_LEGAL_NAME}. By using Marketing Team App, you agree to these terms.`,
    canonical: "https://www.marketingteam.app/terms",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-x-hidden">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <HeaderLogo />
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Terms of Service
            </h1>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Company:</span> {COMPANY_LEGAL_NAME} · <span className="font-medium">Last updated:</span> {LAST_UPDATED}
            </p>
          </div>

          <Card className="shadow-2xl border-0">
            <CardContent className="p-6 md:p-10 space-y-8 text-sm leading-7 text-slate-700">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Agreement to Terms</h2>
                <p>
                  These Terms of Service (“Terms”) govern your access to and use of the Marketing Team App and related Services
                  operated by {COMPANY_LEGAL_NAME} (“Company”, “we”, “us”, “our”). By accessing or using the Services, you agree
                  to be bound by these Terms.
                </p>
                <p>
                  If you are using the Services on behalf of an organization, you represent and warrant that you have authority to
                  bind that organization, and “you” refers to that organization.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Accounts and Eligibility</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>You must provide accurate information and keep your account information up to date.</li>
                  <li>You are responsible for maintaining the confidentiality of your credentials and for all activity under your account.</li>
                  <li>You may not use the Services for unlawful, harmful, or abusive activities.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Subscriptions, Billing, and Cancellations</h2>
                <p>
                  Some features may require a paid subscription. Prices, billing intervals, and included features will be described at
                  the time of purchase. Taxes may apply.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Payments are processed by third-party payment processors.</li>
                  <li>Subscriptions may renew automatically unless cancelled in accordance with the subscription terms presented at checkout.</li>
                  <li>We may change pricing or plan features with notice as required by law.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Acceptable Use</h2>
                <p>You agree not to:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Reverse engineer, decompile, or attempt to discover source code or underlying ideas of the Services.</li>
                  <li>Interfere with or disrupt the integrity or performance of the Services.</li>
                  <li>Use the Services to send spam, malware, or engage in deceptive marketing practices.</li>
                  <li>Access the Services in a way intended to avoid fees, limits, or restrictions.</li>
                  <li>Violate applicable laws or third-party rights (including privacy and intellectual property rights).</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Your Content</h2>
                <p>
                  You retain ownership of content you submit to the Services (“Your Content”). You grant us a limited license to host,
                  process, transmit, and display Your Content solely as necessary to provide and improve the Services.
                </p>
                <p>
                  You represent that you have all rights necessary to upload or use Your Content and that Your Content does not violate
                  any laws or third-party rights.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Intellectual Property</h2>
                <p>
                  The Services, including software, design, text, graphics, and trademarks, are owned by the Company or its licensors
                  and are protected by applicable laws. Except as expressly permitted, no rights are granted to you.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Third-Party Services</h2>
                <p>
                  The Services may integrate or link to third-party services. We are not responsible for third-party services and your
                  use of them may be governed by their terms and policies.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Disclaimers</h2>
                <p>
                  THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE”. TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES,
                  EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Limitation of Liability</h2>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT WILL THE COMPANY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR
                  USE OF THE SERVICES.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Indemnification</h2>
                <p>
                  You agree to indemnify and hold harmless the Company from and against claims, liabilities, damages, losses, and expenses
                  (including reasonable attorneys’ fees) arising from your use of the Services or violation of these Terms.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Termination</h2>
                <p>
                  We may suspend or terminate your access to the Services at any time if we reasonably believe you have violated these Terms
                  or if necessary to protect the Services, users, or third parties.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Governing Law</h2>
                <p>
                  These Terms are governed by the laws of the jurisdiction in which the Company is organized, without regard to conflict-of-law
                  principles, except where prohibited by applicable law.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Changes to These Terms</h2>
                <p>
                  We may update these Terms from time to time. If we make material changes, we will update the “Last updated” date above and may
                  provide additional notice as required by law.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Contact</h2>
                <p>
                  Questions about these Terms? Email{" "}
                  <a className="text-blue-700 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
                <p className="text-slate-600">
                  Also see our{" "}
                  <Link href="/privacy" className="text-blue-700 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="bg-gray-900 text-white py-12 mt-16">
        <div className="container mx-auto px-4 text-center flex flex-col items-center">
          <Link href="/">
            <FooterLogo className="mx-auto mb-4 cursor-pointer" />
          </Link>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Marketing Team App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}


