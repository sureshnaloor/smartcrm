import { 
  User, Client, CompanyProfile, Invoice, 
  InvoiceItem, SubscriptionPlan, TaxRate, InvoiceTemplate 
} from "@shared/schema";

// Auth context types
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Form types for validation
export interface LoginFormValues {
  email: string;
  password: string;
}

export interface RegisterFormValues {
  email: string;
  fullName: string;
  password: string;
  confirmPassword: string;
}

export interface CompanyProfileFormValues {
  name: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankRoutingNumber?: string;
  bankSwiftBic?: string;
  bankIban?: string;
  isDefault?: boolean;
}

export interface ClientFormValues {
  name: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface InvoiceFormValues {
  invoiceNumber: string;
  invoiceDate: string | Date;
  dueDate?: string | Date;
  clientId: number;
  companyProfileId: number;
  country: string;
  currency: string;
  templateId?: string;
  discount?: string | number;
  notes?: string;
  terms?: string;
  status?: string;
}

export interface InvoiceItemFormValues {
  description: string;
  quantity: string | number;
  unitPrice: string | number;
  discount?: string | number;
}

// Extended models with computed or joined data
export interface InvoiceWithRelations extends Invoice {
  client?: Client;
  companyProfile?: CompanyProfile;
  items?: InvoiceItem[];
}

// Excel import type
export interface ExcelImportItem {
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

// Country data
export interface Country {
  code: string;
  name: string;
  taxName?: string;
  defaultRate?: number;
}

// Currency data
export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

// Subscription related
export interface SubscriptionStatus {
  planId: string;
  planName: string;
  invoicesUsed: number;
  invoiceQuota: number;
  isUnlimited: boolean;
  expiresAt?: Date | null;
}

// PDF generation
export interface GeneratePdfOptions {
  invoiceId: number;
  download?: boolean;
}
