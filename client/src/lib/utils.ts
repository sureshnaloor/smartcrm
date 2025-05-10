import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { Country, Currency } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined, formatStr = 'PPP'): string {
  if (!date) return '';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error("Error formatting date:", error);
    return '';
  }
}

export function formatCurrency(
  amount: number | string | null | undefined, 
  currency = 'USD', 
  locale = 'en-US'
): string {
  if (amount === null || amount === undefined) return '';
  
  try {
    const numberAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberAmount);
  } catch (error) {
    console.error("Error formatting currency:", error);
    return '';
  }
}

export function formatNumber(
  number: number | string | null | undefined, 
  minimumFractionDigits = 2, 
  maximumFractionDigits = 2,
  locale = 'en-US'
): string {
  if (number === null || number === undefined) return '';
  
  try {
    const numberValue = typeof number === 'string' ? parseFloat(number) : number;
    
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(numberValue);
  } catch (error) {
    console.error("Error formatting number:", error);
    return '';
  }
}

export function generateInvoiceNumber(prefix = 'INV', padLength = 3): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.floor(Math.random() * Math.pow(10, padLength)).toString().padStart(padLength, '0');
  
  return `${prefix}-${year}${month}-${random}`;
}

export const countries: Country[] = [
  { code: 'GB', name: 'United Kingdom', taxName: 'VAT', defaultRate: 20 },
  { code: 'US', name: 'United States', taxName: 'Sales Tax', defaultRate: 0 },
  { code: 'DE', name: 'Germany', taxName: 'VAT', defaultRate: 19 },
  { code: 'FR', name: 'France', taxName: 'VAT', defaultRate: 20 },
  { code: 'JP', name: 'Japan', taxName: 'Consumption Tax', defaultRate: 10 },
  { code: 'CA', name: 'Canada', taxName: 'GST', defaultRate: 5 },
  { code: 'AU', name: 'Australia', taxName: 'GST', defaultRate: 10 },
  { code: 'IT', name: 'Italy', taxName: 'VAT', defaultRate: 22 },
  { code: 'ES', name: 'Spain', taxName: 'VAT', defaultRate: 21 },
  { code: 'NL', name: 'Netherlands', taxName: 'VAT', defaultRate: 21 },
];

export const currencies: Currency[] = [
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
];

export function getCountryByCode(code: string): Country | undefined {
  return countries.find(country => country.code === code);
}

export function getCurrencyByCode(code: string): Currency | undefined {
  return currencies.find(currency => currency.code === code);
}

export function calculateSubtotal(items: { amount: string | number }[]): number {
  return items.reduce((sum, item) => {
    const amount = typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount;
    return sum + amount;
  }, 0);
}

export function calculateTax(subtotal: number, discount: number, taxRate: number): number {
  const taxableAmount = subtotal - discount;
  return taxableAmount * (taxRate / 100);
}

export function calculateTotal(subtotal: number, discount: number, tax: number): number {
  return subtotal - discount + tax;
}

export function downloadPdf(pdfBlob: Blob, filename: string): void {
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function hasReachedQuota(invoicesUsed: number, invoiceQuota: number): boolean {
  if (invoiceQuota === -1) return false; // Unlimited
  return invoicesUsed >= invoiceQuota;
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
