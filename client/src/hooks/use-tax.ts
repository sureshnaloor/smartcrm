import { useQuery } from "@tanstack/react-query";
import { TaxRate } from "@shared/schema";

export function useTax(countryCode?: string) {
  // Fetch all tax rates
  const { data: allTaxRates = [] } = useQuery({
    queryKey: ["/api/tax-rates"],
  });

  // Fetch country-specific tax rates
  const { data: countryTaxRates = [] } = useQuery({
    queryKey: [`/api/tax-rates/${countryCode}`],
    enabled: !!countryCode,
  });

  // Get default tax rate for country
  const defaultTaxRate = (countryTaxRates as TaxRate[]).find(
    (rate: TaxRate) => rate.isDefault && rate.countryCode === countryCode
  );

  // Calculate tax amount
  const calculateTax = (
    subtotal: number,
    discount: number = 0,
    taxRate: number = defaultTaxRate?.rate ? parseFloat(defaultTaxRate.rate.toString()) : 0
  ) => {
    const taxableAmount = subtotal - discount;
    return (taxableAmount * taxRate) / 100;
  };

  return {
    allTaxRates,
    countryTaxRates,
    defaultTaxRate,
    calculateTax,
    isLoading: !allTaxRates,
  };
}
