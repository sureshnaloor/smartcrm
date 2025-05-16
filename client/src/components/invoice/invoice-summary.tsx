import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { CompanyProfile, Invoice, InvoiceItem, TaxRate } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface InvoiceSummaryProps {
  invoice: Invoice;
  items: InvoiceItem[];
  companyProfile?: CompanyProfile;
  currency: string;
}

export function InvoiceSummary({ 
  invoice, 
  items, 
  companyProfile,
  currency = "USD" 
}: InvoiceSummaryProps) {
  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    return sum + parseFloat(item.amount.toString());
  }, 0);

  // Get discount
  const discount = parseFloat(invoice.discount?.toString() || "0");

  // Get tax (VAT)
  const tax = parseFloat(invoice.tax?.toString() || "0");
  const taxRate = parseFloat(invoice.taxRate?.toString() || "0");

  // Calculate total
  const total = subtotal - discount + tax;

  // Fetch tax rates for the selected country
  const { data: taxRates = [] } = useQuery<TaxRate[]>({
    queryKey: [`/api/tax-rates/${invoice.country}`],
    enabled: !!invoice.country,
  });

  // Find the relevant tax rate
  const activeTaxRate: TaxRate | undefined = taxRates.find((rate: TaxRate) => 
    rate.isDefault && rate.countryCode === invoice.country
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        {/* Notes & Terms */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Notes</h3>
            <div className="text-sm text-gray-800 border border-gray-200 rounded-md p-3 bg-gray-50 min-h-[100px]">
              {invoice.notes || "No notes provided."}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-1">Payment Terms</h3>
            <div className="text-sm text-gray-800 border border-gray-200 rounded-md p-3 bg-gray-50 min-h-[100px]">
              {invoice.terms || "Payment due within 30 days."}
            </div>
          </div>
        </div>
      </div>
      <div>
        {/* Totals */}
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">Invoice Summary</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Subtotal:</span>
                <span className="text-sm font-medium text-gray-900 mono">
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Discount:</span>
                <span className="text-sm font-medium text-gray-900 mono">
                  {discount > 0 ? `-${formatCurrency(discount, currency)}` : formatCurrency(0, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">
                  {activeTaxRate?.name || 'Tax'} ({taxRate}%):
                </span>
                <span className="text-sm font-medium text-gray-900 mono">
                  {formatCurrency(tax, currency)}
                </span>
              </div>
              
              <div className="pt-2 mt-2 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-base font-medium text-gray-900">Total:</span>
                  <span className="text-base font-bold text-gray-900 mono">
                    {formatCurrency(total, currency)}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Bank Details */}
            {companyProfile && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Bank Details</h4>
                <div className="space-y-1 text-sm">
                  {companyProfile.bankName && (
                    <div className="grid grid-cols-3">
                      <span className="text-gray-500">Bank:</span>
                      <span className="col-span-2">{companyProfile.bankName}</span>
                    </div>
                  )}
                  {companyProfile.bankAccountName && (
                    <div className="grid grid-cols-3">
                      <span className="text-gray-500">Account Name:</span>
                      <span className="col-span-2">{companyProfile.bankAccountName}</span>
                    </div>
                  )}
                  {companyProfile.bankRoutingNumber && (
                    <div className="grid grid-cols-3">
                      <span className="text-gray-500">Sort Code/Routing:</span>
                      <span className="col-span-2 mono">{companyProfile.bankRoutingNumber}</span>
                    </div>
                  )}
                  {companyProfile.bankAccountNumber && (
                    <div className="grid grid-cols-3">
                      <span className="text-gray-500">Account Number:</span>
                      <span className="col-span-2 mono">{companyProfile.bankAccountNumber}</span>
                    </div>
                  )}
                  {companyProfile.bankIban && (
                    <div className="grid grid-cols-3">
                      <span className="text-gray-500">IBAN:</span>
                      <span className="col-span-2 mono">{companyProfile.bankIban}</span>
                    </div>
                  )}
                  {companyProfile.bankSwiftBic && (
                    <div className="grid grid-cols-3">
                      <span className="text-gray-500">SWIFT/BIC:</span>
                      <span className="col-span-2 mono">{companyProfile.bankSwiftBic}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
