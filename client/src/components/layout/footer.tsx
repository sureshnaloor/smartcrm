import { useSubscription } from "@/hooks/use-subscription";
import { HelpCircle, Book, Twitter } from "lucide-react";

export function Footer() {
  const { subscriptionStatus } = useSubscription();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center md:justify-start space-x-6 md:ml-64">
            <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span className="sr-only">Help Center</span>
              <HelpCircle className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span className="sr-only">Documentation</span>
              <Book className="w-5 h-5" />
            </a>
            <a href="#" className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span className="sr-only">Twitter</span>
              <Twitter className="w-5 h-5" />
            </a>
          </div>
          <div className="mt-8 md:mt-0">
            <p className="text-center md:text-right text-sm text-gray-400 dark:text-gray-500">
              <span className="block sm:inline">&copy; {currentYear} InvoiceFlow. All rights reserved.</span>
              {subscriptionStatus && (
                <span className="block sm:inline sm:ml-4">
                  {subscriptionStatus.planId === 'free'
                    ? `Free Plan: ${subscriptionStatus.invoicesUsed}/${subscriptionStatus.invoiceQuota} invoices used this month`
                    : subscriptionStatus.isUnlimited
                    ? 'Premium Plan: Unlimited invoices'
                    : `Premium Plan: ${subscriptionStatus.invoicesUsed}/${subscriptionStatus.invoiceQuota} invoices used`}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
