export type Testimonial = {
  name: string;
  role: string;
  initials: string;
  gradient: string;
  text: string;
  featured?: boolean;
};

export const testimonials: Testimonial[] = [
  {
    name: "Marcus Johnson",
    role: "Independent Musician",
    initials: "MJ",
    gradient: "from-blue-500 to-purple-500",
    text: "Marketing Team App took my Instagram from 5K to 50K followers in 6 months.",
  },
  {
    name: "Tanya Chen",
    role: "E-commerce Business Owner",
    initials: "TC",
    gradient: "from-green-500 to-emerald-500",
    text: "Our e-commerce sales tripled after the website and campaign overhaul.",
    featured: true,
  },
  {
    name: "David Rodriguez",
    role: "Fitness Coach",
    initials: "DR",
    gradient: "from-orange-500 to-red-500",
    text: "I now have a consistent client pipeline and fully booked coaching calendar.",
  },
  {
    name: "Sarah Patel",
    role: "Restaurant Owner",
    initials: "SP",
    gradient: "from-pink-500 to-rose-500",
    text: "Our local visibility improved and weekend reservations are consistently full.",
  },
];
