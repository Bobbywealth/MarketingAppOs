import { ReactNode } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  meta?: ReactNode;
  variant?: "default" | "premium";
  className?: string;
}

export function PageHeader({
  title,
  description,
  actions,
  breadcrumbs,
  meta,
  variant = "default",
  className,
}: PageHeaderProps) {
  const isPremium = variant === "premium";

  return (
    <header
      className={cn(
        isPremium
          ? "relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-r from-primary/15 via-violet-500/10 to-transparent shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/70"
          : "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      {isPremium && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/10 via-transparent to-transparent"
        />
      )}
      <div
        className={cn(
          "relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-4 py-4 md:px-6",
          isPremium && "md:gap-6 md:px-8 md:py-6",
        )}
      >
        <div className="space-y-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className={cn(
                "mb-1 text-xs text-muted-foreground",
                isPremium &&
                  "text-[11px] uppercase tracking-wide text-muted-foreground/80",
              )}
            >
              <ol className="flex items-center gap-1.5 flex-wrap">
                {breadcrumbs.map((crumb, i) => (
                  <li key={i} className="flex items-center gap-1.5">
                    {crumb.href ? (
                      <Link
                        href={crumb.href}
                        className="hover:underline hover:text-foreground transition-colors"
                      >
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className="text-foreground font-medium">
                        {crumb.label}
                      </span>
                    )}
                    {i < breadcrumbs.length - 1 && (
                      <span
                        className="text-muted-foreground/50"
                        aria-hidden="true"
                      >
                        /
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          <h1
            className={cn(
              "font-bold tracking-tight",
              isPremium
                ? "text-2xl md:text-3xl lg:text-4xl text-gradient-purple"
                : "text-xl md:text-2xl",
            )}
          >
            {title}
          </h1>
          {description && (
            <p
              className={cn(
                "max-w-2xl text-sm text-muted-foreground",
                isPremium && "text-sm md:text-base lg:text-lg",
              )}
            >
              {description}
            </p>
          )}
          {meta && <div className="pt-1">{meta}</div>}
        </div>
        {actions && (
          <div
            className={cn(
              "flex items-center gap-2 flex-wrap",
              isPremium && "self-stretch sm:self-auto",
            )}
          >
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

// Compact variant for sub-pages
interface PageHeaderCompactProps {
  title: string;
  description?: string;
  backButton?: {
    label: string;
    href: string;
  };
  actions?: ReactNode;
}

export function PageHeaderCompact({
  title,
  description,
  backButton,
  actions,
}: PageHeaderCompactProps) {
  return (
    <header className="border-b bg-background/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <div className="flex items-center gap-3">
          {backButton && (
            <Link
              href={backButton.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m15 18-6-6 6-6" />
              </svg>
              {backButton.label}
            </Link>
          )}
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
