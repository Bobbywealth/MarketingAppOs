import { cn } from "@/lib/utils";
import mtaLogoBlue from "@assets/mta-logo-blue.png";
import mtaLogoWhite from "@assets/mta-logo.png";

interface LogoProps {
  variant?: "blue" | "white" | "auto";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showText?: boolean;
  onClick?: () => void;
}

const sizeClasses = {
  sm: "h-8",
  md: "h-12", 
  lg: "h-16",
  xl: "h-20"
};

export function Logo({ 
  variant = "auto", 
  size = "md", 
  className,
  showText = false,
  onClick 
}: LogoProps) {
  const logoSrc = variant === "white" ? mtaLogoWhite : mtaLogoBlue;
  
  return (
    <div 
      className={cn(
        "flex items-center gap-3",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Auto variant shows appropriate logo based on theme */}
      {variant === "auto" ? (
        <>
          <img 
            src={mtaLogoBlue}
            alt="Marketing Team App" 
            className={cn(sizeClasses[size], "w-auto dark:hidden")}
            data-testid="logo-light"
          />
          <img 
            src={mtaLogoWhite}
            alt="Marketing Team App" 
            className={cn(sizeClasses[size], "w-auto hidden dark:block")}
            data-testid="logo-dark"
          />
        </>
      ) : (
        <img 
          src={logoSrc}
          alt="Marketing Team App" 
          className={cn(sizeClasses[size], "w-auto")}
          data-testid={`logo-${variant}`}
        />
      )}
      
      {/* Optional text beside logo */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-bold text-lg leading-tight">Marketing Team</span>
          <span className="text-sm text-muted-foreground leading-tight">App</span>
        </div>
      )}
    </div>
  );
}

// Convenience components for common use cases
export function HeaderLogo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return <Logo variant="blue" size="lg" className={className} onClick={onClick} />;
}

export function SidebarLogo({ className }: { className?: string }) {
  return <Logo variant="auto" size="xl" className={className} />;
}

export function FooterLogo({ className }: { className?: string }) {
  return <Logo variant="white" size="md" className={cn("brightness-0 invert", className)} />;
}

export function LoadingLogo({ className }: { className?: string }) {
  return <Logo variant="blue" size="lg" className={className} />;
}
