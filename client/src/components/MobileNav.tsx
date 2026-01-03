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
import { Badge } from "@/components/ui/badge";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const role = (user as any)?.role || "staff";

  // Fetch unread message counts for badge
  const { data: unreadCounts } = useQuery<Record<number, number>>({
    queryKey: ["/api/messages/unread-counts"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/messages/unread-counts", undefined);
        return response.json();
      } catch (e) {
        return {};
      }
    },
    enabled: !!user && role !== 'client' && isMobile,
    refetchInterval: 15000,
  });

  const totalUnreadMessages = unreadCounts ? Object.values(unreadCounts).reduce((sum, count) => sum + count, 0) : 0;

  if (!isMobile || !user) return null;

  const getNavItems = () => {
    if (role === 'client') {
      return [
        { title: "Home", url: "/", icon: LayoutDashboard },
        { title: "Campaigns", url: "/client-campaigns", icon: Megaphone },
        { title: "Content", url: "/client-content", icon: Calendar },
        { title: "Second Me", url: "/second-me", icon: Sparkles },
        { title: "Tickets", url: "/tickets", icon: Ticket },
      ];
    }
    
    if (role === 'sales_agent') {
      return [
        { title: "Home", url: "/", icon: LayoutDashboard },
        { title: "Leads", url: "/leads", icon: UserPlus },
        { title: "Messages", url: "/messages", icon: MessageSquare, badge: totalUnreadMessages },
        { title: "Tasks", url: "/tasks", icon: ListTodo },
        { title: "Clients", url: "/clients", icon: Users },
      ];
    }

    // Default for Internal (Admin/Manager/Staff)
    return [
      { title: "Home", url: "/", icon: LayoutDashboard },
      { title: "Clients", url: "/clients", icon: Users },
      { title: "Leads", url: "/leads", icon: UserPlus },
      { title: "Messages", url: "/messages", icon: MessageSquare, badge: totalUnreadMessages },
      { title: "Tasks", url: "/tasks", icon: ListTodo },
    ];
  };

  const navItems = getNavItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = location === item.url;
        return (
          <Link key={item.url} href={item.url}>
            <div className={`flex flex-col items-center justify-center flex-1 h-full min-w-[64px] transition-colors cursor-pointer ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}>
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 min-w-[16px] px-1 text-[10px] flex items-center justify-center rounded-full animate-pulse shadow-lg shadow-destructive/20"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] mt-1 font-medium">{item.title}</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}


