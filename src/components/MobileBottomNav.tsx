import { Home, Search, User, MessageSquare, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

interface MobileBottomNavProps {
  role?: "mentee" | "mentor";
}

export function MobileBottomNav({ role = "mentee" }: MobileBottomNavProps) {
  const location = useLocation();

  const menteeNavItems: NavItem[] = [
    { icon: Home, label: "Home", href: "/mentee-dashboard" },
    { icon: Search, label: "Find", href: "/find-mentors" },
    { icon: MessageSquare, label: "Requests", href: "/requests" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  const mentorNavItems: NavItem[] = [
    { icon: Home, label: "Home", href: "/mentor-dashboard" },
    { icon: MessageSquare, label: "Requests", href: "/mentor-requests" },
    { icon: User, label: "Profile", href: "/profile" },
    { icon: Settings, label: "Settings", href: "/settings" },
  ];

  const navItems = role === "mentor" ? mentorNavItems : menteeNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-4 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive && "text-primary")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
