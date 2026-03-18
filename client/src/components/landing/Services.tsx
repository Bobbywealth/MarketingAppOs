import { Card, CardContent } from "@/components/ui/card";

const services = [
  { id: "digital-marketing", title: "Growth Marketing", copy: "Paid social, search, and lifecycle campaigns." },
  { id: "content-creation", title: "Content Engine", copy: "Short-form video, creatives, and copywriting." },
  { id: "web-design", title: "Web & App", copy: "Conversion-focused websites and web apps." },
  { id: "ai-automation", title: "AI Automation", copy: "Bots and workflows for support and lead capture." },
  { id: "seo", title: "SEO & Analytics", copy: "Search growth and measurable reporting." },
];

export default function Services() {
  return (
    <section id="services" className="py-16 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-8">Services</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <Card key={service.id} id={service.id}><CardContent className="p-6"><h3 className="font-bold text-xl">{service.title}</h3><p className="text-muted-foreground mt-2">{service.copy}</p></CardContent></Card>
          ))}
        </div>
      </div>
    </section>
  );
}
