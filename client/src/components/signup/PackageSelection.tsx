import { motion } from "framer-motion";
import { Target, ShieldCheck, Tag, CheckCircle2, Star, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UseMutationResult } from "@tanstack/react-query";

interface PackageSelectionProps {
  packages: any[];
  selectedPackage: string | null;
  setSelectedPackage: (id: string) => void;
  discountCode: string;
  setDiscountCode: (code: string) => void;
  validateDiscountCode: (code: string) => void;
  validDiscount: any;
  isValidatingDiscount: boolean;
  checkoutMutation: UseMutationResult<any, any, any>;
  onBack: () => void;
  formValues: any;
}

export function PackageSelection({
  packages,
  selectedPackage,
  setSelectedPackage,
  discountCode,
  setDiscountCode,
  validateDiscountCode,
  validDiscount,
  isValidatingDiscount,
  checkoutMutation,
  onBack,
  formValues
}: PackageSelectionProps) {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden p-4 md:p-8">
      {/* Animated Blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto py-12"
      >
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-black mb-6 shadow-xl shadow-blue-500/20"
          >
            <Target className="w-4 h-4" />
            FINAL STEP
          </motion.div>
          <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">
            Choose Your Package
          </h1>
          <p className="text-xl text-slate-600 mb-4 max-w-2xl mx-auto font-medium">
            Select the perfect marketing accelerator to scale your brand. No hidden fees, cancel anytime.
          </p>
          <div className="flex items-center justify-center gap-4 mt-8">
            <div className="flex -space-x-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200" />
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />)}
              </div>
              <p className="text-xs font-black text-slate-900">JOIN 500+ SCALE-UPS</p>
            </div>
          </div>
        </div>

        {/* Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {packages && Array.isArray(packages) && packages.length > 0 ? packages.map((pkg: any, idx: number) => {
            const platformCount = formValues.selectedPlatforms?.length || 0;
            const isSocialManagement = formValues.services?.includes("Social Media Management");
            
            // Logic to recommend package based on platform count
            let isRecommendedByCount = false;
            if (isSocialManagement) {
              if (platformCount <= 2 && pkg.name.includes("Gold")) isRecommendedByCount = true;
              else if (platformCount === 3 && pkg.name.includes("Business")) isRecommendedByCount = true;
              else if (platformCount === 4 && pkg.name.includes("Digital Domination")) isRecommendedByCount = true;
              else if (platformCount >= 5 && pkg.name.includes("Brand Takeover")) isRecommendedByCount = true;
            } else if (pkg.isFeatured) {
              isRecommendedByCount = true;
            }

            // Check if package supports the selected platform count
            let platformLimit = 0;
            if (pkg.name.includes("Gold")) platformLimit = 2;
            else if (pkg.name.includes("Business")) platformLimit = 3;
            else if (pkg.name.includes("Digital Domination")) platformLimit = 4;
            else if (pkg.name.includes("Brand Takeover")) platformLimit = 6;

            const isBelowLimit = isSocialManagement && platformCount > platformLimit;

            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card 
                  className={`relative border-0 h-full cursor-pointer transition-all duration-500 rounded-[2.5rem] overflow-hidden flex flex-col group ${
                    selectedPackage === pkg.id 
                      ? 'ring-4 ring-blue-500 shadow-[0_32px_64px_-16px_rgba(37,99,235,0.2)] scale-105 z-10' 
                      : 'hover:shadow-2xl hover:scale-[1.02] shadow-xl bg-white/80 backdrop-blur-sm'
                  } ${isBelowLimit ? 'opacity-60 grayscale-[0.5]' : ''}`}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  {(pkg.isFeatured || isRecommendedByCount) && (
                    <div className="absolute top-6 right-6">
                      <Badge className={`${isRecommendedByCount ? 'bg-blue-600' : 'bg-gradient-to-r from-orange-500 to-pink-500'} text-white border-0 px-4 py-1.5 font-black rounded-full shadow-lg`}>
                        {isRecommendedByCount ? 'BEST MATCH' : 'POPULAR'}
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-black text-slate-900">{pkg.name}</CardTitle>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-5xl font-black text-slate-900 tracking-tighter">
                        ${(pkg.price / 100).toFixed(0)}
                      </span>
                      <span className="text-slate-500 font-bold">/mo</span>
                    </div>
                    <CardDescription className="mt-4 font-medium leading-relaxed">{pkg.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="p-8 pt-4 flex-1">
                    <Separator className="mb-8 opacity-50" />
                    
                    {isBelowLimit && (
                      <div className="mb-6 p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider mb-1">Limit Reached</p>
                        <p className="text-xs font-bold text-amber-600 leading-tight">
                          You selected {platformCount} platforms, but this plan only supports up to {platformLimit}.
                        </p>
                      </div>
                    )}

                    <ul className="space-y-4 mb-8">
                      {Array.isArray(pkg.features) && pkg.features.slice(0, 8).map((feature: string, fIdx: number) => (
                        <li key={fIdx} className="flex items-start gap-3 text-sm font-bold text-slate-700">
                          <div className="w-5 h-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          </div>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <div className="p-8 pt-0">
                    <Button 
                      className={`w-full h-14 rounded-2xl font-black text-lg shadow-xl transition-all ${
                        selectedPackage === pkg.id 
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20' 
                          : isBelowLimit 
                            ? 'bg-slate-200 text-slate-400'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                      disabled={isBelowLimit && selectedPackage !== pkg.id}
                    >
                      {selectedPackage === pkg.id ? '✓ Selected' : isBelowLimit ? 'Upgrade Needed' : pkg.buttonText || 'Select Plan'}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          }) : (
            <div className="col-span-full text-center py-20 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200">
              <p className="text-slate-500 font-black text-xl mb-4">Loading available plans...</p>
              <div className="flex justify-center gap-2">
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="h-3 w-3 rounded-full bg-blue-500" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="h-3 w-3 rounded-full bg-blue-500" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="h-3 w-3 rounded-full bg-blue-500" />
              </div>
            </div>
          )}
        </div>

        {/* Discount Code Section */}
        {selectedPackage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto mb-16"
          >
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-2xl rounded-[2.5rem] ring-1 ring-slate-200 overflow-hidden">
              <CardContent className="p-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-blue-600">
                      <Tag className="w-10 h-10" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <Label className="text-xl font-black text-slate-900 mb-4 block">
                      Have a promo code? 🎁
                    </Label>
                    <div className="flex gap-3">
                      <Input
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                        onBlur={(e) => validateDiscountCode(e.target.value)}
                        placeholder="e.g. GROW2025"
                        className="h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-white text-lg font-bold uppercase tracking-widest"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => validateDiscountCode(discountCode)}
                        disabled={isValidatingDiscount || !discountCode}
                        className="h-14 px-8 rounded-2xl font-black bg-blue-50 text-blue-600 hover:bg-blue-100 border-0"
                      >
                        {isValidatingDiscount ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" /> : "Apply"}
                      </Button>
                    </div>
                    
                    {validDiscount && (
                      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <Alert className="mt-6 bg-emerald-50 border-emerald-200 rounded-2xl py-4">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                          <AlertDescription className="text-emerald-700 font-black text-base ml-2">
                            {validDiscount.discountPercentage}% OFF APPLIED! 🚀
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}
                  </div>
                </div>
                
                {validDiscount && selectedPackage && packages && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-10 p-8 bg-slate-900 text-white rounded-[2rem] space-y-4 shadow-xl"
                  >
                    {(() => {
                      const pkg = packages.find((p: any) => p.id === selectedPackage);
                      if (!pkg) return null;
                      const originalPrice = pkg.price / 100;
                      const discountAmount = originalPrice * (validDiscount.discountPercentage / 100);
                      const finalPrice = originalPrice - discountAmount;
                      
                      return (
                        <>
                          <div className="flex justify-between font-bold opacity-60">
                            <span>Regular Price</span>
                            <span className="line-through">${originalPrice.toFixed(2)}/mo</span>
                          </div>
                          <div className="flex justify-between font-black text-emerald-400">
                            <span>Promo Savings ({validDiscount.discountPercentage}%)</span>
                            <span>-${discountAmount.toFixed(2)}</span>
                          </div>
                          <Separator className="opacity-20" />
                          <div className="flex justify-between text-2xl font-black">
                            <span>Total Monthly Due</span>
                            <span className="text-blue-400">
                              ${finalPrice.toFixed(2)}
                            </span>
                          </div>
                          {validDiscount.durationMonths && (
                            <p className="text-xs font-bold text-center opacity-40 pt-4 tracking-widest uppercase">
                              Locked in for {validDiscount.durationMonths} months
                            </p>
                          )}
                        </>
                      );
                    })()}
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Final Checkout Button */}
        <div className="text-center">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-black text-2xl px-16 py-10 rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(37,99,235,0.4)] transition-all"
              disabled={!selectedPackage || checkoutMutation.isPending}
              onClick={() => {
                if (selectedPackage) {
                  checkoutMutation.mutate({
                    packageId: selectedPackage,
                    email: formValues.email,
                    name: formValues.name,
                    discountCode: validDiscount ? discountCode : undefined,
                  });
                }
              }}
            >
              {checkoutMutation.isPending ? (
                <div className="flex items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  Securing Connection...
                </div>
              ) : (
                "Complete My Enrollment 💳"
              )}
            </Button>
          </motion.div>
          
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
              <ShieldCheck className="w-4 h-4" />
              256-bit Secure Checkout
            </div>
            <Button 
              variant="ghost" 
              onClick={onBack}
              className="text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
            >
              ← Edit details
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

