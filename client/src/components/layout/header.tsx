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
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center md:ml-64">
            <div className="flex-shrink-0 flex items-center">
              <File className="text-primary h-6 w-6 mr-2" />
              <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">InvoiceFlow</span>
            </div>
            <nav className="hidden md:ml-6 md:flex md:space-x-4">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <a
                    className={`px-3 py-2 text-sm font-medium ${
                      location === item.href
                        ? "text-primary border-b-2 border-primary"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
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
                <button className="flex items-center px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <Crown className="text-secondary-500 h-4 w-4 mr-2" />
                  <span>{subscriptionStatus?.planName || "Free Plan"}</span>
                  <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                    {subscriptionStatus?.isUnlimited 
                      ? "∞" 
                      : `${subscriptionStatus?.invoicesUsed}/${subscriptionStatus?.invoiceQuota}`}
                  </span>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-400">
                      <span>{user.fullName?.charAt(0) || user.email.charAt(0)}</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-gray-100">{user.fullName || "User"}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
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
