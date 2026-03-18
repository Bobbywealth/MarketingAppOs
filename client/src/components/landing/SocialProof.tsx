import { Card, CardContent } from "@/components/ui/card";

const stats = [
  { label: "Campaigns", value: "850+" },
  { label: "Leads Generated", value: "4M+" },
  { label: "Avg ROI Increase", value: "310%" },
  { label: "Satisfaction", value: "98%" },
];

export default function SocialProof() {
  return (
    <section className="py-14 px-4 bg-muted/40">
      <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label}><CardContent className="p-6 text-center"><p className="text-3xl font-extrabold">{stat.value}</p><p className="text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p></CardContent></Card>
        ))}
      </div>
    </section>
  );
}
