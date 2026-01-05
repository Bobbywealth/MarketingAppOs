import { motion } from "framer-motion";
import { User } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";

interface ContactStepProps {
  form: UseFormReturn<any>;
}

export function ContactStep({ form }: ContactStepProps) {
  return (
    <motion.div 
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-3xl font-black text-slate-900">Contact Information</h2>
          <p className="text-slate-500">Let's start with who you are.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-500">Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} className="h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-500">Email Address *</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} className="h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-500">Phone Number *</FormLabel>
              <FormControl>
                <Input placeholder="+1 (555) 123-4567" {...field} className="h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-500">Company Name *</FormLabel>
              <FormControl>
                <Input placeholder="Acme Inc." {...field} className="h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="website"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-500">Website URL (Optional)</FormLabel>
            <FormControl>
              <Input placeholder="https://example.com" {...field} className="h-14 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl bg-slate-50/50" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </motion.div>
  );
}

