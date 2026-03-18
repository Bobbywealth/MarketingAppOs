import type { SubscriptionPackage } from "@shared/schema";

export const formatCurrency = (cents: number) => `$${(cents / 100).toFixed(2)}`;

export const splitPackages = (packages: SubscriptionPackage[]) => {
  const marketing = packages.filter((pkg) => !pkg.name.toLowerCase().includes("second me"));
  const ai = packages.filter((pkg) => pkg.name.toLowerCase().includes("second me"));

  return { marketing, ai };
};
