import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  MessageSquare, 
  ListTodo, 
  Megaphone, 
  Calendar, 
  Ticket,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { logError } from "@/lib/errorHandler";
import { Badge } from "@/components/ui/badge";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export function MobileNav() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const role = (user as any)?.role || "staff";
  const [quickOpen, setQuickOpen] = useState(false);
  const longPressTimerRef = useRef<number | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; t: number; edge?: "left" | "right" | null } | null>(null);

  // Fetch unread message counts for badge
  const { data: unreadCounts } = useQuery<Record<number, number>>({
    queryKey: ["/api/messages/unread-counts"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/messages/unread-counts", undefined);
        return response.json();
      } catch (error) {
        logError(error, "Unread message count fetch");
        return {};
      }
    },
    enabled: !!user && role !== 'client' && isMobile,
    refetchInterval: 15000,
  });

  const totalUnreadMessages = unreadCounts ? Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) : 0;

  const haptic = (pattern: number | number[] = 10) => {
    try {
      // Android/Chrome: vibration API. iOS Safari generally ignores it.
      if (navigator.vibrate) navigator.vibrate(pattern);
    } catch {}
  };

  const getNavItems = () => {
    if (role === 'client') {
      return [
        { title: "Home", url: "/client", icon: LayoutDashboard },
        { title: "Campaigns", url: "/client/campaigns", icon: Megaphone },
        { title: "Content", url: "/client/content", icon: Calendar },
        { title: "Second Me", url: "/client/second-me", icon: Sparkles },
        { title: "Tickets", url: "/tickets", icon: Ticket },
      ];
    }
    
    if (role === 'sales_agent') {
      return [
        { title: "Home", url: "/sales", icon: LayoutDashboard },
        { title: "Leads", url: "/sales/leads", icon: UserPlus },
        { title: "Messages", url: "/sales/messages", icon: MessageSquare, badge: totalUnreadMessages },
        { title: "Tasks", url: "/sales/tasks", icon: ListTodo },
        { title: "Clients", url: "/sales/clients", icon: Users },
      ];
    }

    // Default for Internal (Admin/Manager/Staff)
    return [
      { title: "Home", url: "/admin", icon: LayoutDashboard },
      { title: "Clients", url: "/clients", icon: Users },
      { title: "Leads", url: "/leads", icon: UserPlus },
      { title: "Messages", url: "/messages", icon: MessageSquare, badge: totalUnreadMessages },
      { title: "Tasks", url: "/tasks", icon: ListTodo },
    ];
  };

  const navItems = useMemo(getNavItems, [role, totalUnreadMessages]);

  const quickActions = useMemo(() => {
    // Keep this lightweight: quick jumps + “create” affordances that already exist
    if (role === "client") {
      return [
        { label: "Go to Tickets", url: "/tickets" },
        { label: "Go to Campaigns", url: "/client/campaigns" },
        { label: "Go to Content", url: "/client/content" },
        { label: "Settings", url: "/settings" },
      ];
    }
    if (role === "sales_agent") {
      return [
        { label: "Go to Leads", url: "/sales/leads" },
        { label: "Go to Messages", url: "/sales/messages" },
        { label: "Go to Tasks", url: "/sales/tasks" },
        { label: "Settings", url: "/settings" },
      ];
    }
    return [
      { label: "Go to Tasks", url: "/tasks" },
      { label: "Go to Messages", url: "/messages" },
      { label: "Go to Leads", url: "/leads" },
      { label: "Settings", url: "/settings" },
    ];
  }, [role]);

  // Gesture: swipe between tabs (near bottom bar) + edge swipe back/forward
  useEffect(() => {
    if (!isMobile || !user) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches?.[0];
      if (!t) return;
      const x = t.clientX;
      const y = t.clientY;
      const w = window.innerWidth || 0;
      const edge = x < 18 ? "left" : (x > w - 18 ? "right" : null);
      touchStartRef.current = { x, y, t: Date.now(), edge };

      // Long-press anywhere on the bar area opens quick actions
      if (y > window.innerHeight - 92) {
        if (longPressTimerRef.current) window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = window.setTimeout(() => {
          haptic([8, 20, 8]);
          setQuickOpen(true);
        }, 520);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;
      const t = e.touches?.[0];
      if (!t) return;
      const dx = t.clientX - touchStartRef.current.x;
      const dy = t.clientY - touchStartRef.current.y;
      // Cancel long press if user is swiping
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        if (longPressTimerRef.current) {
          window.clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const start = touchStartRef.current;
      touchStartRef.current = null;
      if (longPressTimerRef.current) {
        window.clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      if (!start) return;

      const t = e.changedTouches?.[0];
      if (!t) return;
      const dx = t.clientX - start.x;
      const dy = t.clientY - start.y;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Edge back/forward (only if predominantly horizontal)
      if (start.edge && absX > 90 && absY < 40) {
        haptic(10);
        if (start.edge === "left" && dx > 0) window.history.back();
        if (start.edge === "right" && dx < 0) window.history.forward();
        return;
      }

      // Tab switching swipe (only if started near bottom bar)
      if (start.y > window.innerHeight - 92 && absX > 80 && absY < 36) {
        const currentIndex = Math.max(0, navItems.findIndex((i) => i.url === location));
        const dir = dx < 0 ? 1 : -1;
        const nextIndex = Math.min(navItems.length - 1, Math.max(0, currentIndex + dir));
        if (nextIndex !== currentIndex) {
          haptic(10);
          setLocation(navItems[nextIndex].url);
        }
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart as any);
      window.removeEventListener("touchmove", onTouchMove as any);
      window.removeEventListener("touchend", onTouchEnd as any);
    };
  }, [isMobile, navItems, location, setLocation, user]);

  if (!isMobile || !user) return null;

  return (
    <>
      <div
        className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t px-2 pb-[env(safe-area-inset-bottom)]"
        aria-label="Bottom navigation"
      >
        <div className="h-full flex items-center justify-around gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.url;
            return (
              <Link
                key={item.url}
                href={item.url}
                onClick={() => haptic(10)}
              >
                <div
                  className={`relative flex flex-col items-center justify-center flex-1 h-full min-w-[64px] cursor-pointer rounded-xl transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    haptic([8, 20, 8]);
                    setQuickOpen(true);
                  }}
                >
                  {/* Animated active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="mta-mobile-nav-active"
                      className="absolute inset-x-2 top-2 bottom-2 rounded-2xl bg-primary/10 border border-primary/15"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}

                  <motion.div
                    className="relative"
                    animate={{ scale: isActive ? 1.08 : 1 }}
                    transition={{ type: "spring", stiffness: 460, damping: 30 }}
                  >
                    <Icon className="h-5 w-5" />
                    {item.badge !== undefined && item.badge > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 text-[10px] flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-destructive/20"
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </Badge>
                    )}
                  </motion.div>
                  <span className="relative text-[10px] mt-1 font-semibold">
                    {item.title}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <Drawer open={quickOpen} onOpenChange={setQuickOpen}>
        <DrawerContent className="pb-4">
          <DrawerHeader>
            <DrawerTitle>Quick Actions</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 grid gap-2">
            {quickActions.map((a) => (
              <Button
                key={a.url}
                variant="secondary"
                className="justify-start"
                onClick={() => {
                  haptic(10);
                  setQuickOpen(false);
                  setLocation(a.url);
                }}
              >
                {a.label}
              </Button>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                haptic(10);
                setQuickOpen(false);
              }}
            >
              Close
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}




