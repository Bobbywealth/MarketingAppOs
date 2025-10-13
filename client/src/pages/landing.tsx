import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, CheckCircle, Star, TrendingUp, Globe, Smartphone, Palette, Brain, CreditCard } from "lucide-react";
import mtaLogo from "@assets/mta-logo.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={mtaLogo} alt="Marketing Team App" className="h-12 w-auto" data-testid="img-logo" />
            <span className="text-xl font-bold">Marketing Team App</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" data-testid="button-login-header">Login</Button>
            </Link>
            <Link href="/login">
              <Button className="gap-2" data-testid="button-get-started-header">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
            Your Remote Digital Marketing Team
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            The best solution for your business and scale up to success in digital business.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/login">
              <Button size="lg" className="gap-2" data-testid="button-get-started-hero">
                Get Started
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" data-testid="button-login-hero">
                Client Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6">
              <TrendingUp className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Digital Marketing</h3>
              <p className="text-sm text-muted-foreground">
                Ignite your brand's digital presence with our savvy digital marketing strategies.
              </p>
            </Card>
            <Card className="p-6">
              <Globe className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Web Development</h3>
              <p className="text-sm text-muted-foreground">
                Crafting visually stunning and seamlessly functional websites that scream sophistication.
              </p>
            </Card>
            <Card className="p-6">
              <Smartphone className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Mobile App</h3>
              <p className="text-sm text-muted-foreground">
                Transform your dreams into app reality with sleek, user-friendly mobile applications.
              </p>
            </Card>
            <Card className="p-6">
              <Palette className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Graphics Design</h3>
              <p className="text-sm text-muted-foreground">
                Create eye-catching designs that grab attention and convey your brand message.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">About Us</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Navigate the digital landscape with Marketing Team App
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              We orchestrate strategies that seamlessly integrate innovation and financial impact, 
              ensuring your business stands at the forefront of digital success.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Card className="p-8 text-center">
              <div className="text-5xl font-bold text-primary mb-2">4.9+</div>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="text-sm font-semibold mb-1">Customer Review</p>
              <p className="text-xs text-muted-foreground">Trusted by over 1000 clients</p>
            </Card>

            <Card className="p-8 text-center">
              <div className="text-5xl font-bold text-primary mb-2">15+</div>
              <p className="text-sm font-semibold mb-1">Years Experience</p>
              <p className="text-xs text-muted-foreground">Industry expertise</p>
            </Card>

            <Card className="p-8 text-center">
              <div className="text-5xl font-bold text-primary mb-2">98%</div>
              <p className="text-sm font-semibold mb-1">Retention Rate</p>
              <p className="text-xs text-muted-foreground">Client satisfaction</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Detailed */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">What We Offer</p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Helping you deliver a better customer experience
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Digital Marketing", desc: "Elevate your online presence with strategic and result-driven solutions." },
              { icon: Globe, title: "Web Design & Development", desc: "Craft visually appealing and functional websites that resonate with your brand." },
              { icon: Smartphone, title: "Mobile App Development", desc: "Transform ideas into reality with user-friendly and innovative mobile apps." },
              { icon: Palette, title: "Graphic Design", desc: "Bring your brand to life with captivating visual elements and designs." },
              { icon: Brain, title: "AI Automation", desc: "Harness AI to streamline processes and enhance efficiency." },
              { icon: CreditCard, title: "Payment Solution", desc: "Comprehensive payment solutions tailored to your business needs." },
            ].map((service, idx) => (
              <Card key={idx} className="p-6 hover-elevate transition-all">
                <service.icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{service.desc}</p>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="gap-2" data-testid={`button-learn-more-${idx}`}>
                    Learn more
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Getting you those real results</h2>
            <p className="text-lg text-muted-foreground">
              Delivering real results through expert services. Let's bring your vision to life!
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: "Proven Expertise", desc: "Seasoned professionals delivering tangible results in digital marketing." },
              { title: "Comprehensive Services", desc: "One-stop solution for all your digital needs." },
              { title: "Client-Centric Approach", desc: "Strategies tailored to align with your specific business objectives." },
              { title: "Innovation and Adaptability", desc: "Staying ahead in the competitive online environment." },
            ].map((item, idx) => (
              <div key={idx} className="flex gap-4">
                <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Share Your Project Details!</h2>
          <p className="text-lg mb-8 opacity-90">
            Initiate a conversation about your vision and goals with Marketing Team App, where our experts 
            are eager to discuss your project and tailor a strategy that aligns with your business objectives.
          </p>
          <Link href="/login">
            <Button size="lg" variant="secondary" className="gap-2" data-testid="button-cta-get-started">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <img src={mtaLogo} alt="Marketing Team App" className="h-12 w-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Navigate the digital landscape with Marketing Team App, the epitome of sophistication in digital marketing services.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>Digital Marketing</li>
                <li>Web Development</li>
                <li>Mobile App Development</li>
                <li>Graphic Design</li>
                <li>AI Automation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-primary transition-colors">Login</Link></li>
                <li>About Us</li>
                <li>Contact Us</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>About us</li>
                <li>Leadership</li>
                <li>Careers</li>
                <li>Legal Notice</li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            Copyright © 2025 Marketing Team App, All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
