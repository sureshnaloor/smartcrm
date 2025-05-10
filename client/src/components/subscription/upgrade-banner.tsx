import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

interface UpgradeBannerProps {
  className?: string;
  minimal?: boolean;
}

export function UpgradeBanner({ className, minimal = false }: UpgradeBannerProps) {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  
  if (!user || user.planId !== "free" || !showBanner) {
    return null;
  }

  if (minimal) {
    return (
      <div className="inline-flex">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-secondary-600 border-secondary-200 bg-secondary-50"
          onClick={() => setShowUpgradeDialog(true)}
        >
          <Crown className="mr-1 h-4 w-4 text-secondary-500" />
          Upgrade
        </Button>
        <UpgradeDialog 
          open={showUpgradeDialog} 
          onOpenChange={setShowUpgradeDialog} 
        />
      </div>
    );
  }

  return (
    <>
      <div className={`fixed bottom-4 right-4 z-10 ${className}`}>
        <Card className="w-72 shadow-lg">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-sm">Upgrade Your Plan</CardTitle>
                <CardDescription className="text-xs">
                  Create unlimited invoices with premium templates
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={() => setShowBanner(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="space-y-2">
              <div className="flex items-center">
                <Check className="text-green-500 h-4 w-4 mr-2" />
                <span className="text-xs text-gray-700">Remove InvoiceFlow branding</span>
              </div>
              <div className="flex items-center">
                <Check className="text-green-500 h-4 w-4 mr-2" />
                <span className="text-xs text-gray-700">Access to all premium templates</span>
              </div>
              <div className="flex items-center">
                <Check className="text-green-500 h-4 w-4 mr-2" />
                <span className="text-xs text-gray-700">Unlimited clients and invoices</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full bg-secondary-500 hover:bg-secondary-600" 
              onClick={() => setShowUpgradeDialog(true)}
            >
              Upgrade Now for £9.99/month
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <UpgradeDialog 
        open={showUpgradeDialog} 
        onOpenChange={setShowUpgradeDialog} 
      />
    </>
  );
}

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<string>("monthly");
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Plans data
  const plans = [
    {
      id: "monthly",
      name: "Professional",
      price: "9.99",
      interval: "monthly",
      features: [
        "Unlimited invoices",
        "All premium templates",
        "Excel import",
        "No branding",
        "Unlimited clients"
      ]
    },
    {
      id: "yearly",
      name: "Professional (Yearly)",
      price: "99.99",
      interval: "yearly",
      features: [
        "Unlimited invoices",
        "All premium templates",
        "Excel import",
        "No branding",
        "Unlimited clients",
        "Save 17% (2 months free)"
      ]
    },
    {
      id: "per-invoice",
      name: "Pay as you go",
      price: "19.99",
      interval: "one-time",
      features: [
        "10 invoices bundle",
        "All premium templates",
        "Excel import",
        "No branding",
        "Valid for 1 month"
      ]
    }
  ];

  const upgradeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await apiRequest("POST", "/api/subscription/upgrade", { planId });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Upgrade successful",
        description: "Your subscription has been upgraded successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Upgrade failed",
        description: error.message || "There was an error processing your upgrade.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpgrading(false);
    },
  });

  const handleUpgrade = () => {
    setIsUpgrading(true);
    upgradeMutation.mutate(selectedPlan);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Choose Your Plan</DialogTitle>
          <DialogDescription>
            Select the subscription plan that works best for your business needs.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-4">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`cursor-pointer transition-all ${
                selectedPlan === plan.id 
                  ? "ring-2 ring-primary-500 border-primary-500" 
                  : "hover:border-primary-300"
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center">
                  {selectedPlan === plan.id && (
                    <Check className="h-5 w-5 text-primary-500 mr-1" />
                  )}
                  {plan.name}
                </CardTitle>
                <div className="flex items-baseline mt-2">
                  <span className="text-2xl font-bold">
                    {formatCurrency(parseFloat(plan.price), 'GBP')}
                  </span>
                  <span className="text-sm text-gray-500 ml-1">
                    /{plan.interval === 'one-time' ? 'bundle' : plan.interval}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <LoadingButton
            onClick={handleUpgrade}
            loading={isUpgrading}
            loadingText="Processing..."
          >
            Upgrade to {plans.find(p => p.id === selectedPlan)?.name}
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
