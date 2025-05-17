import type {
  User, InsertUser,
  CompanyProfile, InsertCompanyProfile,
  Client, InsertClient,
  Invoice, InsertInvoice,
  InvoiceItem, InsertInvoiceItem,
  SubscriptionPlan, InsertSubscriptionPlan,
  TaxRate, InsertTaxRate,
  InvoiceTemplate, InsertInvoiceTemplate
} from "@shared/schema";

export interface IStorage {
  // User methods
  createUser(userData: InsertUser & { password: string }): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserSubscription(userId: number, planId: string, quota: number): Promise<User>;
  incrementInvoiceUsage(userId: number): Promise<void>;

  // Company profile methods
  getCompanyProfiles(userId: number): Promise<CompanyProfile[]>;
  getCompanyProfile(id: number): Promise<CompanyProfile | undefined>;
  getDefaultCompanyProfile(userId: number): Promise<CompanyProfile | undefined>;
  createCompanyProfile(profile: InsertCompanyProfile & { userId: number }): Promise<CompanyProfile>;
  updateCompanyProfile(id: number, profile: Partial<InsertCompanyProfile>): Promise<CompanyProfile>;
  deleteCompanyProfile(id: number): Promise<void>;

  // Client methods
  getClients(userId: number): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;

  // Invoice methods
  getInvoices(userId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: number): Promise<void>;

  // Invoice item methods
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem>;
  deleteInvoiceItem(id: number): Promise<void>;

  // Subscription plan methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan>;
  updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan>;
  deleteSubscriptionPlan(id: string): Promise<void>;

  // Tax rate methods
  getTaxRates(): Promise<TaxRate[]>;
  getTaxRatesByCountry(countryCode: string): Promise<TaxRate[]>;
  getDefaultTaxRate(countryCode: string): Promise<TaxRate | undefined>;
  getTaxRate(id: number): Promise<TaxRate | undefined>;
  createTaxRate(rate: InsertTaxRate): Promise<TaxRate>;
  updateTaxRate(id: number, rate: Partial<InsertTaxRate>): Promise<TaxRate>;
  deleteTaxRate(id: number): Promise<void>;

  // Invoice template methods
  getInvoiceTemplates(): Promise<InvoiceTemplate[]>;
  getInvoiceTemplate(id: string): Promise<InvoiceTemplate | undefined>;
  createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate>;
  updateInvoiceTemplate(id: string, template: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate>;
  deleteInvoiceTemplate(id: string): Promise<void>;
} 