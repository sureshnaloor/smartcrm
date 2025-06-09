import {
  users, companyProfiles, clients, invoices, invoiceItems,
  subscriptionPlans, taxRates, invoiceTemplates,
  type User, type InsertUser,
  type CompanyProfile, type InsertCompanyProfile,
  type Client, type InsertClient,
  type Invoice, type InsertInvoice,
  type InvoiceItem, type InsertInvoiceItem,
  type SubscriptionPlan, type InsertSubscriptionPlan,
  type TaxRate, type InsertTaxRate,
  type InvoiceTemplate, type InsertInvoiceTemplate,
  type MasterItem, type InsertMasterItem,
  type CompanyItem, type InsertCompanyItem,
  type MasterTerm, type InsertMasterTerm,
  type CompanyTerm, type InsertCompanyTerm,
  type Document, type InsertDocument,
  type Quotation, type InsertQuotation,
  type QuotationItem, type InsertQuotationItem,
  type QuotationDocument, type InsertQuotationDocument,
  type QuotationTerm, type InsertQuotationTerm,
  type MaterialUsage, type InsertMaterialUsage
} from "@shared/schema";
import { QuotationStorage } from "./quotation-storage";
import crypto from "crypto";
import { DatabaseStorage } from "./db-storage";

// Storage interface
export interface IStorage {
  // User methods
  createUser(userData: InsertUser & { password: string }): Promise<User>;
  getUserById(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUserSubscription(userId: number, planId: string, quota: number): Promise<User>;
  incrementInvoiceUsage(userId: number): Promise<void>;
  incrementQuoteUsage(userId: number): Promise<void>;
  incrementMaterialUsage(userId: number): Promise<void>;
  
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
  createClient(client: InsertClient & { userId: number }): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: number): Promise<void>;
  getCentralRepoClients(): Promise<Client[]>;
  
  // Material and Service methods
  getMasterItems(category?: string): Promise<MasterItem[]>;
  getMasterItem(id: number): Promise<MasterItem | undefined>;
  getMasterItemByCode(code: string): Promise<MasterItem | undefined>;
  createMasterItem(item: InsertMasterItem): Promise<MasterItem>;
  updateMasterItem(id: number, item: Partial<InsertMasterItem>): Promise<MasterItem>;
  deleteMasterItem(id: number): Promise<void>;
  
  // Company item methods
  getCompanyItems(userId: number, category?: string): Promise<CompanyItem[]>;
  getCompanyItem(id: number): Promise<CompanyItem | undefined>;
  createCompanyItem(item: InsertCompanyItem): Promise<CompanyItem>;
  updateCompanyItem(id: number, item: Partial<InsertCompanyItem>): Promise<CompanyItem>;
  deleteCompanyItem(id: number): Promise<void>;
  
  // Terms methods
  getMasterTerms(category?: string): Promise<MasterTerm[]>;
  getMasterTerm(id: number): Promise<MasterTerm | undefined>;
  createMasterTerm(term: InsertMasterTerm): Promise<MasterTerm>;
  updateMasterTerm(id: number, term: Partial<InsertMasterTerm>): Promise<MasterTerm>;
  deleteMasterTerm(id: number): Promise<void>;
  
  // Company terms methods
  getCompanyTerms(userId: number, category?: string): Promise<CompanyTerm[]>;
  getCompanyTerm(id: number): Promise<CompanyTerm | undefined>;
  createCompanyTerm(term: InsertCompanyTerm): Promise<CompanyTerm>;
  updateCompanyTerm(id: number, term: Partial<InsertCompanyTerm>): Promise<CompanyTerm>;
  deleteCompanyTerm(id: number): Promise<void>;

  // Document methods
  getUserDocuments(userId: number, type?: string): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  deleteDocument(id: number): Promise<void>;
  
  // Quotation methods
  getQuotations(userId: number): Promise<Quotation[]>;
  getQuotation(id: number): Promise<Quotation | undefined>;
  createQuotation(quotation: InsertQuotation): Promise<Quotation>;
  updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation>;
  deleteQuotation(id: number): Promise<void>;
  
  // Quotation items methods
  getQuotationItems(quotationId: number): Promise<QuotationItem[]>;
  createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem>;
  updateQuotationItem(id: number, item: Partial<InsertQuotationItem>): Promise<QuotationItem>;
  deleteQuotationItem(id: number): Promise<void>;
  
