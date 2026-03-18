import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const items = [
  { q: "How fast can we launch?", a: "Most clients launch in 7-14 days depending on scope." },
  { q: "Do you work with small teams?", a: "Yes. We support solo founders through enterprise teams." },
  { q: "Can I cancel anytime?", a: "Yes, plans are month-to-month unless otherwise agreed." },
];

export default function FAQ() {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-3xl">
        <h2 className="text-3xl font-bold mb-6">FAQ</h2>
        <Accordion type="single" collapsible>
          {items.map((item) => (
            <AccordionItem key={item.q} value={item.q}><AccordionTrigger>{item.q}</AccordionTrigger><AccordionContent>{item.a}</AccordionContent></AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
