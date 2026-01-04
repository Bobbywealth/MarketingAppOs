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
  const socialServices = ["Social Media Management", "Digital Marketing", "PPC Advertising"];
  const neededServices = selectedServices.filter(s => socialServices.includes(s));

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
          <p className="text-slate-500">To start managing your socials, we'll need basic login access.</p>
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
        {neededServices.map(s => (
          <motion.div 
            key={s}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-3xl border-2 border-slate-100 bg-white shadow-sm hover:border-blue-200 transition-all"
          >
            <h3 className="text-lg font-black flex items-center gap-2 mb-6">
              <span className="p-2 bg-blue-50 rounded-xl"><Zap className="w-4 h-4 text-blue-600" /></span>
              {s} Account Access
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Username / Email</Label>
                <Input 
                  placeholder="e.g. @yourbrand" 
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl bg-slate-50/50"
                  onChange={(e) => {
                    const val = e.target.value;
                    const current = form.getValues("socialCredentials") || {};
                    form.setValue("socialCredentials", {
                      ...current,
                      [s]: { ...(current[s] || { password: "" }), username: val }
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-black uppercase tracking-widest text-slate-500">Password</Label>
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl bg-slate-50/50"
                  onChange={(e) => {
                    const val = e.target.value;
                    const current = form.getValues("socialCredentials") || {};
                    form.setValue("socialCredentials", {
                      ...current,
                      [s]: { ...(current[s] || { username: "" }), password: val }
                    });
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

