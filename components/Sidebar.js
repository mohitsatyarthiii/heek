"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/theme-context";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  Settings,
  LogOut, 
  BarChart,
  Menu,
  X,
  ChevronRight,
  UserPlus,
  PlusCircle,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { useState } from "react";

export default function Sidebar({ onLogout }) {
  const pathname = usePathname();
  const { theme, isDark } = useTheme();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = [
    { 
      href: "/dashboard", 
      label: "Creators Database", 
      icon: LayoutDashboard,
      description: "Overview and assignments"
    },
    { 
      href: "/dashboard/creators", 
      label: "Creators", 
      icon: Users,
      description: "Manage creator profiles"
    },
    { 
      href: "/dashboard/tasks", 
      label: "Requirements", 
      icon: CheckSquare,
      description: "Assign and track requirements"
    },
    { 
      href: "/dashboard/campaigns", 
      label: "Executions", 
      icon: BarChart,
      description: "Brand Requirements"
    },
    {
      icon: CreditCard,
      label: "Payments",
      href: "/dashboard/payments",
      roles: ["admin", "manager", "associate"],
      description: "View all Payments"
    }
  ];

  const quickActions = [
    {
      href: "/dashboard/creators/new",
      label: "Add Creator",
      icon: UserPlus,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30"
    },
    {
      href: "/dashboard/tasks/new",
      label: "Create Requirement",
      icon: PlusCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/30"
    },
    {
      href: "/dashboard/campaigns/new",
      label: "New Execution",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30"
    },
  ];

  // Mobile toggle button
  const MobileToggle = () => (
    <Button
      variant="ghost"
      size="icon"
      className="lg:hidden fixed top-4 left-4 z-50 bg-card border-border"
      onClick={() => setIsMobileOpen(!isMobileOpen)}
    >
      {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </Button>
  );

  const sidebarContent = (
    <div className={`h-screen flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Logo/Header - Sirf Logo */}
      <div className={`p-4 border-b border-border ${isCollapsed ? 'px-2' : 'px-4'}`}>
        <div className={`flex items-center justify-between ${isCollapsed ? 'justify-center' : ''}`}>
          <div className={`relative ${isCollapsed ? 'h-12 w-20' : 'h-20 w-full max-w-[300px]'}`}>
            <Image
              src="/logo.png" // ya logo.svg, logo.jpg, etc.
              alt="Heek-E OS Logo"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 768px) 160px, 224px"
            />
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex h-8 w-8"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start mb-1 group transition-all ${
                  isCollapsed ? 'px-2' : 'px-3'
                } ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-foreground'}`}
                title={isCollapsed ? item.label : ''}
              >
                <item.icon className={`h-4 w-4 ${isCollapsed ? 'mr-0' : 'mr-3'}`} />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && <ChevronRight className="h-3 w-3 ml-2" />}
                  </>
                )}
              </Button>
              {!isCollapsed && isActive && (
                <p className="text-xs text-muted-foreground ml-11 mt-1">{item.description}</p>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Quick Actions - Only show when not collapsed */}
      {!isCollapsed && (
        <div className="p-4 border-t border-border">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Quick Actions
          </h3>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs border-border hover:bg-accent"
                >
                  <div className={`p-1 rounded mr-2 ${action.bgColor}`}>
                    <action.icon className={`h-3 w-3 ${action.color}`} />
                  </div>
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Section */}
      <div className={`p-4 border-t border-border ${isCollapsed ? 'px-2' : 'px-4'}`}>
        {/* Settings */}
        <Link href="/dashboard/settings">
          <Button
            variant="ghost"
            className={`w-full justify-start mb-3 text-foreground hover:bg-accent ${
              isCollapsed ? 'px-2' : 'px-3'
            }`}
            title={isCollapsed ? "Settings" : ""}
          >
            <Settings className={`h-4 w-4 ${isCollapsed ? 'mr-0' : 'mr-3'}`} />
            {!isCollapsed && "Settings"}
          </Button>
        </Link>

        {/* Logout */}
        <Button
          variant="ghost"
          className={`w-full justify-start text-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 ${
            isCollapsed ? 'px-2' : 'px-3'
          }`}
          onClick={onLogout}
          title={isCollapsed ? "Logout" : ""}
        >
          <LogOut className={`h-4 w-4 ${isCollapsed ? 'mr-0' : 'mr-3'}`} />
          {!isCollapsed && "Logout"}
        </Button>

        {/* Theme Info */}
        {!isCollapsed && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Theme:</span>
              <span className="font-medium text-foreground capitalize">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <MobileToggle />
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex">
        <aside className={`h-screen bg-card border-r border-border fixed left-0 top-0 z-40 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}>
          {sidebarContent}
        </aside>
        
        {/* Spacer for main content */}
        <div className={`flex-shrink-0 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`} />
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-0 z-40 ${isMobileOpen ? 'block' : 'hidden'}`}>
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black/50"
          onClick={() => setIsMobileOpen(false)}
        />
        
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border z-50">
          {sidebarContent}
        </div>
      </div>
    </>
  );
}