import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrandStep } from "@/components/signup/BrandStep";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Form } from "@/components/ui/form";

const brandAssetsSchema = z.object({
  brandAssets: z.object({
    primaryColor: z.string().optional(),
    secondaryColor: z.string().optional(),
    logoUrl: z.string().optional(),
    brandVoice: z.string().optional(),
    notes: z.string().optional(),
  })
});

export default function PostPaymentOnboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState<"brand" | "done">("brand");

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ["/api/clients", user?.clientId],
    enabled: !!user?.clientId,
  });

  const form = useForm({
    resolver: zodResolver(brandAssetsSchema),
    defaultValues: {
      brandAssets: {
        primaryColor: "#3B82F6",
        secondaryColor: "#6366F1",
        logoUrl: "",
        brandVoice: "",
        notes: "",
      }
    }
  });

  const updateBrandMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PATCH", `/api/clients/${user?.clientId}`, {
        brandAssets: data.brandAssets,
        requiresBrandInfo: false, // Mark as completed
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Brand profile updated!",
        description: "Your team now has the info they need to start creating.",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Check if brand info is needed
  const needsBrandInfo = client?.requiresBrandInfo;

  useEffect(() => {
    if (!clientLoading && client && !needsBrandInfo) {
      setLocation("/");
    }
  }, [client, clientLoading, needsBrandInfo, setLocation]);

  if (clientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const onSubmit = (data: any) => {
    updateBrandMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4">
            <Sparkles className="w-4 h-4" />
            Phase 4: Conditional Onboarding
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4">Tell Us About Your Brand</h1>
          <p className="text-slate-500 font-medium">
            Since you selected content services, we need a few details to match your brand's vibe.
            <br />
            <span className="text-xs text-slate-400 font-bold uppercase">(You can skip this and do it later in the dashboard)</span>
          </p>
        </div>

        <Card className="border-0 shadow-2xl rounded-[2rem] overflow-hidden ring-1 ring-slate-200">
          <div className="p-8 md:p-12">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <BrandStep form={form} />
                
                <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setLocation("/")}
                    className="h-14 rounded-xl font-bold text-slate-500"
                  >
                    Skip for now
                  </Button>
                  
                  <Button
                    type="submit"
                    disabled={updateBrandMutation.isPending}
                    className="h-14 px-12 rounded-xl font-black text-lg bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                  >
                    {updateBrandMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Finish & Go to Dashboard
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </Card>
      </div>
    </div>
  );
}

