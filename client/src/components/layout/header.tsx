import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { File } from "lucide-react";
import { truncateText } from "@/lib/utils";
import { useSubscription } from "@/hooks/use-subscription";
import { Crown } from "lucide-react";

export function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { subscriptionStatus } = useSubscription();

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/invoices", label: "Invoices" },
    { href: "/clients", label: "Clients" },
    { href: "/settings", label: "Settings" },
  ];

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <File className="text-primary h-6 w-6 mr-2" />
              <span className="text-xl font-semibold text-gray-900">InvoiceFlow</span>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`px-3 py-2 text-sm font-medium ${
                      location === item.href
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {item.label}
                  </a>
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            {user && (
              <>
                <button className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50">
                  <Crown className="text-secondary-500 h-4 w-4 mr-2" />
                  <span>{subscriptionStatus?.planName || "Free Plan"}</span>
                  <span className="ml-2 text-xs text-gray-400">
                    {subscriptionStatus?.isUnlimited 
                      ? "∞" 
                      : `${subscriptionStatus?.invoicesUsed}/${subscriptionStatus?.invoiceQuota}`}
                  </span>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700">
                      <span>{user.fullName?.charAt(0) || user.email.charAt(0)}</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{user.fullName || "User"}</span>
                        <span className="text-xs text-muted-foreground">
                          {truncateText(user.email, 20)}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/settings">
                      <DropdownMenuItem className="cursor-pointer">
                        Settings
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem
                      className="cursor-pointer text-destructive focus:text-destructive"
                      onClick={logout}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
