import { motion } from "framer-motion";
import { Palette, UploadCloud, Layout, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { SimpleUploader } from "@/components/SimpleUploader";

interface BrandStepProps {
  form: UseFormReturn<any>;
}

export function BrandStep({ form }: BrandStepProps) {
  const brandAssets = form.watch("brandAssets") || {};
  const primaryColor = brandAssets.primaryColor || "#3B82F6";
  const logoUrl = brandAssets.logoUrl;

  return (
    <motion.div 
      key="step4"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
          <Palette className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900">Brand Identity</h2>
          <p className="text-slate-500">Help us visualize your brand's unique personality.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8">
          <div className="space-y-4">
            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Primary Brand Color</Label>
            <div className="flex gap-6 items-center p-6 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-200 group hover:border-blue-400 transition-all">
              <input 
                type="color" 
                className="w-20 h-20 rounded-2xl cursor-pointer border-0 p-0 overflow-hidden shadow-lg ring-4 ring-white"
                value={primaryColor}
                onChange={(e) => {
                  const current = form.getValues("brandAssets") || {};
                  form.setValue("brandAssets", { ...current, primaryColor: e.target.value });
                }}
              />
              <div className="flex-1">
                <p className="font-black text-slate-900">Color Palette</p>
                <p className="text-xs text-slate-500 mt-1">We'll use this to theme your custom dashboard experience.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Brand Logo</Label>
            <div className="rounded-[2rem] overflow-hidden">
              <SimpleUploader 
                onUploadComplete={(url) => {
                  const current = form.getValues("brandAssets") || {};
                  form.setValue("brandAssets", { ...current, logoUrl: url });
                }}
                buttonText="Select Logo File"
              />
            </div>
          </div>
        </div>

        {/* Live Preview Upgrade */}
        <div className="relative">
          <Label className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 block text-center">Live Preview</Label>
          <div className="relative rounded-[2.5rem] bg-slate-900 p-8 shadow-2xl overflow-hidden aspect-video flex flex-col justify-between border-8 border-slate-800">
            <div className="flex justify-between items-center">
              <div className="w-24 h-8 rounded-lg bg-slate-800 flex items-center px-3 gap-2 overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-4 w-auto object-contain" />
                ) : (
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: primaryColor }} />
                )}
                <div className="h-2 w-12 bg-slate-700 rounded-full" />
              </div>
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-slate-800" />
                <div className="w-6 h-6 rounded-full bg-slate-800" />
              </div>
            </div>

            <div className="flex-1 flex items-center justify-center gap-4">
              <div className="w-1/3 h-24 rounded-2xl bg-slate-800/50 flex flex-col p-4 gap-2">
                <div className="h-2 w-full bg-slate-700 rounded-full" />
                <div className="h-2 w-2/3 bg-slate-700 rounded-full opacity-50" />
                <div className="mt-auto h-4 w-full rounded-lg" style={{ backgroundColor: primaryColor }} />
              </div>
              <div className="w-2/3 h-32 rounded-[2rem] p-6 flex flex-col gap-4 relative overflow-hidden" style={{ backgroundColor: primaryColor }}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="h-3 w-1/2 bg-white/40 rounded-full" />
                <div className="h-6 w-3/4 bg-white rounded-xl shadow-lg" />
                <div className="mt-auto flex justify-between items-center">
                  <div className="h-2 w-1/4 bg-white/40 rounded-full" />
                  <Layout className="w-5 h-5 text-white/60" />
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-purple-500/20 rounded-full blur-3xl" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3 text-green-500" />
            Theme synchronizing in real-time
          </div>
        </div>
      </div>

      <FormField
        control={form.control}
        name="brandAssets.brandVoice"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-500">Brand Voice & Personality</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Describe your brand in a few words... (e.g. Professional yet witty, luxury and minimal, bold and aggressive)" 
                className="min-h-[140px] border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-[2rem] bg-slate-50/50 p-6 resize-none"
                {...field}
              />
            </FormControl>
            <FormDescription className="text-xs font-medium text-slate-400 pl-2 mt-2">Our AI and content team will use this to match your style.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
}

