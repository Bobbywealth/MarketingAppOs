import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Camera, 
  Utensils, 
  Lightbulb, 
  Smartphone, 
  MessageCircle,
  CheckCircle2,
  PlayCircle
} from "lucide-react";
import { Link, useLocation } from "wouter";

export default function CreatorCourse() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-full bg-white dark:bg-slate-950 p-4 md:p-8 lg:p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/")}
          className="gap-2 -ml-2 text-muted-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        {/* Course Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Utensils className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight">Masterclass: Restaurant Content Creation</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Everything you need to know about capturing mouth-watering content and working professionally with restaurant owners.
          </p>
        </div>

        <Separator />

        {/* Section 1: The Basics */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Smartphone className="h-6 w-6 text-blue-500" />
            1. Mastering the Gear (Your Phone)
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p>You don't need a $5,000 camera to create viral content. Your smartphone is more than enough if you know how to use it.</p>
              <ul className="grid gap-4">
                <li className="flex gap-3">
                  <div className="mt-1"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /></div>
                  <div>
                    <span className="font-bold block">Clean your lens.</span>
                    <span className="text-muted-foreground text-sm">Always wipe your camera lens before shooting. Fingerprint smudges are the #1 killer of content quality.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="mt-1"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /></div>
                  <div>
                    <span className="font-bold block">Lock your exposure.</span>
                    <span className="text-muted-foreground text-sm">Tap and hold the screen to lock focus and exposure so the lighting doesn't "jump" while you film.</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="mt-1"><CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" /></div>
                  <div>
                    <span className="font-bold block">Shoot in 4K, 60fps.</span>
                    <span className="text-muted-foreground text-sm">This gives you the highest quality and allows you to slow down footage for "cinematic" effects.</span>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Section 2: Restaurant Etiquette */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="h-6 w-6 text-purple-500" />
            2. How to Work with Restaurants
          </h2>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Professional On-Site Etiquette</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>Getting great content is only half the job. Building a relationship with the restaurant owner ensures you get invited back.</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    The Introduction
                  </h3>
                  <p className="text-sm text-muted-foreground">Always check in with the manager first. Say: "Hi, I'm [Name] from the Marketing Team. I'm here to capture content for your social media today."</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Don't Disrupt
                  </h3>
                  <p className="text-sm text-muted-foreground">Stay out of the way of servers and customers. Your goal is to be a "fly on the wall" while capturing the vibe.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 3: The Shot List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Camera className="h-6 w-6 text-amber-500" />
            3. The "Winning" Shot List
          </h2>
          <p>Every restaurant visit should aim to capture these five key shots:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "The Hero Dish", desc: "A close-up, slow movement (zoom in or pan) of the best-looking dish." },
              { title: "The 'Action' Shot", desc: "Pouring sauce, cheese pulls, or a chef flipping something in the kitchen." },
              { title: "The Atmosphere", desc: "A wide shot of the restaurant showing the interior and the lighting." },
              { title: "The Detail", desc: "Macro shots of ingredients, steam rising, or a perfectly garnished drink." },
              { title: "The Experience", desc: "A shot of a happy customer (ask permission!) or a server bringing out food." }
            ].map((item, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl border bg-slate-50 dark:bg-slate-900/50">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h4 className="font-bold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="pt-6 text-center space-y-4">
            <Lightbulb className="h-12 w-12 mx-auto opacity-50" />
            <h3 className="text-2xl font-bold">Ready to Start Shooting?</h3>
            <p className="max-w-md mx-auto opacity-90">
              Apply what you've learned on your next visit. High-quality content leads to higher performance scores and more opportunities!
            </p>
            <Button variant="secondary" size="lg" onClick={() => setLocation("/")}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>

        <div className="pt-8 text-center text-muted-foreground text-sm pb-12">
          © 2026 Marketing Team App • Creator Education Series
        </div>
      </div>
    </div>
  );
}

