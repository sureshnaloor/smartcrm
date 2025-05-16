import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { InvoiceTemplate } from "@shared/schema";

interface InvoiceTemplateCardProps {
  template: InvoiceTemplate;
  selected: boolean;
  isPremium: boolean;
  hasPremiumAccess: boolean;
  onSelect: (templateId: string) => void;
}

function InvoiceTemplateCard({
  template,
  selected,
  isPremium,
  hasPremiumAccess,
  onSelect,
}: InvoiceTemplateCardProps) {
  return (
    <div
      className={cn(
        "relative border rounded-md overflow-hidden cursor-pointer group",
        selected
          ? "border-primary-500 bg-primary-50"
          : "border-gray-200 hover:border-primary-500",
        !hasPremiumAccess && isPremium && "opacity-60"
      )}
      onClick={() => hasPremiumAccess || !isPremium ? onSelect(template.id) : undefined}
    >
      {template.previewUrl && (
        <img
          src={template.previewUrl}
          alt={`${template.name} template preview`}
          className="w-full h-28 object-cover"
        />
      )}
      <div
        className={cn(
          "absolute inset-0 bg-primary-600 bg-opacity-0 transition-opacity flex items-center justify-center",
          selected ? "bg-opacity-10" : "group-hover:bg-opacity-20"
        )}
      >
        {selected && (
          <div className="bg-white rounded-full p-1">
            <Check className="h-4 w-4 text-primary-600" />
          </div>
        )}
      </div>
      <div className="p-2 text-xs text-center">
        <div className={cn("font-medium", selected ? "text-primary-700" : "text-gray-700")}>
          {template.name}
          {selected && " (Selected)"}
        </div>
        {isPremium && !hasPremiumAccess && (
          <span className="text-xs text-secondary-500">Premium</span>
        )}
      </div>
    </div>
  );
}

interface InvoiceTemplateSelectorProps {
  selectedTemplate: string;
  onTemplateChange: (templateId: string) => void;
}

export function InvoiceTemplateSelector({
  selectedTemplate,
  onTemplateChange,
}: InvoiceTemplateSelectorProps) {
  const { user } = useAuth();
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);

  // Check if user has premium access
  useEffect(() => {
    if (user) {
      setHasPremiumAccess(user.planId !== "free");
    }
  }, [user]);

  // Get templates
  const { data: templates = [] } = useQuery<InvoiceTemplate[]>({
    queryKey: ["/api/invoice-templates"],
  });

  return (
    <div className="mt-8 border-t border-gray-200 pt-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Choose Invoice Template</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {templates.map((template: InvoiceTemplate) => (
          <InvoiceTemplateCard
            key={template.id}
            template={template}
            selected={selectedTemplate === template.id}
            isPremium={template.isPremium ?? false}
            hasPremiumAccess={hasPremiumAccess}
            onSelect={onTemplateChange}
          />
        ))}
      </div>
      {!hasPremiumAccess && templates.some((t: InvoiceTemplate) => t.isPremium) && (
        <div className="mt-4 text-sm text-gray-600">
          <span className="text-secondary-500 font-medium">Upgrade to Premium</span> to access all premium templates.
        </div>
      )}
    </div>
  );
}
