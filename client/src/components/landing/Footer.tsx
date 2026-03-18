import { Link } from "wouter";
import { FooterLogo } from "@/components/Logo";

export default function Footer() {
  return (
    <footer className="py-12 px-4 border-t bg-muted/20">
      <div className="container mx-auto flex flex-col md:flex-row gap-6 justify-between">
        <div>
          <FooterLogo className="mb-2" />
          <p className="text-sm text-muted-foreground">Your remote digital marketing team.</p>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/blog">Blog</Link>
        </div>
      </div>
    </footer>
  );
}
