import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  File,
  Users,
  Settings,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  const menus = [
    {
      title: "Dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: "/",
    },
    {
      title: "Quotations",
      icon: <File className="h-5 w-5" />,
      path: "/quotations",
    },
    {
      title: "Invoices",
      icon: <File className="h-5 w-5" />,
      path: "/invoices",
    },
    {
      title: "Clients",
      icon: <Users className="h-5 w-5" />,
      path: "/clients",
    },
    {
      title: "Materials",
      icon: <LayoutDashboard className="h-5 w-5" />,
      path: "/materials",
    },
    {
      title: "Terms & Conditions",
      icon: <File className="h-5 w-5" />,
      path: "/terms",
    },
    {
      title: "Documents",
      icon: <File className="h-5 w-5" />,
      path: "/documents",
    },
    {
      title: "Settings",
      icon: <Settings className="h-5 w-5" />,
      path: "/settings",
    },
  ];

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-1 py-4">
        {menus.map((menu) => (
          <Link key={menu.path} href={menu.path}>
            <a
              className={cn(
                "group flex items-center px-3 py-2 text-sm font-medium rounded-md",
                location === menu.path
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              <div className="mr-3 flex-shrink-0">{menu.icon}</div>
              <span>{menu.title}</span>
              {location === menu.path && (
                <ChevronRight className="ml-auto h-5 w-5" />
              )}
            </a>
          </Link>
        ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="rounded-full shadow-lg"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 bg-sidebar">
            <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
              <div className="flex items-center">
                <File className="text-primary h-6 w-6 mr-2" />
                <span className="text-xl font-semibold">InvoiceFlow</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="px-4">
              <SidebarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop sidebar */}
      <div
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-sidebar border-r border-sidebar-border",
          className
        )}
      >
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="flex h-16 items-center justify-center px-4 border-b border-sidebar-border">
            <File className="text-primary h-6 w-6 mr-2" />
            <span className="text-xl font-semibold">InvoiceFlow</span>
          </div>
          <div className="flex-1 flex flex-col px-4">
            <SidebarContent />
          </div>
        </div>
      </div>
    </>
  );
}
