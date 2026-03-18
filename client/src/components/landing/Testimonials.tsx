import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { testimonials } from "./data/testimonials";

export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const current = testimonials[index];

  return (
    <section id="testimonials" className="py-16 px-4 bg-muted/30">
      <div className="container mx-auto max-w-4xl">
        <h2 className="text-3xl font-bold mb-8 text-center">Testimonials</h2>
        <Card><CardContent className="p-8"><div className="flex mb-3">{[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}</div><p className="italic">“{current.text}”</p><p className="mt-4 font-semibold">{current.name}</p><p className="text-sm text-muted-foreground">{current.role}</p></CardContent></Card>
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="icon" onClick={() => setIndex((index - 1 + testimonials.length) % testimonials.length)}><ChevronLeft className="w-4 h-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setIndex((index + 1) % testimonials.length)}><ChevronRight className="w-4 h-4" /></Button>
        </div>
      </div>
    </section>
  );
}
