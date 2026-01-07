import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { HeaderLogo, FooterLogo } from "@/components/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

const COMPANY_LEGAL_NAME = "WolfpaqMarketing LLC DBA Marketing Team App";
const CONTACT_EMAIL = "business@marketingteam.app";
const LAST_UPDATED = "January 7, 2026";

export default function PrivacyPolicyPage() {
  useDocumentMeta({
    title: "Privacy Policy",
    description: `Privacy Policy for ${COMPANY_LEGAL_NAME}. Learn what information we collect, how we use it, and your choices.`,
    canonical: "https://www.marketingteam.app/privacy",
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
              Privacy Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Company:</span> {COMPANY_LEGAL_NAME} · <span className="font-medium">Last updated:</span> {LAST_UPDATED}
            </p>
          </div>

          <Card className="shadow-2xl border-0">
            <CardContent className="p-6 md:p-10 space-y-8 text-sm leading-7 text-slate-700">
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Overview</h2>
                <p>
                  This Privacy Policy explains how {COMPANY_LEGAL_NAME} (“Company”, “we”, “us”, “our”) collects, uses, and
                  shares information when you visit or use our websites, products, and services (collectively, the “Services”),
                  including the Marketing Team App.
                </p>
                <p>
                  By using the Services, you agree to the collection and use of information as described in this Privacy Policy.
                  If you do not agree, please do not use the Services.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Information We Collect</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <span className="font-semibold text-slate-900">Account and profile information</span> (such as name, email, password
                    hash, company name, role, and settings).
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Customer support and communications</span> (messages you send to us, and
                    records of your interactions).
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Usage and device information</span> (such as pages viewed, features used,
                    log data, IP address, browser/device identifiers, and approximate location inferred from IP address).
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Content you provide</span> (such as files, marketing assets, posts, notes,
                    tasks, leads, and other data you enter into the Services).
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Payment and billing information</span> (handled by our payment processors;
                    we typically receive limited details like billing status and payment method type, not full card numbers).
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Cookies and similar technologies</span> used to operate the Services and remember
                    preferences. You can control cookies via your browser settings.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">How We Use Information</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Provide, maintain, and improve the Services.</li>
                  <li>Authenticate users, prevent fraud, and secure accounts.</li>
                  <li>Process transactions and manage subscriptions.</li>
                  <li>Respond to requests, questions, and provide support.</li>
                  <li>Send administrative messages (e.g., service updates, security notices).</li>
                  <li>Analyze usage to improve performance and user experience.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">SMS / Text Messaging (Twilio)</h2>
                <p>
                  The Services may support sending and receiving SMS/MMS messages. We use third-party providers (including Twilio) to deliver
                  text messages and to receive inbound replies.
                </p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <span className="font-semibold text-slate-900">What we collect</span>: mobile phone numbers, message content, delivery status,
                    timestamps, and routing metadata (e.g., sender/recipient numbers). If media is included, we may process associated media URLs.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">How we use it</span>: to send messages you request, facilitate conversations with
                    leads/contacts, provide account-related notifications (as applicable), and for support, troubleshooting, and recordkeeping.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Consent</span>: by providing a phone number or initiating SMS through the Services,
                    you represent that you have the necessary rights and permissions to do so. Where required by law, marketing/promotional texts
                    are sent only with the recipient’s prior express consent. Consent is not a condition of purchase.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Opt-out & help</span>: recipients can reply <span className="font-semibold">STOP</span>{" "}
                    to opt out of receiving further SMS from the sending number and <span className="font-semibold">HELP</span> for help. Message
                    frequency varies. Message and data rates may apply.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">How we share it</span>: we share phone numbers and message content with our SMS
                    delivery providers (such as Twilio) solely to provide messaging functionality. We do not sell phone numbers or message content.
                  </li>
                </ul>
                <p className="text-slate-600">
                  If you are an end recipient of messages sent using our Services and want to stop receiving messages, reply STOP as described above
                  and/or contact the sender directly.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">How We Share Information</h2>
                <p>We may share information in the following situations:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <span className="font-semibold text-slate-900">Service providers</span> who help us operate the Services (e.g., hosting,
                    analytics, email delivery, SMS/voice providers, payment processors). They are permitted to process data only
                    for providing services to us.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Legal and safety</span> when required by law, to protect rights and safety, or
                    to prevent fraud and abuse.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Business transfers</span> in connection with a merger, acquisition, financing,
                    or sale of assets, where information may be transferred as part of that transaction.
                  </li>
                </ul>
                <p className="text-slate-600">
                  We do not sell your personal information in the ordinary sense of the word.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Your Choices</h2>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <span className="font-semibold text-slate-900">Account settings</span>: You can update certain information in your account
                    settings (if available).
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Cookies</span>: Adjust your browser settings to refuse or delete cookies. Some
                    features may not work properly without cookies.
                  </li>
                  <li>
                    <span className="font-semibold text-slate-900">Email communications</span>: You may opt out of non-essential marketing emails
                    by following unsubscribe instructions in the email.
                  </li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Data Retention</h2>
                <p>
                  We retain information for as long as needed to provide the Services and for legitimate business purposes (such as
                  compliance, dispute resolution, and enforcement), unless a longer retention period is required or permitted by law.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Security</h2>
                <p>
                  We use reasonable administrative, technical, and organizational measures designed to protect information. No method
                  of transmission over the Internet or method of electronic storage is completely secure, so we cannot guarantee
                  absolute security.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Children’s Privacy</h2>
                <p>
                  The Services are not directed to children under 13 (or the age required by local law), and we do not knowingly
                  collect personal information from children.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Changes to this Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. If we make material changes, we will update the “Last updated”
                  date above and may provide additional notice as required by law.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-xl font-bold text-slate-900">Contact Us</h2>
                <p>
                  Questions about this Privacy Policy? Contact us at{" "}
                  <a className="text-blue-700 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
                <p className="text-slate-600">
                  Also see our{" "}
                  <Link href="/terms" className="text-blue-700 hover:underline">
                    Terms of Service
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


