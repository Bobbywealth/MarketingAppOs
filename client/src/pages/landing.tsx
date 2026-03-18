import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { SubscriptionPackage } from "@shared/schema";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Hero } from "@/components/landing/Hero";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const SocialProof = lazy(() => import("@/components/landing/SocialProof"));
const Services = lazy(() => import("@/components/landing/Services"));
const AuditForm = lazy(() => import("@/components/landing/AuditForm"));
const Pricing = lazy(() => import("@/components/landing/Pricing"));
const Testimonials = lazy(() => import("@/components/landing/Testimonials"));
const FAQ = lazy(() => import("@/components/landing/FAQ"));
const Footer = lazy(() => import("@/components/landing/Footer"));

function SectionSkeleton() {
  return <div className="container mx-auto px-4 py-16 animate-pulse"><div className="h-8 w-48 bg-muted rounded mb-4" /><div className="h-5 w-full bg-muted rounded" /></div>;
}

export default function LandingPage() {
  const { toast } = useToast();
  const pricingRef = useRef<HTMLElement | null>(null);
  const [auditForm, setAuditForm] = useState({ website: "", instagramUrl: "", tiktokUrl: "", facebookUrl: "" });

  useDocumentMeta({
    title: "Marketing Team App | Your Remote Digital Marketing Team",
    description: "Stop wasting money on marketing that doesn't work. Get a remote digital marketing team.",
    ogImage: "https://www.marketingteam.app/icon-512x512.png",
    ogType: "website",
    twitterCard: "summary_large_image",
  });

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify({ "@context": "https://schema.org", "@type": "Organization", name: "Marketing Team App", url: window.location.origin });
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  const { data: packages = [], isLoading: packagesLoading } = useQuery<SubscriptionPackage[]>({
    queryKey: ["/api/subscription-packages"],
    queryFn: async () => (await apiRequest("GET", "/api/subscription-packages")).json(),
    staleTime: 10 * 60 * 1000,
  });

  const auditMutation = useMutation({
    mutationFn: async (data: typeof auditForm) => (await apiRequest("POST", "/api/social-audit", data)).json(),
    onSuccess: () => toast({ title: "🎉 Audit Complete!", description: "Your social media audit results are ready." }),
    onError: () => toast({ title: "❌ Audit Failed", description: "Something went wrong. Please try again.", variant: "destructive" }),
  });

  const onAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!auditForm.website) {
      toast({ title: "⚠️ Website Required", description: "Please enter your website URL.", variant: "destructive" });
      return;
    }
    auditMutation.mutate(auditForm);
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <AnimatedBackground />
      <Hero />

      <Suspense fallback={<SectionSkeleton />}><SocialProof /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><Services /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><AuditForm value={auditForm} onChange={setAuditForm} onSubmit={onAuditSubmit} isSubmitting={auditMutation.isPending} /></Suspense>
      <section ref={pricingRef}>
        <Suspense fallback={<SectionSkeleton />}><Pricing packages={packages} isLoading={packagesLoading} /></Suspense>
      </section>
      <Suspense fallback={<SectionSkeleton />}><Testimonials /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><FAQ /></Suspense>
      <Suspense fallback={<SectionSkeleton />}><Footer /></Suspense>
    </div>
  );
}
