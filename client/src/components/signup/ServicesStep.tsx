import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, LucideIcon, Sparkles, Facebook, Instagram, Linkedin, Youtube, MessageSquare, Landmark, Briefcase } from "lucide-react";
import { FormField, FormItem, FormMessage, FormLabel, FormControl } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface Service {
  name: string;
  icon: LucideIcon;
  color: string;
  desc: string;
  recommended?: boolean;
}

interface ServicesStepProps {
  form: UseFormReturn<any>;
  services: Service[];
}

const PLATFORMS = [
  { name: "Facebook", icon: Facebook, color: "bg-[#1877F2]" },
  { name: "Instagram", icon: Instagram, color: "bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7]" },
  { name: "X / Twitter", icon: MessageSquare, color: "bg-black" },
  { name: "LinkedIn", icon: Linkedin, color: "bg-[#0A66C2]" },
  { name: "YouTube", icon: Youtube, color: "bg-[#FF0000]" },
  { name: "TikTok", icon: MessageSquare, color: "bg-black" },
];

export function ServicesStep({ form, services }: ServicesStepProps) {
  const selectedServices = form.watch("services") || [];
  const showPlatforms = selectedServices.includes("Social Media Management");

  return (
    <motion.div 
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Select Services</h2>
          <p className="text-slate-500">Choose what your business needs to grow. Pick as many as you like.</p>
        </div>
      </div>

      <FormField
        control={form.control}
        name="services"
        render={() => (
          <FormItem>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((service) => (
                <FormField
                  key={service.name}
                  control={form.control}
                  name="services"
                  render={({ field }) => {
                    const isSelected = field.value?.includes(service.name);
                    return (
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`group relative flex items-start gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50/50 shadow-xl shadow-blue-500/10' 
                            : 'border-slate-100 hover:border-blue-200 bg-white'
                        }`}
                        onClick={() => {
                          const current = field.value || [];
                          if (isSelected) {
                            field.onChange(current.filter((v: string) => v !== service.name));
                          } else {
                            field.onChange([...current, service.name]);
                          }
                        }}
                      >
                        {service.recommended && (
                          <div className="absolute -top-3 -right-2 z-10">
                            <Badge className="bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0 font-black shadow-lg">
                              RECOMMENDED
                            </Badge>
                          </div>
                        )}
                        
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${service.color} text-white shadow-lg transition-transform group-hover:scale-110`}>
                          <service.icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 leading-tight">{service.name}</p>
                          <p className="text-xs text-slate-500 mt-1 font-medium">{service.desc}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected ? 'bg-blue-500 border-blue-500 scale-110' : 'border-slate-200 group-hover:border-blue-300'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                        </div>
                      </motion.div>
                    );
                  }}
                />
              ))}
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="pt-8 space-y-6">
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="w-4 h-4 text-slate-400" />
                  <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-500">Industry</FormLabel>
                </div>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50 text-left">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="e_commerce">E-commerce</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2 mb-2">
                  <Landmark className="w-4 h-4 text-slate-400" />
                  <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-500">Monthly Budget</FormLabel>
                </div>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50 text-left">
                      <SelectValue placeholder="Select budget range" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="<5000">Less than $5,000</SelectItem>
                    <SelectItem value="5000-10000">$5,000 - $10,000</SelectItem>
                    <SelectItem value="10000-25000">$10,000 - $25,000</SelectItem>
                    <SelectItem value="25000-50000">$25,000 - $50,000</SelectItem>
                    <SelectItem value="50000+">$50,000+</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <AnimatePresence>
        {showPlatforms && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-8 space-y-6">
              <Separator />
              <div className="space-y-2">
                <h3 className="text-lg md:text-xl font-black text-slate-900">Which platforms should we manage?</h3>
                <p className="text-xs md:text-sm text-slate-500 font-medium">Select the social media platforms you want us to handle for your brand.</p>
              </div>

              <FormField
                control={form.control}
                name="selectedPlatforms"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3">
                      {PLATFORMS.map((platform) => {
                        const isSelected = field.value?.includes(platform.name);
                        return (
                          <motion.div
                            key={platform.name}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex flex-col items-center justify-center p-3 md:p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50/50' 
                                : 'border-slate-100 bg-white hover:border-slate-200'
                            }`}
                            onClick={() => {
                              const current = field.value || [];
                              if (isSelected) {
                                field.onChange(current.filter((v: string) => v !== platform.name));
                              } else {
                                field.onChange([...current, platform.name]);
                              }
                            }}
                          >
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center text-white mb-2 ${platform.color}`}>
                              <platform.icon className="w-4 h-4 md:w-5 md:h-5" />
                            </div>
                            <span className="text-[10px] md:text-xs font-black text-slate-900">{platform.name}</span>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle2 className="w-3 md:w-4 h-3 md:h-4 text-blue-500" />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3 items-center">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center shrink-0 font-bold text-xs">
                  {form.watch("selectedPlatforms")?.length || 0}
                </div>
                <p className="text-xs font-bold text-blue-700">
                  {form.watch("selectedPlatforms")?.length > 2 
                    ? "Great choice! Higher platform counts will automatically recommend our premium packages." 
                    : "Selection complete. This will help us tailor your management plan."}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

