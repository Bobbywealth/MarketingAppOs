import { motion } from "framer-motion";
import { CheckCircle, LucideIcon } from "lucide-react";

interface Step {
  num: number;
  label: string;
  icon: LucideIcon;
  hidden?: boolean;
}

interface SignupProgressProps {
  step: number;
  steps: Step[];
}

export function SignupProgress({ step, steps }: SignupProgressProps) {
  const visibleSteps = steps.filter(s => !s.hidden);
  
  return (
    <div className="flex items-center justify-between mb-12 overflow-x-auto pb-4 px-2 no-scrollbar">
      {visibleSteps.map((s, idx, arr) => (
        <div key={s.num} className="flex items-center flex-1 min-w-max">
          <div className="flex flex-col items-center gap-3 relative">
            <motion.div
              initial={false}
              animate={{ 
                scale: step === s.num ? 1.1 : 1,
                backgroundColor: step >= s.num ? "rgb(37, 99, 235)" : "rgb(241, 245, 249)",
                color: step >= s.num ? "white" : "rgb(100, 116, 139)"
              }}
              className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center transition-all shadow-sm z-10"
            >
              {step > s.num ? (
                <CheckCircle className="w-5 h-5 md:w-6 md:h-6" />
              ) : (
                <s.icon className="w-5 h-5 md:w-6 md:h-6" />
              )}
            </motion.div>
            <span className={`text-[10px] md:text-xs font-black tracking-wider uppercase ${step >= s.num ? "text-blue-600" : "text-slate-400"}`}>
              {s.label}
            </span>
          </div>
          {idx < arr.length - 1 && (
            <div className="flex-1 mx-2 md:mx-4 h-1 bg-slate-100 rounded-full relative -mt-6 min-w-[20px] md:min-w-[40px]">
              <motion.div 
                initial={false}
                animate={{ width: step > s.num ? "100%" : "0%" }}
                className="absolute top-0 left-0 h-full bg-blue-600 rounded-full"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

