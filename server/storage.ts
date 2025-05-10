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
  type InvoiceTemplate, type InsertInvoiceTemplate
} from "@shared/schema";
import crypto from "crypto";

// Storage interface
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
  createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile>;
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
  
  // Invoice template methods
  getInvoiceTemplates(includesPremium: boolean): Promise<InvoiceTemplate[]>;
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
      interval: "monthly",
      features: ["5 clients", "10 invoices/month", "Basic templates", "PDF generation"],
      invoiceQuota: 10,
      isActive: true
    });
    
    this.subscriptionPlans.set("monthly", {
      id: "monthly",
      name: "Professional",
      price: "9.99",
      interval: "monthly",
      features: ["Unlimited clients", "Unlimited invoices", "All templates", "Excel import", "No branding"],
      invoiceQuota: -1, // unlimited
      isActive: true
    });
    
    this.subscriptionPlans.set("yearly", {
      id: "yearly",
      name: "Professional (Yearly)",
      price: "99.99",
      interval: "yearly",
      features: ["Unlimited clients", "Unlimited invoices", "All templates", "Excel import", "No branding", "2 months free"],
      invoiceQuota: -1, // unlimited
      isActive: true
    });
    
    this.subscriptionPlans.set("per-invoice", {
      id: "per-invoice",
      name: "Pay as you go",
      price: "19.99",
      interval: "one-time",
      features: ["10 invoices bundle", "All templates", "Excel import", "No branding", "Valid for 1 month"],
      invoiceQuota: 10,
      isActive: true
    });
    
    // Initialize default tax rates
    const defaultTaxRates: InsertTaxRate[] = [
      { country: "United Kingdom", countryCode: "GB", name: "VAT", rate: "20.00", isDefault: true },
      { country: "United States", countryCode: "US", name: "Sales Tax", rate: "0.00", isDefault: true },
      { country: "Germany", countryCode: "DE", name: "VAT", rate: "19.00", isDefault: true },
      { country: "France", countryCode: "FR", name: "VAT", rate: "20.00", isDefault: true },
      { country: "Japan", countryCode: "JP", name: "Consumption Tax", rate: "10.00", isDefault: true },
      { country: "Canada", countryCode: "CA", name: "GST", rate: "5.00", isDefault: true },
      { country: "Australia", countryCode: "AU", name: "GST", rate: "10.00", isDefault: true },
      { country: "Italy", countryCode: "IT", name: "VAT", rate: "22.00", isDefault: true },
      { country: "Spain", countryCode: "ES", name: "VAT", rate: "21.00", isDefault: true },
      { country: "Netherlands", countryCode: "NL", name: "VAT", rate: "21.00", isDefault: true },
    ];
    
    defaultTaxRates.forEach(taxRate => {
      const id = this.currentTaxRateId++;
      this.taxRates.set(id, { ...taxRate, id });
    });
    
    // Initialize invoice templates
    const defaultTemplates: (Omit<InvoiceTemplate, "id"> & { id: string })[] = [
      { id: "classic", name: "Classic", previewUrl: "https://images.unsplash.com/photo-1616531770192-6eaea74c2456", isDefault: true, isPremium: false },
      { id: "modern-blue", name: "Modern Blue", previewUrl: "https://images.unsplash.com/photo-1586892477838-2b96e85e0f96", isDefault: false, isPremium: false },
      { id: "executive", name: "Executive", previewUrl: "https://images.unsplash.com/photo-1618044733300-9472054094ee", isDefault: false, isPremium: true },
      { id: "minimal", name: "Minimal", previewUrl: "https://images.unsplash.com/photo-1636633762833-5d1658f1e29b", isDefault: false, isPremium: false },
      { id: "dynamic", name: "Dynamic", previewUrl: "https://images.unsplash.com/photo-1586282391129-76a6df230234", isDefault: false, isPremium: true },
      { id: "geometric", name: "Geometric", previewUrl: "https://images.unsplash.com/photo-1542621334-a254cf47733d", isDefault: false, isPremium: true },
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
      ...rest,
      passwordHash,
      planId: "free",
      invoiceQuota: 10,
      invoicesUsed: 0,
      subscriptionStatus: "active",
      createdAt: new Date(),
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
      subscriptionStatus: "active",
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
      invoicesUsed: user.invoicesUsed + 1
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
  
  async createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile> {
    const id = this.currentCompanyProfileId++;
    
    // If this is the first profile for this user, make it default
    const existingProfiles = await this.getCompanyProfiles(profile.userId);
    const isDefault = existingProfiles.length === 0 ? true : profile.isDefault || false;
    
    // If we're setting this profile as default, unset any existing default
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
      ...profile,
      isDefault
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
      ...profile
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
  
  async createClient(client: InsertClient): Promise<Client> {
    const id = this.currentClientId++;
    const newClient: Client = {
      id,
      ...client
    };
    
    this.clients.set(id, newClient);
    return newClient;
  }
  
  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const existingClient = await this.getClient(id);
    if (!existingClient) throw new Error(`Client with ID ${id} not found`);
    
    const updatedClient: Client = {
      ...existingClient,
      ...client
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
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentInvoiceId++;
    const now = new Date();
    
    const newInvoice: Invoice = {
      id,
      ...invoice,
      subtotal: "0",
      tax: "0",
      total: "0",
      createdAt: now,
      updatedAt: now,
      pdfUrl: null
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
    // Calculate the amount
    const quantity = parseFloat(item.quantity.toString());
    const unitPrice = parseFloat(item.unitPrice.toString());
    const discount = parseFloat(item.discount?.toString() || "0");
    
    const amount = (quantity * unitPrice * (1 - discount / 100)).toFixed(2);
    
    const id = this.currentInvoiceItemId++;
    const newItem: InvoiceItem = {
      id,
      ...item,
      amount
    };
    
    this.invoiceItems.set(id, newItem);
    
    // Update invoice totals
    await this.recalculateInvoiceTotals(item.invoiceId);
    
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
      amount
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
  async getInvoiceTemplates(includesPremium: boolean): Promise<InvoiceTemplate[]> {
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
  
  private async recalculateInvoiceTotals(invoiceId: number): Promise<void> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) throw new Error(`Invoice with ID ${invoiceId} not found`);
    
    const items = await this.getInvoiceItems(invoiceId);
    
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      return sum + parseFloat(item.amount.toString());
    }, 0);
    
    // Calculate discount
    const discountValue = parseFloat(invoice.discount?.toString() || "0");
    
    // Get tax rate for this country
    const taxRate = await this.getDefaultTaxRate(invoice.country);
    const taxRateValue = taxRate ? parseFloat(taxRate.rate.toString()) : 0;
    
    // Calculate tax and total
    const taxableAmount = subtotal - discountValue;
    const taxAmount = taxableAmount * (taxRateValue / 100);
    const total = taxableAmount + taxAmount;
    
    // Update invoice
    const updatedInvoice: Invoice = {
      ...invoice,
      subtotal: subtotal.toFixed(2),
      tax: taxAmount.toFixed(2),
      taxRate: taxRateValue.toString(),
      total: total.toFixed(2),
      updatedAt: new Date()
    };
    
    this.invoices.set(invoiceId, updatedInvoice);
  }
}

import { DatabaseStorage } from "./db-storage";

// Create and export an instance of DatabaseStorage
export const storage = new DatabaseStorage();

// Initialize database with default data
storage.seedDefaultData().catch(err => {
  console.error("Error seeding default data:", err);
});
