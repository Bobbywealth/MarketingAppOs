import { motion } from "framer-motion";
import { CheckCircle2, LucideIcon, Sparkles } from "lucide-react";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";

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

export function ServicesStep({ form, services }: ServicesStepProps) {
  return (
    <motion.div 
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
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
    </motion.div>
  );
}

