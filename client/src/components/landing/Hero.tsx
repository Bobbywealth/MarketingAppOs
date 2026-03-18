import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HeaderLogo } from "@/components/Logo";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { primaryNavLinks, serviceNavItems } from "./data/nav-items";
import heroImage from "@assets/hero-header-image.png";

export function Hero() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="border-b sticky top-0 z-50 bg-white/85 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/"><HeaderLogo /></Link>
          <nav className="hidden md:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Services</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="w-80 p-3 space-y-1">
                      {serviceNavItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <a key={item.id} href={`#${item.id}`} className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-accent">
                            <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${item.gradient} text-white flex items-center justify-center`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.description}</p>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
            {primaryNavLinks.slice(1).map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium hover:text-primary">{link.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/signup"><Button size="sm" className="hidden md:inline-flex">Get Started</Button></Link>
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild><Button variant="outline" size="icon" className="md:hidden"><Menu className="w-5 h-5" /></Button></SheetTrigger>
              <SheetContent>
                <div className="mt-8 space-y-3">
                  {primaryNavLinks.map((link) => <Link key={link.href} href={link.href} className="block text-lg font-semibold">{link.label}</Link>)}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <section className="py-14 md:py-24 px-4">
        <div className="container mx-auto grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Badge className="mb-4">The Future of Remote Marketing</Badge>
            <h1 className="text-4xl md:text-6xl font-black leading-tight">Your Digital Marketing Force</h1>
            <p className="mt-4 text-lg text-muted-foreground">Stop hiring freelancers. Scale with one elite remote marketing team.</p>
            <div className="mt-8 flex gap-3">
              <Link href="/signup"><Button size="lg">Get Started <ArrowRight className="w-4 h-4 ml-1" /></Button></Link>
              <Link href="/contact"><Button size="lg" variant="outline">Book a Call</Button></Link>
            </div>
          </div>
          <img src={heroImage} alt="Marketing dashboard" className="rounded-3xl shadow-2xl" loading="eager" fetchPriority="high" />
        </div>
      </section>
    </>
  );
}
