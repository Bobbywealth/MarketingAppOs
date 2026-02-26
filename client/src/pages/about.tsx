import { Link } from "wouter";
import { Users, Target, Award, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Target,
    title: "Results-Driven",
    description: "We measure everything. Every campaign, every strategy is tied to tangible business outcomes.",
  },
  {
    icon: Users,
    title: "Client-First",
    description: "Your success is our success. We build long-term partnerships, not just client lists.",
  },
  {
    icon: Award,
    title: "Excellence",
    description: "We stay ahead of trends and continuously improve our craft to deliver the best results.",
  },
  {
    icon: Heart,
    title: "Transparency",
    description: "No smoke and mirrors. You always know where your investment goes and what it achieves.",
  },
];

export default function About() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent cursor-pointer">
              MarketingTeam.app
            </span>
          </Link>
          <div className="flex gap-3">
            <Link href="/contact">
              <Button variant="outline">Contact Us</Button>
            </Link>
            <Link href="/auth">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About Us</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            We are a full-service digital marketing agency helping businesses grow through strategy, creativity, and technology.
          </p>
        </div>

        <section className="max-w-4xl mx-auto mb-20">
          <h2 className="text-2xl font-bold mb-6 text-center">Our Mission</h2>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            At Marketing Team App, we believe every business deserves access to enterprise-grade marketing tools and strategies. 
            Our platform combines the power of AI automation with hands-on expertise to deliver marketing solutions that drive real growth. 
            We partner with businesses of all sizes to create, execute, and optimize marketing campaigns that generate measurable results.
          </p>
        </section>

        <section className="mb-20">
          <h2 className="text-2xl font-bold mb-10 text-center">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-5_5xl mx-auto">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="text-center bg-primary/5 rounded-2xl p-12">
          <h2 className="text-2xl font-bold mb-4">Let's Work Together</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Ready to take your marketing to the next level? Book a free strategy call with our team.
          </p>
          <Link href="/contact">
            <Button size="lg">Book a Strategy Call</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
