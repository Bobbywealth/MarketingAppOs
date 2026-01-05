import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Zap, 
  Play, 
  Layers, 
  Music, 
  Scissors, 
  Share2,
  Sparkles,
  Trophy,
  Target,
  CheckCircle2,
  Flame,
  TrendingUp,
  Award,
  Crown,
  Lock,
  ZapOff,
  Coins
} from "lucide-react";

// ... keep existing imports ...

export default function CreatorMasteringContent() {
  const [, setLocation] = useLocation();

  const modules = [
    {
      title: "The Viral Formula",
      description: "Understanding the psychology of short-form content and why people stop scrolling.",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      xp: 500,
      reward: "Viral Hook Template PDF",
      content: [
        "The 3-Second Rule: Why the hook is 90% of your success.",
        "Emotional Resonance: Making viewers feel something instantly.",
        "The Loop Effect: Designing content that people watch twice."
      ]
    },
    {
      title: "Hooking the Viewer",
      description: "Mastering the first 3 seconds to maximize retention.",
      icon: Target,
      color: "text-red-500",
      bg: "bg-red-500/10",
      xp: 750,
      reward: "50+ Proven Hook Lines",
      content: [
        "Visual Hooks: Fast movement, unusual angles, or 'oddly satisfying' starts.",
        "Text Hooks: Posing a question or making a bold claim in the first frame.",
        "The 'Wait for it' Trap: How to build anticipation without losing them."
      ]
    },
    {
      title: "Visual Pacing & Transitions",
      description: "Keeping the energy high with 'The Cut' and seamless movement.",
      icon: Layers,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      xp: 1000,
      reward: "Match-Cut Sound FX Pack",
      content: [
        "The 1.5s Cut Rule: Never let a shot linger too long.",
        "Match Cuts: How to transition between locations using movement.",
        "Zoom In/Out: Using digital zooms to emphasize key moments."
      ]
    },
    {
      title: "Audio & Sound Design",
      description: "Using trending sounds and crisp voiceovers to drive engagement.",
      icon: Music,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      xp: 1200,
      reward: "AI Voice EQ Preset",
      content: [
        "Trending Audio Strategy: Finding sounds before they blow up.",
        "Atmospheric Sound Elements: Layering natural environment sounds (ambiance, interaction, movement).",
        "Voiceover EQ: Making your voice sound professional on a phone mic."
      ]
    },
    {
      title: "The Pro Editing Workflow",
      description: "Efficiency hacks for CapCut and Premiere Rush.",
      icon: Scissors,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      xp: 1500,
      reward: "Color Grade LUT Pack",
      content: [
        "Color Grading: Making 'flat' phone footage look like cinema.",
        "Dynamic Captions: Using auto-captions that pop with the rhythm.",
        "Export Settings: The secret to 4K quality without the lag."
      ]
    }
  ];

  return (
    <div className="min-h-full bg-slate-950 text-white p-4 md:p-8 lg:p-12 selection:bg-primary selection:text-white">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Navigation & Gamified Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="gap-2 text-slate-400 hover:text-white hover:bg-white/10 w-fit"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.1)]">
              <Flame className="h-4 w-4 text-orange-500 fill-current animate-pulse" />
              <span className="font-black text-orange-500 text-sm">7 DAY STREAK</span>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 border border-primary/30 px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.1)]">
              <Crown className="h-4 w-4 text-primary" />
              <span className="font-black text-primary text-sm">RANK #12</span>
            </div>
            <div className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-4 py-1.5 rounded-full">
              <Coins className="h-4 w-4 text-purple-400" />
              <span className="font-black text-purple-400 text-sm">2,450 XP</span>
            </div>
          </div>
        </div>

        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-purple-500/10 to-transparent border border-white/10 p-8 md:p-12">
          <div className="relative z-10 space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="border-primary/50 text-primary py-1 px-4 font-black">
                CREATOR LEVEL 4
              </Badge>
              <div className="h-2 w-32 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-3/4 shadow-[0_0_10px_#3b82f6]" />
              </div>
              <span className="text-xs font-bold text-slate-500">75% to Level 5</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
              MASTERING <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400 uppercase">Content</span>
            </h1>
            <p className="text-xl text-slate-400 leading-relaxed">
              Level up your storytelling. Earn XP, unlock exclusive assets, and climb the leaderboard.
            </p>
          </div>
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/10 to-transparent -z-0" />
          <Trophy className="absolute top-10 right-10 h-40 w-40 text-primary/5 -z-0" />
        </div>

        {/* Progress & Leaderboard Preview */}
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 bg-slate-900 border-white/10 overflow-hidden shadow-2xl">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <h3 className="font-black text-slate-200 uppercase tracking-widest text-sm">Course Progress</h3>
                      <p className="text-2xl font-black text-white">8/12 Lessons Complete</p>
                    </div>
                    <span className="text-primary font-black text-4xl">65%</span>
                  </div>
                  <Progress value={65} className="h-4 bg-white/5 shadow-inner" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/80 border-white/10 backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Daily Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { name: "Sarah K.", xp: "12,400", rank: 1, me: false },
                { name: "Alex M.", xp: "9,850", rank: 2, me: false },
                { name: "YOU", xp: "2,450", rank: 12, me: true },
              ].map((user, i) => (
                <div key={i} className={`flex items-center justify-between p-2 rounded-lg ${user.me ? 'bg-primary/20 border border-primary/30' : 'bg-white/5'}`}>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-black ${user.rank === 1 ? 'text-amber-500' : 'text-slate-500'}`}>#{user.rank}</span>
                    <span className={`font-bold text-sm ${user.me ? 'text-white' : 'text-slate-300'}`}>{user.name}</span>
                  </div>
                  <span className="text-xs font-black text-slate-400">{user.xp} XP</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Modules Grid */}
        <div className="space-y-8">
          <h2 className="text-3xl font-black tracking-tight flex items-center gap-3 uppercase">
            <Zap className="h-8 w-8 text-primary" />
            Skill Tree
          </h2>

          <div className="grid gap-6">
            {modules.map((module, idx) => {
              const isLocked = idx > 3;
              return (
                <Card key={idx} className={`bg-slate-900/50 border-white/10 hover:border-primary/50 transition-all group overflow-hidden relative ${isLocked ? 'opacity-50 grayscale' : ''}`}>
                  <div className="flex flex-col md:flex-row">
                    <div className={`md:w-20 flex items-center justify-center p-6 ${module.bg} relative`}>
                      <module.icon className={`h-10 w-10 ${module.color} z-10`} />
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <CardContent className="p-6 flex-1 space-y-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-black text-primary/60 tracking-widest uppercase">Skill 0{idx + 1}</span>
                            <div className="flex items-center gap-1 bg-purple-500/10 px-2 py-0.5 rounded text-[10px] font-black text-purple-400 border border-purple-500/20">
                              +{module.xp} XP
                            </div>
                          </div>
                          <h3 className="text-2xl font-black text-white group-hover:text-primary transition-colors flex items-center gap-2">
                            {module.title}
                            {isLocked && <Lock className="h-5 w-5 text-slate-500" />}
                          </h3>
                          <p className="text-slate-400 max-w-xl">{module.description}</p>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <Button 
                            disabled={isLocked}
                            className={`md:w-48 w-full gap-2 font-black shadow-lg ${idx < 3 ? 'bg-slate-800 hover:bg-slate-700' : 'shadow-primary/20'}`}
                          >
                            {idx < 3 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Play className="h-4 w-4 fill-current" />}
                            {idx < 3 ? "REPLAY LESSON" : "UNLEASH SKILL"}
                          </Button>
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest justify-center">
                            <Award className="h-3 w-3 text-amber-500" />
                            Reward: {module.reward}
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-3 gap-6 pt-2">
                        {module.content.map((item, i) => (
                          <div key={i} className="space-y-2 group/item">
                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className={`h-full bg-primary/40 transition-all duration-700 ${idx < 3 ? 'w-full' : 'w-0 group-hover:w-1/3'}`} />
                            </div>
                            <p className="text-xs font-bold text-slate-500 group-hover/item:text-slate-300 transition-colors leading-relaxed">
                              {item}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Final Boss CTA */}
        <div className="p-1 w-full rounded-[2.5rem] bg-gradient-to-r from-primary via-purple-500 to-primary animate-gradient-x shadow-[0_0_50px_rgba(59,130,246,0.3)]">
          <div className="p-12 rounded-[2.4rem] bg-slate-950 text-center space-y-6 relative overflow-hidden">
            <div className="relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-6 py-2 rounded-full border border-primary/30 mb-4">
                <Crown className="h-6 w-6 animate-bounce" />
                <span className="font-black tracking-widest">FINAL ASSESSMENT</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase">
                Unlock the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">Master</span> Badge
              </h2>
              <p className="max-w-2xl mx-auto text-slate-400 text-lg font-medium leading-relaxed">
                You're just <span className="text-white font-bold">4,000 XP</span> away from becoming a Verified Pro. Pass the final exam to unlock top-tier payments and exclusive networking events.
              </p>
              <div className="pt-6">
                <Button size="lg" className="h-16 px-16 rounded-2xl font-black text-xl gap-3 shadow-2xl bg-primary hover:bg-primary/90 hover:scale-105 transition-all">
                  START FINAL BOSS BATTLE
                  <ArrowRight className="h-6 w-6" />
                </Button>
              </div>
            </div>
            
            {/* Animated background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/30 blur-[150px] rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center text-slate-600 text-sm pb-12 gap-4 border-t border-white/5">
          <div className="flex items-center gap-6 font-black tracking-widest uppercase">
            <span className="text-slate-500">MTA Academy 2026</span>
            <span className="text-primary hover:text-white transition-colors cursor-pointer">Support</span>
            <span className="text-primary hover:text-white transition-colors cursor-pointer">Archive</span>
          </div>
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
            <Share2 className="h-4 w-4 text-primary" />
            <span className="font-bold">Share Progress: +50 XP Reward</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient-x {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 5s ease infinite;
        }
      `}} />
    </div>
  );
}

// ... keep existing helper components ...


function ArrowRight(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

