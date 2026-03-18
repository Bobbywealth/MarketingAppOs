import { Bot, Globe, Pencil, Target, TrendingUp, type LucideIcon } from "lucide-react";

export type ServiceNavItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
};

export const serviceNavItems: ServiceNavItem[] = [
  {
    id: "digital-marketing",
    label: "Digital Marketing",
    description: "Social media, ads & campaigns",
    icon: TrendingUp,
    gradient: "from-blue-500 to-blue-600",
  },
  {
    id: "content-creation",
    label: "Content Creation",
    description: "Copy, graphics & videos",
    icon: Pencil,
    gradient: "from-purple-500 to-purple-600",
  },
  {
    id: "web-design",
    label: "Web & App Development",
    description: "Websites, apps & CRMs",
    icon: Globe,
    gradient: "from-emerald-500 to-emerald-600",
  },
  {
    id: "ai-automation",
    label: "AI Automation",
    description: "Chatbots & workflow automation",
    icon: Bot,
    gradient: "from-orange-500 to-orange-600",
  },
  {
    id: "seo",
    label: "SEO & Analytics",
    description: "Search optimization & tracking",
    icon: Target,
    gradient: "from-green-500 to-green-600",
  },
];

export const primaryNavLinks = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/become-creator", label: "Become a Creator" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
];
