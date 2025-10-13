import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle, Star, TrendingUp, Globe, Smartphone, Palette, Brain, CreditCard } from "lucide-react";
import mtaLogo from "@assets/mta-logo.png";
import heroImage from "@assets/stock_images/marketing_analytics__1be1259a.jpg";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={mtaLogo} alt="Marketing Team App" className="h-12 w-auto" data-testid="img-logo" />
            <span className="text-xl font-bold">Marketing Team</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" data-testid="button-login-header">Login</Button>
            </Link>
            <Link href="/login">
              <Button className="gap-2 bg-orange-500 hover:bg-orange-600 text-white" data-testid="button-get-started-header">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(59,130,246,0.3),transparent_50%)]"></div>
        <div className="container mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white space-y-6">
              <Badge className="bg-orange-500 hover:bg-orange-600 text-white border-0 animate-pulse">
                Wolfpaq Marketing
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold leading-tight">
                Your Remote <br />
                Digital Marketing <br />
                <span className="text-green-400">Team</span>
              </h1>
              <p className="text-lg text-blue-100">
                The best solution for your business and scale up to success in digital business.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link href="/login">
                  <Button size="lg" className="gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0" data-testid="button-get-started-hero">
                    Discover more
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20" data-testid="button-login-hero">
                    Client Login
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="relative animate-float">
                <div className="absolute top-10 right-10 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 left-10 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl"></div>
                <img 
                  src={heroImage} 
                  alt="Marketing Dashboard Analytics" 
                  className="relative z-10 w-full h-auto rounded-lg shadow-2xl transform hover:scale-105 transition-transform duration-500"
                  data-testid="img-hero-dashboard"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4 -mt-16 relative z-20">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 bg-white hover-elevate transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Digital Marketing</h3>
              <p className="text-sm text-muted-foreground">
                Ignite your brand's digital presence with our savvy digital marketing strategies.
              </p>
            </Card>
            <Card className="p-6 bg-white hover-elevate transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-orange-50 flex items-center justify-center mb-4">
                <Globe className="w-8 h-8 text-orange-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Web Development</h3>
              <p className="text-sm text-muted-foreground">
                Embark on a digital journey with our web wizards, crafting visually stunning websites.
              </p>
            </Card>
            <Card className="p-6 bg-white hover-elevate transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Smartphone className="w-8 h-8 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Mobile App</h3>
              <p className="text-sm text-muted-foreground">
                Transform your dreams into app reality with sleek, user-friendly mobile applications.
              </p>
            </Card>
            <Card className="p-6 bg-white hover-elevate transition-all duration-300 transform hover:-translate-y-1">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                <Palette className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Graphics Design</h3>
              <p className="text-sm text-muted-foreground">
                Unleash the power of visual storytelling with eye-catching designs.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2">About Us</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Navigate the digital landscape with Marketing Team App,<br />
              the epitome of sophistication in digital marketing services.
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              At Marketing Team App, we orchestrate strategies that seamlessly integrate innovation and financial impact, 
              ensuring your business stands at the forefront of digital success.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <Card className="p-8 text-center border-2 hover-elevate transition-all">
              <div className="text-5xl font-bold text-blue-600 mb-2">4.9+</div>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />
                ))}
              </div>
              <p className="text-sm font-semibold mb-1">Customer Review</p>
              <p className="text-xs text-muted-foreground">Trusted by over 1000 clients</p>
            </Card>

            <Card className="p-8 text-center border-2 hover-elevate transition-all">
              <div className="text-5xl font-bold text-blue-600 mb-2">A+</div>
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 fill-orange-500 text-orange-500" />
                ))}
              </div>
              <p className="text-sm font-semibold mb-1">Business Class</p>
              <p className="text-xs text-muted-foreground">Partnering with over 1,000 enterprises</p>
            </Card>

            <Card className="p-8 text-center border-2 hover-elevate transition-all">
              <div className="text-5xl font-bold text-blue-600 mb-2">15+</div>
              <p className="text-sm font-semibold mb-1">Years Experience</p>
              <p className="text-xs text-muted-foreground">Industry expertise</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Amplify Section - Blue Background */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 text-center">Amplify Your Brand's Impact</h2>
          <p className="text-lg text-blue-100 text-center max-w-3xl mx-auto mb-12">
            Let's give your brand a digital makeover! At Marketing Team App, we use smart strategies in Digital Marketing, 
            cool designs in Web Development and Graphics, and user-friendly Mobile Apps to make your brand shine online.
          </p>

          <div className="grid md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">60%+</div>
              <p className="text-blue-100">Hours of Expertise</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">90%+</div>
              <p className="text-blue-100">Retention Rate</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">31%+</div>
              <p className="text-blue-100">Average Traffic Increase</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold mb-2">7M+</div>
              <p className="text-blue-100">Calls Generated</p>
            </div>
          </div>

          <Card className="p-12 bg-white text-foreground">
            <div className="text-center">
              <h3 className="text-3xl font-bold mb-4">Your vision, our platform</h3>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                Join us in transforming ideas into digital excellence, and together, we'll rock the online world.
              </p>
              <Link href="/login">
                <Button size="lg" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </section>

      {/* Services Detailed */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-2">What We Offer</p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Helping you deliver a better customer experience
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: TrendingUp, title: "Digital Marketing", desc: "Elevate your online presence with strategic and result-driven solutions.", color: "red" },
              { icon: Globe, title: "Web Design & Development", desc: "Craft visually appealing and functional websites that resonate with your brand.", color: "orange" },
              { icon: Smartphone, title: "Mobile App Development", desc: "Transform ideas into reality with user-friendly and innovative mobile apps.", color: "blue" },
              { icon: Palette, title: "Graphic Design", desc: "Bring your brand to life with captivating visual elements and designs.", color: "green" },
              { icon: Brain, title: "AI Automation", desc: "Harness AI to streamline processes and enhance efficiency.", color: "purple" },
              { icon: CreditCard, title: "Payment Solution", desc: "Comprehensive payment solutions tailored to your business needs.", color: "indigo" },
            ].map((service, idx) => (
              <Card key={idx} className="p-6 hover-elevate transition-all duration-300 transform hover:-translate-y-1">
                <div className={`w-12 h-12 rounded-full bg-${service.color}-100 flex items-center justify-center mb-4`}>
                  <service.icon className={`w-6 h-6 text-${service.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{service.desc}</p>
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="gap-2 text-blue-600" data-testid={`button-learn-more-${idx}`}>
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
      <section className="py-20 px-4 bg-muted/50">
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
              <div key={idx} className="flex gap-4 p-6 rounded-lg bg-white hover-elevate transition-all">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Share Your Project Details!</h2>
          <p className="text-lg mb-8 text-blue-100">
            Initiate a conversation about your vision and goals with Marketing Team App, where our experts 
            are eager to discuss your project and tailor a strategy that aligns with your business objectives.
          </p>
          <Link href="/login">
            <Button size="lg" className="gap-2 bg-orange-500 hover:bg-orange-600 text-white border-0" data-testid="button-cta-get-started">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 bg-background">
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
                <li className="hover:text-primary transition-colors cursor-pointer">Digital Marketing</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Web Development</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Mobile App Development</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Graphic Design</li>
                <li className="hover:text-primary transition-colors cursor-pointer">AI Automation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/login" className="hover:text-primary transition-colors">Login</Link></li>
                <li className="hover:text-primary transition-colors cursor-pointer">About Us</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Contact Us</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="hover:text-primary transition-colors cursor-pointer">About us</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Leadership</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Careers</li>
                <li className="hover:text-primary transition-colors cursor-pointer">Legal Notice</li>
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
