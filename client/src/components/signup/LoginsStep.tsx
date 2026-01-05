import { motion } from "framer-motion";
import { Lock, ShieldCheck, Zap } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

interface LoginsStepProps {
  form: UseFormReturn<any>;
  selectedServices: string[];
}

export function LoginsStep({ form, selectedServices }: LoginsStepProps) {
  const selectedPlatforms = form.watch("selectedPlatforms") || [];
  const otherServices = ["Digital Marketing", "PPC Advertising"];
  const neededOtherServices = selectedServices.filter(s => otherServices.includes(s));

  // Combine platforms and other services that need logins
  const itemsToCollect = [
    ...selectedPlatforms.map(p => ({ id: p, label: `${p} Account`, type: 'platform' })),
    ...neededOtherServices.map(s => ({ id: s, label: `${s} Access`, type: 'service' }))
  ];

  return (
    <motion.div 
      key="step3"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900">Secure Setup</h2>
          <p className="text-slate-500">To start managing your socials and campaigns, we'll need basic login access.</p>
        </div>
      </div>

      <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex gap-4 items-start">
        <div className="bg-white p-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
          <ShieldCheck className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h3 className="font-black text-slate-900">Your data is safe</h3>
          <p className="text-sm text-slate-500">Credentials are stored with enterprise-grade AES-256 encryption and are used exclusively for dashboard integration and content scheduling.</p>
        </div>
      </div>

      <div className="space-y-6">
        {itemsToCollect.length > 0 ? itemsToCollect.map(item => (
          <motion.div 
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl border-2 border-slate-100 bg-white shadow-sm hover:border-blue-200 transition-all"
          >
            <h3 className="text-base md:text-lg font-black flex items-center gap-2 mb-4 md:mb-6">
              <span className="p-2 bg-blue-50 rounded-xl"><Zap className="w-4 h-4 text-blue-600" /></span>
              {item.label}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-500">Username / Email</Label>
                <Input 
                  placeholder="e.g. @yourbrand" 
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl bg-slate-50/50"
                  defaultValue={form.getValues(`socialCredentials.${item.id}.username`)}
                  onBlur={(e) => {
                    const val = e.target.value;
                    const current = form.getValues("socialCredentials") || {};
                    form.setValue("socialCredentials", {
                      ...current,
                      [item.id]: { ...(current[item.id] || { password: "" }), username: val }
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-500">Password</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl bg-slate-50/50"
                  defaultValue={form.getValues(`socialCredentials.${item.id}.password`)}
                  onBlur={(e) => {
                    const val = e.target.value;
                    const current = form.getValues("socialCredentials") || {};
                    form.setValue("socialCredentials", {
                      ...current,
                      [item.id]: { ...(current[item.id] || { username: "" }), password: val }
                    });
                  }}
                />
              </div>
            </div>
          </motion.div>
        )) : (
          <div className="text-center py-12 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500 font-bold">No credentials needed for selected services.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