  // Quotation document methods
  getQuotationDocuments(quotationId: number): Promise<QuotationDocument[]>;
  createQuotationDocument(doc: InsertQuotationDocument): Promise<QuotationDocument>;
  deleteQuotationDocument(id: number): Promise<void>;
  
  // Quotation terms methods
  getQuotationTerms(quotationId: number): Promise<QuotationTerm[]>;
  createQuotationTerm(term: InsertQuotationTerm): Promise<QuotationTerm>;
  updateQuotationTerm(id: number, term: Partial<InsertQuotationTerm>): Promise<QuotationTerm>;
  deleteQuotationTerm(id: number): Promise<void>;
  
  // Material usage methods
  trackMaterialUsage(usage: InsertMaterialUsage): Promise<MaterialUsage>;
  getMaterialUsage(userId: number): Promise<MaterialUsage[]>;
  
  // Invoice methods
  getInvoices(userId: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice & { 
    userId: number;
    companyProfileId: number;
    clientId: number;
    dueDate?: Date;
    discount?: string;
    taxRate?: string;
    quotationId?: number;
    invoiceDate?: Date;
  }): Promise<Invoice>;
  updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice>;
  deleteInvoice(id: number): Promise<void>;
  
  // Invoice items methods
  getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]>;
  createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem>;
  updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem>;
  deleteInvoiceItem(id: number): Promise<void>;
  
  // Subscription plan methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined>;
  
  // Tax rate methods
  getTaxRates(): Promise<TaxRate[]>;
  getTaxRatesByCountry(countryCode: string): Promise<TaxRate[]>;
  getDefaultTaxRate(countryCode: string): Promise<TaxRate | undefined>;
  
  // Invoice/Quotation template methods
  getInvoiceTemplates(includesPremium: boolean, type?: string): Promise<InvoiceTemplate[]>;
  getInvoiceTemplate(id: string): Promise<InvoiceTemplate | undefined>;
}

