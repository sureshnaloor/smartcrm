import { TaxRate } from '@shared/schema';

interface TaxCalculation {
  taxableAmount: number;
  taxAmount: number;
  totalAmount: number;
  effectiveRate: number;
}

export interface TaxContext {
  countryCode: string;
  taxRate?: TaxRate;
  isExempt?: boolean;
  customRate?: number;
}

/**
 * Calculate tax amount based on subtotal, discount, and tax context
 */
export function calculateTax(
  subtotal: number,
  discount: number = 0,
  context: TaxContext
): TaxCalculation {
  // Determine the effective tax rate
  let effectiveRate = 0;
  
  if (!context.isExempt) {
    if (context.customRate !== undefined) {
      // Use custom rate if provided
      effectiveRate = context.customRate;
    } else if (context.taxRate) {
      // Use the tax rate from the context
      effectiveRate = parseFloat(context.taxRate.rate.toString());
    } else {
      // Fallback to country-specific default rates
      effectiveRate = getDefaultRateForCountry(context.countryCode);
    }
  }
  
  // Calculate taxable amount (subtotal - discount)
  const taxableAmount = Math.max(0, subtotal - discount);
  
  // Calculate tax amount
  const taxAmount = (taxableAmount * effectiveRate) / 100;
  
  // Calculate total (taxable amount + tax)
  const totalAmount = taxableAmount + taxAmount;
  
  return {
    taxableAmount,
    taxAmount,
    totalAmount,
    effectiveRate
  };
}

/**
 * Get the default tax rate based on country code
 * These are common VAT/GST/Sales Tax rates for different countries
 */
function getDefaultRateForCountry(countryCode: string): number {
  const taxRates: Record<string, number> = {
    // European Union
    'AT': 20, // Austria
    'BE': 21, // Belgium
    'BG': 20, // Bulgaria
    'HR': 25, // Croatia
    'CY': 19, // Cyprus
    'CZ': 21, // Czech Republic
    'DK': 25, // Denmark
    'EE': 20, // Estonia
    'FI': 24, // Finland
    'FR': 20, // France
    'DE': 19, // Germany
    'GR': 24, // Greece
    'HU': 27, // Hungary
    'IE': 23, // Ireland
    'IT': 22, // Italy
    'LV': 21, // Latvia
    'LT': 21, // Lithuania
    'LU': 17, // Luxembourg
    'MT': 18, // Malta
    'NL': 21, // Netherlands
    'PL': 23, // Poland
    'PT': 23, // Portugal
    'RO': 19, // Romania
    'SK': 20, // Slovakia
    'SI': 22, // Slovenia
    'ES': 21, // Spain
    'SE': 25, // Sweden
    
    // Non-EU European countries
    'GB': 20, // United Kingdom
    'CH': 7.7, // Switzerland
    'NO': 25, // Norway
    
    // North America
    'US': 0,   // United States (no federal sales tax)
    'CA': 5,   // Canada (GST, provinces have additional taxes)
    'MX': 16,  // Mexico
    
    // Asia-Pacific
    'AU': 10,  // Australia
    'NZ': 15,  // New Zealand
    'JP': 10,  // Japan
    'SG': 8,   // Singapore
    'IN': 18,  // India (typical GST rate, varies by product)
    'CN': 13,  // China (typical VAT rate)
    
    // Others
    'BR': 17,  // Brazil (ICMS, typical rate)
    'RU': 20,  // Russia
    'ZA': 15,  // South Africa
  };
  
  return taxRates[countryCode] || 0;
}

/**
 * Format tax amount according to locale and currency
 */
export function formatTaxAmount(
  amount: number,
  currencyCode: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Check if a country uses VAT system
 */
export function isVatCountry(countryCode: string): boolean {
  // EU countries and some others use VAT
  const vatCountries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'CH', 'NO'
  ];
  
  return vatCountries.includes(countryCode);
}

/**
 * Get tax name for a specific country
 */
export function getTaxName(countryCode: string): string {
  if (isVatCountry(countryCode)) {
    return 'VAT';
  }
  
  const taxNames: Record<string, string> = {
    'US': 'Sales Tax',
    'CA': 'GST/HST',
    'AU': 'GST',
    'NZ': 'GST',
    'SG': 'GST',
    'JP': 'Consumption Tax',
    'IN': 'GST',
    'CN': 'VAT',
    'BR': 'ICMS',
    'MX': 'IVA',
    'ZA': 'VAT',
  };
  
  return taxNames[countryCode] || 'Tax';
}
