import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { SubscriptionStatus } from "@/types";

export function useSubscription() {
  const { user, isAuthenticated } = useAuth();
  
  // Get subscription plans
  const { data: plans = [] } = useQuery({
    queryKey: ["/api/subscription-plans"],
    enabled: isAuthenticated,
  });

  // Calculate subscription status
  const subscriptionStatus: SubscriptionStatus | null = user ? {
    planId: user.planId,
    planName: getPlanName(user.planId, plans as any[]),
    invoicesUsed: user.invoicesUsed ?? 0,
    invoiceQuota: user.invoiceQuota ?? 0,
    isUnlimited: user.invoiceQuota === -1,
    expiresAt: user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null,
  } : null;

  return {
    subscriptionStatus,
    plans,
    isLoading: !plans,
  };
}

// Helper function to get plan name from plans array
function getPlanName(planId: string, plans: any[]): string {
  const plan = plans.find(p => p.id === planId);
  return plan ? plan.name : planId === "free" ? "Free Plan" : 
         planId === "monthly" ? "Professional (Monthly)" : 
         planId === "yearly" ? "Professional (Yearly)" : 
         planId === "per-invoice" ? "Pay as you go" : "Unknown Plan";
}
