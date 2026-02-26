import { Check, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

const pricingTiers = [
  {
    name: "Starter",
    price: "$499",
    period: "/mo",
    description: "Perfect for small teams and growing businesses.",
    features: [
      "Up to 5 team members",
      "10 active projects",
      "Basic analytics dashboard",
      "Email support",
      "1 GB storage",
      "API access",
    ],
    cta: "Get Started",
    href: "/contact",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$999",
    period: "/mo",
    description: "Ideal for scaling businesses that need more power.",
    features: [
      "Up to 20 team members",
      "Unlimited active projects",
      "Advanced analytics & reporting",
      "Priority email & chat support",
      "10 GB storage",
      "Full API access",
      "Custom integrations",
      "Automated workflows",
    ],
    cta: "Get Started",
    href: "/contact",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for large organizations.",
    features: [
      "Unlimited team members",
      "Unlimited projects & storage",
      "Dedicated account manager",
      "24/7 phone, email & chat support",
      "Custom analytics & reporting",
      "SSO & advanced security",
      "SLA guarantees",
      "On-premise deployment option",
    ],
    cta: "Contact Sales",
    href: "/contact",
    highlighted: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-background py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the plan that fits your business. No hidden fees, no
            surprises. Scale up or down at any time.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricingTiers.map((tier) => (
            <Card
              key={tier.name}
              className={`relative flex flex-col ${
                tier.highlighted
                  ? "border-primary shadow-lg scale-105"
                  : "border-border"
              }`}
            >
              {tier.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-sm font-semibold px-4 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold">{tier.name}</CardTitle>
                <CardDescription className="text-sm mt-1">
                  {tier.description}
                </CardDescription>
                <div className="mt-4 flex items-end gap-1">
                  <span className="text-4xl font-extrabold">{tier.price}</span>
                  {tier.period && (
                    <span className="text-muted-foreground mb-1">
                      {tier.period}
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex flex-col flex-1">
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={tier.href}>
                  <Button
                    className="w-full gap-2"
                    variant={tier.highlighted ? "default" : "outline"}
                  >
                    {tier.cta}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 text-muted-foreground text-sm">
          <p>
            All plans include a 14-day free trial. No credit card required.{" "}
            <Link href="/contact" className="text-primary underline underline-offset-4">
              Contact us
            </Link>{" "}
            if you have questions.
          </p>
        </div>
      </div>
    </div>
  );
}