// In-Memory Storage Implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companyProfiles: Map<number, CompanyProfile>;
  private clients: Map<number, Client>;
  private invoices: Map<number, Invoice>;
  private invoiceItems: Map<number, InvoiceItem>;
  private subscriptionPlans: Map<string, SubscriptionPlan>;
  private taxRates: Map<number, TaxRate>;
  private invoiceTemplates: Map<string, InvoiceTemplate>;
  
  private currentUserId = 1;
  private currentCompanyProfileId = 1;
  private currentClientId = 1;
  private currentInvoiceId = 1;
  private currentInvoiceItemId = 1;
  private currentTaxRateId = 1;
  
  constructor() {
    this.users = new Map();
    this.companyProfiles = new Map();
    this.clients = new Map();
    this.invoices = new Map();
    this.invoiceItems = new Map();
    this.subscriptionPlans = new Map();
    this.taxRates = new Map();
    this.invoiceTemplates = new Map();
    
    // Initialize default subscription plans
    this.subscriptionPlans.set("free", {
      id: "free",
      name: "Free Plan",
      price: "0",
      interval: "monthly" as const,
      features: ["5 clients", "10 invoices/month", "Basic templates", "PDF generation"],
      invoiceQuota: 10,
      quoteQuota: 5,
      materialRecordsLimit: 50,
      includesCentralMasters: false,
      isActive: true
    });
    
    this.subscriptionPlans.set("monthly", {
      id: "monthly",
      name: "Professional",
      price: "9.99",
      interval: "monthly" as const,
      features: ["Unlimited clients", "Unlimited invoices", "All templates", "Excel import", "No branding"],
      invoiceQuota: -1,
      quoteQuota: -1,
      materialRecordsLimit: -1,
      includesCentralMasters: true,
      isActive: true
    });
    
    this.subscriptionPlans.set("yearly", {
      id: "yearly",
      name: "Professional (Yearly)",
      price: "99.99",
      interval: "yearly" as const,
      features: ["Unlimited clients", "Unlimited invoices", "All templates", "Excel import", "No branding", "2 months free"],
      invoiceQuota: -1,
      quoteQuota: -1,
      materialRecordsLimit: -1,
      includesCentralMasters: true,
      isActive: true
    });
    
    this.subscriptionPlans.set("per-invoice", {
      id: "per-invoice",
      name: "Pay as you go",
      price: "19.99",
      interval: "one-time" as const,
      features: ["10 invoices bundle", "All templates", "Excel import", "No branding", "Valid for 1 month"],
      invoiceQuota: 10,
      quoteQuota: 5,
      materialRecordsLimit: 50,
      includesCentralMasters: false,
      isActive: true
    });
    
    // Initialize default tax rates
    const defaultTaxRates = [
      { name: "Standard Rate", country: "United States", countryCode: "US", rate: "7.5", isDefault: true },
      { name: "Reduced Rate", country: "United States", countryCode: "US", rate: "5.0", isDefault: false },
      { name: "Standard Rate", country: "United Kingdom", countryCode: "GB", rate: "20.0", isDefault: true },
      { name: "Reduced Rate", country: "United Kingdom", countryCode: "GB", rate: "5.0", isDefault: false }
    ];
    
    defaultTaxRates.forEach(taxRate => {
      const id = this.currentTaxRateId++;
      const taxRateWithId: TaxRate = {
        id,
        name: String(taxRate.name ?? ""),
        country: String(taxRate.country ?? ""),
        countryCode: String(taxRate.countryCode ?? ""),
        rate: String(taxRate.rate ?? "0"),
        isDefault: Boolean(taxRate.isDefault)
      };
      this.taxRates.set(id, taxRateWithId);
    });
    
    // Initialize invoice templates
    const defaultTemplates: (Omit<InvoiceTemplate, "id"> & { id: string })[] = [
      { id: "classic", name: "Classic", type: "invoice", previewUrl: "https://images.unsplash.com/photo-1616531770192-6eaea74c2456", isDefault: true, isPremium: false },
      { id: "modern-blue", name: "Modern Blue", type: "invoice", previewUrl: "https://images.unsplash.com/photo-1586892477838-2b96e85e0f96", isDefault: false, isPremium: false },
      { id: "executive", name: "Executive", type: "invoice", previewUrl: "https://images.unsplash.com/photo-1618044733300-9472054094ee", isDefault: false, isPremium: true },
      { id: "minimal", name: "Minimal", type: "invoice", previewUrl: "https://images.unsplash.com/photo-1636633762833-5d1658f1e29b", isDefault: false, isPremium: false },
      { id: "dynamic", name: "Dynamic", type: "invoice", previewUrl: "https://images.unsplash.com/photo-1586282391129-76a6df230234", isDefault: false, isPremium: true },
      { id: "geometric", name: "Geometric", type: "invoice", previewUrl: "https://images.unsplash.com/photo-1542621334-a254cf47733d", isDefault: false, isPremium: true },
    ];
    
    defaultTemplates.forEach(template => {
      this.invoiceTemplates.set(template.id, template);
    });
  }
  
  // User methods
  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const { password, ...rest } = userData;
    const passwordHash = this.hashPassword(password);
    
    const id = this.currentUserId++;
    const user: User = {
      id,
      email: rest.email,
      fullName: rest.fullName ?? null,
      passwordHash,
      createdAt: new Date(),
      planId: "free",
      invoiceQuota: 10,
      invoicesUsed: 0,
      quoteQuota: 5,
      quotesUsed: 0,
      materialRecordsUsed: 0,
      subscriptionStatus: "active" as const,
      subscriptionExpiresAt: null
    };
    
    this.users.set(id, user);
    return user;
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }
  
  async updateUserSubscription(userId: number, planId: string, quota: number): Promise<User> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    
    const updatedUser: User = {
      ...user,
      planId,
      invoiceQuota: quota,
      invoicesUsed: 0,
      subscriptionStatus: "active" as const,
      subscriptionExpiresAt: planId === "per-invoice" 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        : null
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async incrementInvoiceUsage(userId: number): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    
    const updatedUser: User = {
      ...user,
      invoicesUsed: (user.invoicesUsed ?? 0) + 1
    };
    
    this.users.set(userId, updatedUser);
  }
  
  // Company profile methods
  async getCompanyProfiles(userId: number): Promise<CompanyProfile[]> {
    return Array.from(this.companyProfiles.values())
      .filter(profile => profile.userId === userId);
  }
  
  async getCompanyProfile(id: number): Promise<CompanyProfile | undefined> {
    return this.companyProfiles.get(id);
  }
  
  async getDefaultCompanyProfile(userId: number): Promise<CompanyProfile | undefined> {
    return Array.from(this.companyProfiles.values())
      .find(profile => profile.userId === userId && profile.isDefault);
  }
  
  async createCompanyProfile(profile: InsertCompanyProfile & { userId: number }): Promise<CompanyProfile> {
    const id = this.currentCompanyProfileId++;
    
    const existingProfiles = await this.getCompanyProfiles(profile.userId);
    const isDefault = existingProfiles.length === 0 ? true : profile.isDefault || false;
    
    if (isDefault) {
      for (const existingProfile of existingProfiles) {
        if (existingProfile.isDefault) {
          this.companyProfiles.set(existingProfile.id, {
            ...existingProfile,
            isDefault: false
          });
        }
      }
    }
    
    const companyProfile: CompanyProfile = {
      id,
      name: String(profile.name ?? null),
      userId: profile.userId as number,
      email: profile.email ?? null,
      taxId: profile.taxId ?? null,
      address: profile.address ?? null,
      city: profile.city ?? null,
      state: profile.state ?? null,
      postalCode: profile.postalCode ?? null,
      country: profile.country ?? null,
      phone: profile.phone ?? null,
      website: profile.website ?? null,
      logoUrl: profile.logoUrl ?? null,
      bankName: profile.bankName ?? null,
      bankAccountName: profile.bankAccountName ?? null,
      bankAccountNumber: profile.bankAccountNumber ?? null,
      bankRoutingNumber: profile.bankRoutingNumber ?? null,
      bankSwiftBic: profile.bankSwiftBic ?? null,
      bankIban: profile.bankIban ?? null,
      isDefault: isDefault as boolean
    };
    
    this.companyProfiles.set(id, companyProfile);
    return companyProfile;
  }
  
  async updateCompanyProfile(id: number, profile: Partial<InsertCompanyProfile>): Promise<CompanyProfile> {
    const existingProfile = await this.getCompanyProfile(id);
    if (!existingProfile) throw new Error(`Company profile with ID ${id} not found`);
    
    // If we're setting this profile as default, unset any existing default
    if (profile.isDefault) {
      const existingProfiles = await this.getCompanyProfiles(existingProfile.userId);
      for (const otherProfile of existingProfiles) {
        if (otherProfile.id !== id && otherProfile.isDefault) {
          this.companyProfiles.set(otherProfile.id, {
            ...otherProfile,
            isDefault: false
          });
        }
      }
    }
    
    const updatedProfile: CompanyProfile = {
      ...existingProfile,
      ...profile,
      userId: existingProfile.userId,
      isDefault: Boolean(profile.isDefault),
      name: String(profile.name ?? existingProfile.name),
      email: profile.email ?? existingProfile.email,
      taxId: profile.taxId ?? existingProfile.taxId,
      address: profile.address ?? existingProfile.address,
      city: profile.city ?? existingProfile.city,
      state: profile.state ?? existingProfile.state,
      postalCode: profile.postalCode ?? existingProfile.postalCode,
      country: profile.country ?? existingProfile.country,
      phone: profile.phone ?? existingProfile.phone,
      website: profile.website ?? existingProfile.website,
      logoUrl: profile.logoUrl ?? existingProfile.logoUrl,
      bankName: profile.bankName ?? existingProfile.bankName,
      bankAccountName: profile.bankAccountName ?? existingProfile.bankAccountName,
      bankAccountNumber: profile.bankAccountNumber ?? existingProfile.bankAccountNumber,
      bankRoutingNumber: profile.bankRoutingNumber ?? existingProfile.bankRoutingNumber,
      bankSwiftBic: profile.bankSwiftBic ?? existingProfile.bankSwiftBic,
      bankIban: profile.bankIban ?? existingProfile.bankIban
    };
    
    this.companyProfiles.set(id, updatedProfile);
    return updatedProfile;
  }
  
  async deleteCompanyProfile(id: number): Promise<void> {
    const profile = await this.getCompanyProfile(id);
    if (!profile) throw new Error(`Company profile with ID ${id} not found`);
    
    // Check if this profile is used in any invoices
    const invoicesUsingProfile = Array.from(this.invoices.values())
      .filter(invoice => invoice.companyProfileId === id);
    
    if (invoicesUsingProfile.length > 0) {
      throw new Error("Cannot delete company profile that is used in invoices");
    }
    
    // If we're deleting the default profile, make another one default
    if (profile.isDefault) {
      const otherProfiles = Array.from(this.companyProfiles.values())
        .filter(p => p.userId === profile.userId && p.id !== id);
      
      if (otherProfiles.length > 0) {
        const newDefault = otherProfiles[0];
        this.companyProfiles.set(newDefault.id, {
          ...newDefault,
          isDefault: true
        });
      }
    }
    
    this.companyProfiles.delete(id);
  }
  
  // Client methods
  async getClients(userId: number): Promise<Client[]> {
    return Array.from(this.clients.values())
      .filter(client => client.userId === userId);
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    return this.clients.get(id);
  }
  
  async createClient(client: InsertClient & { userId: number }): Promise<Client> {
    const id = this.currentClientId++;
    const newClient: Client = {
      id,
      ...client,
      name: String(client.name),
      email: client.email ?? null,
      taxId: client.taxId ?? null,
      address: client.address ?? null,
      city: client.city ?? null,
      state: client.state ?? null,
      postalCode: client.postalCode ?? null,
      country: client.country ?? null,
      phone: client.phone ?? null,
      notes: client.notes ?? null,
      isFromCentralRepo: Boolean(client.isFromCentralRepo)
    };
    
    this.clients.set(id, newClient);
    return newClient;
  }
  
  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const existingClient = await this.getClient(id);
    if (!existingClient) throw new Error(`Client with ID ${id} not found`);
    
    const updatedClient: Client = {
      ...existingClient,
      ...client,
      userId: existingClient.userId,
      name: String(client.name ?? existingClient.name),
      email: client.email ?? existingClient.email,
      taxId: client.taxId ?? existingClient.taxId,
      address: client.address ?? existingClient.address,
      city: client.city ?? existingClient.city,
      state: client.state ?? existingClient.state,
      postalCode: client.postalCode ?? existingClient.postalCode,
      country: client.country ?? existingClient.country,
      phone: client.phone ?? existingClient.phone,
      notes: client.notes ?? existingClient.notes,
      isFromCentralRepo: Boolean(client.isFromCentralRepo)
    };
    
    this.clients.set(id, updatedClient);
    return updatedClient;
  }
  
  async deleteClient(id: number): Promise<void> {
    const client = await this.getClient(id);
    if (!client) throw new Error(`Client with ID ${id} not found`);
    
    // Check if this client is used in any invoices
    const invoicesUsingClient = Array.from(this.invoices.values())
      .filter(invoice => invoice.clientId === id);
    
    if (invoicesUsingClient.length > 0) {
      throw new Error("Cannot delete client that is used in invoices");
    }
    
    this.clients.delete(id);
  }
  
  // Invoice methods
  async getInvoices(userId: number): Promise<Invoice[]> {
    return Array.from(this.invoices.values())
      .filter(invoice => invoice.userId === userId);
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    return this.invoices.get(id);
  }
  
  async createInvoice(invoice: InsertInvoice & { 
    userId: number;
    companyProfileId: number;
    clientId: number;
    dueDate?: Date;
    discount?: string;
    taxRate?: string;
    quotationId?: number;
    invoiceDate?: Date;
  }): Promise<Invoice> {
    const id = this.currentInvoiceId++;
    const now = new Date();
    
    const newInvoice: Invoice = {
      id,
      createdAt: now,
      status: invoice.status ?? "draft",
      userId: invoice.userId as number,
      country: invoice.country,
      companyProfileId: invoice.companyProfileId as number,
      notes: invoice.notes ?? null,
      clientId: invoice.clientId as number,
      currency: invoice.currency,
      templateId: invoice.templateId ?? null,
      subtotal: "0",
      tax: "0",
      total: "0",
      updatedAt: now,
      pdfUrl: null,
      dueDate: invoice.dueDate instanceof Date ? invoice.dueDate : null,
      discount: invoice.discount as string ?? null,
      taxRate: invoice.taxRate as string ?? null,
      terms: invoice.terms ?? null,
      quotationId: invoice.quotationId ? Number(invoice.quotationId) : null,
      invoiceNumber: invoice.invoiceNumber ?? null,
      invoiceDate: invoice.invoiceDate instanceof Date ? invoice.invoiceDate : now
    };
    
    this.invoices.set(id, newInvoice);
    return newInvoice;
  }
  
  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const existingInvoice = await this.getInvoice(id);
    if (!existingInvoice) throw new Error(`Invoice with ID ${id} not found`);
    
    const updatedInvoice: Invoice = {
      ...existingInvoice,
      ...invoice,
      userId: existingInvoice.userId,
      companyProfileId: existingInvoice.companyProfileId,
      clientId: existingInvoice.clientId,
      status: invoice.status ?? existingInvoice.status,
      country: invoice.country ?? existingInvoice.country,
      notes: invoice.notes ?? existingInvoice.notes,
      currency: invoice.currency ?? existingInvoice.currency,
      templateId: invoice.templateId ?? existingInvoice.templateId,
      discount: invoice.discount?.toString() ?? existingInvoice.discount,
      tax: invoice.tax?.toString() ?? existingInvoice.tax,
      taxRate: invoice.taxRate?.toString() ?? existingInvoice.taxRate,
      terms: invoice.terms ?? existingInvoice.terms,
      quotationId: invoice.quotationId ? Number(invoice.quotationId) : existingInvoice.quotationId,
      invoiceNumber: invoice.invoiceNumber ?? existingInvoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate instanceof Date ? new Date(invoice.invoiceDate) : existingInvoice.invoiceDate,
      dueDate: invoice.dueDate instanceof Date ? new Date(invoice.dueDate) : existingInvoice.dueDate,
      updatedAt: new Date()
    };
    
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
  
  async deleteInvoice(id: number): Promise<void> {
    const invoice = await this.getInvoice(id);
    if (!invoice) throw new Error(`Invoice with ID ${id} not found`);
    
    // Delete associated invoice items
    const itemsToDelete = Array.from(this.invoiceItems.values())
      .filter(item => item.invoiceId === id);
    
    for (const item of itemsToDelete) {
      this.invoiceItems.delete(item.id);
    }
    
    this.invoices.delete(id);
  }
  
  // Invoice items methods
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return Array.from(this.invoiceItems.values())
      .filter(item => item.invoiceId === invoiceId);
  }
  
  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const quantity = parseFloat(item.quantity.toString());
    const unitPrice = parseFloat(item.unitPrice.toString());
    const discount = parseFloat(item.discount?.toString() || "0");
    
    const amount = (quantity * unitPrice * (1 - discount / 100)).toFixed(2);
    
    const id = this.currentInvoiceItemId++;
    const newItem: InvoiceItem = {
      id,
      description: String(item.description),
      discount: item.discount?.toString() ?? "0",
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice.toString(),
      amount,
      invoiceId: typeof item.invoiceId === 'number' ? item.invoiceId : Number(item.invoiceId) || 0,
      quotationItemId: item.quotationItemId ? Number(item.quotationItemId) : null
    };
    
    this.invoiceItems.set(id, newItem);
    await this.recalculateInvoiceTotals(typeof item.invoiceId === 'number' ? item.invoiceId : Number(item.invoiceId) || 0);
    
    return newItem;
  }
  
  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    const existingItem = Array.from(this.invoiceItems.values())
      .find(i => i.id === id);
    
    if (!existingItem) throw new Error(`Invoice item with ID ${id} not found`);
    
    // Recalculate amount if necessary
    let amount = existingItem.amount;
    if (item.quantity !== undefined || item.unitPrice !== undefined || item.discount !== undefined) {
      const quantity = parseFloat((item.quantity || existingItem.quantity).toString());
      const unitPrice = parseFloat((item.unitPrice || existingItem.unitPrice).toString());
      const discount = parseFloat((item.discount || existingItem.discount || "0").toString());
      
      amount = (quantity * unitPrice * (1 - discount / 100)).toFixed(2);
    }
    
    const updatedItem: InvoiceItem = {
      ...existingItem,
      ...item,
      discount: item.discount?.toString() ?? existingItem.discount,
      quantity: item.quantity?.toString() ?? existingItem.quantity,
      unitPrice: item.unitPrice?.toString() ?? existingItem.unitPrice,
      amount,
      invoiceId: item.invoiceId ? Number(item.invoiceId) : existingItem.invoiceId,
      quotationItemId: item.quotationItemId ? Number(item.quotationItemId) : existingItem.quotationItemId
    };
    
    this.invoiceItems.set(id, updatedItem);
    
    // Update invoice totals
    await this.recalculateInvoiceTotals(existingItem.invoiceId);
    
    return updatedItem;
  }
  
  async deleteInvoiceItem(id: number): Promise<void> {
    const item = Array.from(this.invoiceItems.values())
      .find(i => i.id === id);
    
    if (!item) throw new Error(`Invoice item with ID ${id} not found`);
    
    this.invoiceItems.delete(id);
    
    // Update invoice totals
    await this.recalculateInvoiceTotals(item.invoiceId);
  }
  
  // Subscription plan methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return Array.from(this.subscriptionPlans.values())
      .filter(plan => plan.isActive);
  }
  
  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    return this.subscriptionPlans.get(id);
  }
  
  // Tax rate methods
  async getTaxRates(): Promise<TaxRate[]> {
    return Array.from(this.taxRates.values());
  }
  
  async getTaxRatesByCountry(countryCode: string): Promise<TaxRate[]> {
    return Array.from(this.taxRates.values())
      .filter(tax => tax.countryCode === countryCode);
  }
  
  async getDefaultTaxRate(countryCode: string): Promise<TaxRate | undefined> {
    return Array.from(this.taxRates.values())
      .find(tax => tax.countryCode === countryCode && tax.isDefault);
  }
  
  // Invoice template methods
  async getInvoiceTemplates(includesPremium: boolean, type?: string): Promise<InvoiceTemplate[]> {
    return Array.from(this.invoiceTemplates.values())
      .filter(template => !template.isPremium || includesPremium);
  }
  
  async getInvoiceTemplate(id: string): Promise<InvoiceTemplate | undefined> {
    return this.invoiceTemplates.get(id);
  }
  
  // Helper methods
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
  
  private recalculateInvoiceTotals(invoiceId: number): void {
    const invoice = Array.from(this.invoices.values()).find(inv => inv.id === invoiceId);
    if (!invoice) return;

    const items = Array.from(this.invoiceItems.values()).filter(item => item.invoiceId === invoiceId);
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice);
      const discount = Number(item.discount) || 0;
      return sum + (itemTotal - discount);
    }, 0);

    const taxAmount = items.reduce((sum, item) => {
      const itemTotal = Number(item.quantity) * Number(item.unitPrice);
      const discount = Number(item.discount) || 0;
      const taxableAmount = itemTotal - discount;
      const taxRate = invoice.taxRate ? Number(invoice.taxRate) : 0;
      return sum + (taxableAmount * taxRate / 100);
    }, 0);

    invoice.subtotal = subtotal.toString();
    invoice.tax = taxAmount.toString();
    invoice.total = (subtotal + taxAmount).toString();
  }

  async createTaxRate(taxRate: Omit<TaxRate, "id">): Promise<TaxRate> {
    const id = this.getNextId(this.taxRates);
    const newTaxRate: TaxRate = {
      id,
      name: String(taxRate.name),
      country: String(taxRate.country),
      countryCode: String(taxRate.countryCode),
      rate: String(taxRate.rate),
      isDefault: Boolean(taxRate.isDefault)
    };
    this.taxRates.set(id, newTaxRate);
    return newTaxRate;
  }

  async seedDefaultData(): Promise<void> {
    // Add default tax rates
    const defaultTaxRates = [
      { name: "Standard Rate", country: "United States", countryCode: "US", rate: "7.5", isDefault: true },
      { name: "Reduced Rate", country: "United States", countryCode: "US", rate: "5.0", isDefault: false },
      { name: "Standard Rate", country: "United Kingdom", countryCode: "GB", rate: "20.0", isDefault: true },
      { name: "Reduced Rate", country: "United Kingdom", countryCode: "GB", rate: "5.0", isDefault: false }
    ];

    for (const taxRate of defaultTaxRates) {
      await this.createTaxRate(taxRate);
    }
  }

  // Add missing methods
  async incrementQuoteUsage(userId: number): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    // Implementation for quote usage tracking
  }

  async incrementMaterialUsage(userId: number): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    // Implementation for material usage tracking
  }

  async getCentralRepoClients(): Promise<Client[]> {
    return Array.from(this.clients.values())
      .filter(client => client.isFromCentralRepo);
  }

  async getMasterItems(category?: string): Promise<MasterItem[]> {
    return []; // Implementation for master items
  }

  async getMasterItem(id: number): Promise<MasterItem | undefined> {
    return undefined; // Implementation for master item
  }

  async getMasterItemByCode(code: string): Promise<MasterItem | undefined> {
    return undefined; // Implementation for master item by code
  }

  async createMasterItem(item: InsertMasterItem): Promise<MasterItem> {
    throw new Error("Not implemented"); // Implementation for creating master item
  }

  async updateMasterItem(id: number, item: Partial<InsertMasterItem>): Promise<MasterItem> {
    throw new Error("Not implemented"); // Implementation for updating master item
  }

  async deleteMasterItem(id: number): Promise<void> {
    // Implementation for deleting master item
  }

  // Add remaining missing methods
  async getCompanyItems(userId: number, category?: string): Promise<CompanyItem[]> { return []; }
  async getCompanyItem(id: number): Promise<CompanyItem | undefined> { return undefined; }
  async createCompanyItem(item: InsertCompanyItem): Promise<CompanyItem> { throw new Error("Not implemented"); }
  async updateCompanyItem(id: number, item: Partial<InsertCompanyItem>): Promise<CompanyItem> { throw new Error("Not implemented"); }
  async deleteCompanyItem(id: number): Promise<void> {}
  async getMasterTerms(category?: string): Promise<MasterTerm[]> { return []; }
  async getMasterTerm(id: number): Promise<MasterTerm | undefined> { return undefined; }
  async createMasterTerm(term: InsertMasterTerm): Promise<MasterTerm> { throw new Error("Not implemented"); }
  async updateMasterTerm(id: number, term: Partial<InsertMasterTerm>): Promise<MasterTerm> { throw new Error("Not implemented"); }
  async deleteMasterTerm(id: number): Promise<void> {}
  async getCompanyTerms(userId: number, category?: string): Promise<CompanyTerm[]> { return []; }
  async getCompanyTerm(id: number): Promise<CompanyTerm | undefined> { return undefined; }
  async createCompanyTerm(term: InsertCompanyTerm): Promise<CompanyTerm> { throw new Error("Not implemented"); }
  async updateCompanyTerm(id: number, term: Partial<InsertCompanyTerm>): Promise<CompanyTerm> { throw new Error("Not implemented"); }
  async deleteCompanyTerm(id: number): Promise<void> {}
  async getUserDocuments(userId: number, type?: string): Promise<Document[]> { return []; }
  async getDocument(id: number): Promise<Document | undefined> { return undefined; }
  async createDocument(document: InsertDocument): Promise<Document> { throw new Error("Not implemented"); }
  async deleteDocument(id: number): Promise<void> {}
  async getQuotations(userId: number): Promise<Quotation[]> { return []; }
  async getQuotation(id: number): Promise<Quotation | undefined> { return undefined; }
  async createQuotation(quotation: InsertQuotation): Promise<Quotation> { throw new Error("Not implemented"); }
  async updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation> { throw new Error("Not implemented"); }
  async deleteQuotation(id: number): Promise<void> {}
  async getQuotationItems(quotationId: number): Promise<QuotationItem[]> { return []; }
  async createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem> { throw new Error("Not implemented"); }
  async updateQuotationItem(id: number, item: Partial<InsertQuotationItem>): Promise<QuotationItem> { throw new Error("Not implemented"); }
  async deleteQuotationItem(id: number): Promise<void> {}
  async getQuotationDocuments(quotationId: number): Promise<QuotationDocument[]> { return []; }
  async createQuotationDocument(doc: InsertQuotationDocument): Promise<QuotationDocument> { throw new Error("Not implemented"); }
  async deleteQuotationDocument(id: number): Promise<void> {}
  async getQuotationTerms(quotationId: number): Promise<QuotationTerm[]> { return []; }
  async createQuotationTerm(term: InsertQuotationTerm): Promise<QuotationTerm> { throw new Error("Not implemented"); }
  async updateQuotationTerm(id: number, term: Partial<InsertQuotationTerm>): Promise<QuotationTerm> { throw new Error("Not implemented"); }
  async deleteQuotationTerm(id: number): Promise<void> {}
  async trackMaterialUsage(usage: InsertMaterialUsage): Promise<MaterialUsage> { throw new Error("Not implemented"); }
  async getMaterialUsage(userId: number): Promise<MaterialUsage[]> { return []; }

  private getNextId(map: Map<number, any>): number {
    return Math.max(0, ...Array.from(map.keys())) + 1;
  }

  // Add missing QuotationStorage methods
  async seedQuotationData(): Promise<void> {
    // Initialize default quotation data if needed
    return;
  }
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    throw new Error("Not implemented");
  }
  async updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    throw new Error("Not implemented");
  }
  async deleteSubscriptionPlan(id: string): Promise<void> {}
  async getTaxRate(id: number): Promise<TaxRate | undefined> { return undefined; }
  async createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    throw new Error("Not implemented");
  }
  async updateInvoiceTemplate(id: string, template: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate> {
    throw new Error("Not implemented");
  }
  async deleteInvoiceTemplate(id: string): Promise<void> {}
  async updateTaxRate(id: number, rate: Partial<InsertTaxRate>): Promise<TaxRate> {
    throw new Error("Not implemented");
  }
  async deleteTaxRate(id: number): Promise<void> {}
}

// Export the database storage implementation
export const storage = new DatabaseStorage();

// Initialize database with default data
(async () => {
  try {
    await storage.seedDefaultData();
    // Create a QuotationStorage instance for seeding quotation data
    const quotationStorage = new QuotationStorage();
    await quotationStorage.seedQuotationData();
  } catch (err) {
    console.error("Error seeding data:", err);
  }
})();
