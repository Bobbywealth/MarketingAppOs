import { Link } from "wouter";
import type { SubscriptionPackage } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, splitPackages } from "./data/packageTransforms";

type Props = {
  packages: SubscriptionPackage[];
  isLoading: boolean;
};

export default function Pricing({ packages, isLoading }: Props) {
  const { marketing, ai } = splitPackages(packages);
  return (
    <section id="pricing" className="py-16 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold mb-8">Pricing</h2>
        {isLoading ? <p>Loading packages...</p> : null}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {marketing.map((pkg) => (
            <Card key={pkg.id} className={pkg.isFeatured ? "border-blue-500 border-2" : ""}>
              <CardContent className="p-6">
                {pkg.isFeatured ? <Badge className="mb-3">Popular</Badge> : null}
                <h3 className="font-bold text-xl">{pkg.name}</h3>
                <p className="mt-2 mb-4 text-3xl font-extrabold">{formatCurrency(pkg.price)}</p>
                <Link href={pkg.buttonLink || "/signup"}><Button className="w-full">{pkg.buttonText || "Get Started"}</Button></Link>
              </CardContent>
            </Card>
          ))}
        </div>
        {ai.length > 0 ? <p className="mt-6 text-sm text-muted-foreground">AI packages available under Second Me plans.</p> : null}
      </div>
    </section>
  );
}
