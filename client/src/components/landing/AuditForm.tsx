import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuditFormData = {
  website: string;
  instagramUrl: string;
  tiktokUrl: string;
  facebookUrl: string;
};

type Props = {
  value: AuditFormData;
  isSubmitting: boolean;
  onChange: (value: AuditFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export default function AuditForm({ value, onChange, onSubmit, isSubmitting }: Props) {
  return (
    <section className="py-16 px-4 bg-muted/40">
      <div className="container mx-auto max-w-2xl">
        <h2 className="text-3xl font-bold mb-3">Free Social Audit</h2>
        <p className="text-muted-foreground mb-6">Get actionable growth recommendations for your brand.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input placeholder="Website URL*" value={value.website} onChange={(e) => onChange({ ...value, website: e.target.value })} />
          <Input placeholder="Instagram URL" value={value.instagramUrl} onChange={(e) => onChange({ ...value, instagramUrl: e.target.value })} />
          <Input placeholder="TikTok URL" value={value.tiktokUrl} onChange={(e) => onChange({ ...value, tiktokUrl: e.target.value })} />
          <Input placeholder="Facebook URL" value={value.facebookUrl} onChange={(e) => onChange({ ...value, facebookUrl: e.target.value })} />
          <Button className="w-full" disabled={isSubmitting}>{isSubmitting ? "Submitting..." : "Run Audit"}</Button>
        </form>
      </div>
    </section>
  );
}
