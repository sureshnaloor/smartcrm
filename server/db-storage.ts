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

import { IStorage } from "./storage";
import { db } from "./lib/db";
import { eq, ne, and, desc, not } from "drizzle-orm";
import crypto from "crypto";

// Postgresql Storage Implementation
export class DatabaseStorage implements IStorage {
  
  // User methods
  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const { password, ...rest } = userData;
    const passwordHash = this.hashPassword(password);
    
    const newUser = {
      ...rest,
      passwordHash,
      planId: "free",
      invoiceQuota: 10,
      invoicesUsed: 0,
      subscriptionStatus: "active" as const,
      subscriptionExpiresAt: null
    };
    
    const [user] = await db.insert(users).values(newUser).returning();
    return user;
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }
  
  async updateUserSubscription(userId: number, planId: string, quota: number): Promise<User> {
    const subscriptionExpiresAt = planId === "per-invoice" 
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      : null;
      
    const [user] = await db
      .update(users)
      .set({
        planId,
        invoiceQuota: quota,
        invoicesUsed: 0,
        subscriptionStatus: "active",
        subscriptionExpiresAt
      })
      .where(eq(users.id, userId))
      .returning();
      
    return user;
  }
  
  async incrementInvoiceUsage(userId: number): Promise<void> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error(`User with ID ${userId} not found`);
    
    const currentUsage = user.invoicesUsed || 0;
    
    await db
      .update(users)
      .set({
        invoicesUsed: currentUsage + 1
      })
      .where(eq(users.id, userId));
  }
  
  // Company profile methods
  async getCompanyProfiles(userId: number): Promise<CompanyProfile[]> {
    const profiles = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId));
      
    return profiles;
  }
  
  async getCompanyProfile(id: number): Promise<CompanyProfile | undefined> {
    const [profile] = await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.id, id));
      
    return profile;
  }
  
  async getDefaultCompanyProfile(userId: number): Promise<CompanyProfile | undefined> {
    const [profile] = await db
      .select()
      .from(companyProfiles)
      .where(
        and(
          eq(companyProfiles.userId, userId),
          eq(companyProfiles.isDefault, true)
        )
      );
      
    return profile;
  }
  
  async createCompanyProfile(profile: InsertCompanyProfile): Promise<CompanyProfile> {
    // If this is the first profile for this user, make it default
    const existingProfiles = await this.getCompanyProfiles(profile.userId);
    const isDefault = existingProfiles.length === 0 ? true : profile.isDefault || false;
    
    // If we're setting this profile as default, unset any existing default
    if (isDefault) {
      await db
        .update(companyProfiles)
        .set({ isDefault: false })
        .where(
          and(
            eq(companyProfiles.userId, profile.userId),
            eq(companyProfiles.isDefault, true)
          )
        );
    }
    
    const [newProfile] = await db
      .insert(companyProfiles)
      .values({ ...profile, isDefault })
      .returning();
      
    return newProfile;
  }
  
  async updateCompanyProfile(id: number, profile: Partial<InsertCompanyProfile>): Promise<CompanyProfile> {
    const existingProfile = await this.getCompanyProfile(id);
    if (!existingProfile) throw new Error(`Company profile with ID ${id} not found`);
    
    // If we're setting this profile as default, unset any existing default
    if (profile.isDefault) {
      await db
        .update(companyProfiles)
        .set({ isDefault: false })
        .where(
          and(
            eq(companyProfiles.userId, existingProfile.userId),
            eq(companyProfiles.isDefault, true),
            // Not the current profile
            ne(companyProfiles.id, id)
          )
        );
    }
    
    const [updatedProfile] = await db
      .update(companyProfiles)
      .set(profile)
      .where(eq(companyProfiles.id, id))
      .returning();
      
    return updatedProfile;
  }
  
  async deleteCompanyProfile(id: number): Promise<void> {
    const profile = await this.getCompanyProfile(id);
    if (!profile) throw new Error(`Company profile with ID ${id} not found`);
    
    // Check if this profile is used in any invoices
    const [invoiceUsingProfile] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.companyProfileId, id))
      .limit(1);
      
    if (invoiceUsingProfile) {
      throw new Error("Cannot delete company profile that is used in invoices");
    }
    
    // If we're deleting the default profile, make another one default
    if (profile.isDefault) {
      const otherProfiles = await db
        .select()
        .from(companyProfiles)
        .where(
          and(
            eq(companyProfiles.userId, profile.userId),
            ne(companyProfiles.id, id)
          )
        )
        .limit(1);
        
      if (otherProfiles.length > 0) {
        await db
          .update(companyProfiles)
          .set({ isDefault: true })
          .where(eq(companyProfiles.id, otherProfiles[0].id));
      }
    }
    
    await db
      .delete(companyProfiles)
      .where(eq(companyProfiles.id, id));
  }
  
  // Client methods
  async getClients(userId: number): Promise<Client[]> {
    const clientsList = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId));
      
    return clientsList;
  }
  
  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id));
      
    return client;
  }
  
  async createClient(client: InsertClient): Promise<Client> {
    const [newClient] = await db
      .insert(clients)
      .values(client)
      .returning();
      
    return newClient;
  }
  
  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const [updatedClient] = await db
      .update(clients)
      .set(client)
      .where(eq(clients.id, id))
      .returning();
      
    return updatedClient;
  }
  
  async deleteClient(id: number): Promise<void> {
    const client = await this.getClient(id);
    if (!client) throw new Error(`Client with ID ${id} not found`);
    
    // Check if this client is used in any invoices
    const [invoiceUsingClient] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.clientId, id))
      .limit(1);
      
    if (invoiceUsingClient) {
      throw new Error("Cannot delete client that is used in invoices");
    }
    
    await db
      .delete(clients)
      .where(eq(clients.id, id));
  }
  
  // Invoice methods
  async getInvoices(userId: number): Promise<Invoice[]> {
    const invoicesList = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));
      
    return invoicesList;
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
      
    return invoice;
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        ...invoice,
        subtotal: "0",
        tax: "0",
        total: "0",
        pdfUrl: null
      })
      .returning();
      
    return newInvoice;
  }
  
  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set({ ...invoice, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
      
    return updatedInvoice;
  }
  
  async deleteInvoice(id: number): Promise<void> {
    const invoice = await this.getInvoice(id);
    if (!invoice) throw new Error(`Invoice with ID ${id} not found`);
    
    // Delete associated invoice items
    await db
      .delete(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));
      
    await db
      .delete(invoices)
      .where(eq(invoices.id, id));
  }
  
  // Invoice items methods
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
      
    return items;
  }
  
  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    // Calculate the amount
    const quantity = parseFloat(item.quantity.toString());
    const unitPrice = parseFloat(item.unitPrice.toString());
    const discount = item.discount ? parseFloat(item.discount.toString()) : 0;
    
    const discountAmount = (unitPrice * quantity * discount) / 100;
    const amount = (unitPrice * quantity) - discountAmount;
    
    const [newItem] = await db
      .insert(invoiceItems)
      .values({
        ...item,
        amount: amount.toString()
      })
      .returning();
      
    // Recalculate invoice totals
    await this.recalculateInvoiceTotals(item.invoiceId);
    
    return newItem;
  }
  
  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    const existingItem = await this.getInvoiceItem(id);
    if (!existingItem) throw new Error(`Invoice item with ID ${id} not found`);
    
    // Recalculate the amount if needed
    let amount = existingItem.amount;
    
    if (item.quantity !== undefined || item.unitPrice !== undefined || item.discount !== undefined) {
      const quantity = item.quantity !== undefined ? 
        parseFloat(item.quantity.toString()) : 
        parseFloat(existingItem.quantity.toString());
        
      const unitPrice = item.unitPrice !== undefined ? 
        parseFloat(item.unitPrice.toString()) : 
        parseFloat(existingItem.unitPrice.toString());
        
      const discount = item.discount !== undefined && item.discount !== null ? 
        parseFloat(item.discount.toString()) : 
        (existingItem.discount !== null ? parseFloat(existingItem.discount.toString()) : 0);
      
      const discountAmount = (unitPrice * quantity * discount) / 100;
      amount = ((unitPrice * quantity) - discountAmount).toString();
    }
    
    const [updatedItem] = await db
      .update(invoiceItems)
      .set({
        ...item,
        amount
      })
      .where(eq(invoiceItems.id, id))
      .returning();
      
    // Recalculate invoice totals
    await this.recalculateInvoiceTotals(existingItem.invoiceId);
    
    return updatedItem;
  }
  
  async deleteInvoiceItem(id: number): Promise<void> {
    const item = await this.getInvoiceItem(id);
    if (!item) throw new Error(`Invoice item with ID ${id} not found`);
    
    await db
      .delete(invoiceItems)
      .where(eq(invoiceItems.id, id));
      
    // Recalculate invoice totals
    await this.recalculateInvoiceTotals(item.invoiceId);
  }
  
  // Helper method to get a single invoice item
  private async getInvoiceItem(id: number): Promise<InvoiceItem | undefined> {
    const [item] = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.id, id));
      
    return item;
  }
  
  // Subscription plan methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    const plans = await db
      .select()
      .from(subscriptionPlans);
      
    return plans;
  }
  
  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
      
    return plan;
  }
  
  // Tax rate methods
  async getTaxRates(): Promise<TaxRate[]> {
    const rates = await db
      .select()
      .from(taxRates);
      
    return rates;
  }
  
  async getTaxRatesByCountry(countryCode: string): Promise<TaxRate[]> {
    const rates = await db
      .select()
      .from(taxRates)
      .where(eq(taxRates.countryCode, countryCode));
      
    return rates;
  }
  
  async getDefaultTaxRate(countryCode: string): Promise<TaxRate | undefined> {
    const [rate] = await db
      .select()
      .from(taxRates)
      .where(
        and(
          eq(taxRates.countryCode, countryCode),
          eq(taxRates.isDefault, true)
        )
      );
      
    return rate;
  }
  
  // Invoice template methods
  async getInvoiceTemplates(includesPremium: boolean): Promise<InvoiceTemplate[]> {
    if (includesPremium) {
      const templates = await db
        .select()
        .from(invoiceTemplates);
        
      return templates;
    } else {
      const templates = await db
        .select()
        .from(invoiceTemplates)
        .where(eq(invoiceTemplates.isPremium, false));
        
      return templates;
    }
  }
  
  async getInvoiceTemplate(id: string): Promise<InvoiceTemplate | undefined> {
    const [template] = await db
      .select()
      .from(invoiceTemplates)
      .where(eq(invoiceTemplates.id, id));
      
    return template;
  }
  
  // Helper methods
  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  }
  
  private async recalculateInvoiceTotals(invoiceId: number): Promise<void> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) return;
    
    const items = await this.getInvoiceItems(invoiceId);
    
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      return sum + parseFloat(item.amount.toString());
    }, 0);
    
    // Calculate tax
    const discountAmount = invoice.discount ? parseFloat(invoice.discount.toString()) : 0;
    const taxableAmount = subtotal - discountAmount;
    const taxRate = invoice.taxRate ? parseFloat(invoice.taxRate.toString()) : 0;
    const taxAmount = (taxableAmount * taxRate) / 100;
    
    // Calculate total
    const total = taxableAmount + taxAmount;
    
    // Update the invoice
    await db
      .update(invoices)
      .set({
        subtotal: subtotal.toString(),
        tax: taxAmount.toString(),
        total: total.toString(),
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId));
  }

  // Initialize default data
  async seedDefaultData(): Promise<void> {
    // Check if subscription plans exist
    const existingPlans = await this.getSubscriptionPlans();
    if (existingPlans.length === 0) {
      // Initialize default subscription plans
      await db.insert(subscriptionPlans).values([
        {
          id: "free",
          name: "Free Plan",
          price: "0",
          interval: "monthly",
          features: ["5 clients", "10 invoices/month", "Basic templates", "PDF generation"],
          invoiceQuota: 10,
          isActive: true
        },
        {
          id: "monthly",
          name: "Professional",
          price: "9.99",
          interval: "monthly",
          features: ["Unlimited clients", "Unlimited invoices", "All templates", "Excel import", "No branding"],
          invoiceQuota: -1, // unlimited
          isActive: true
        },
        {
          id: "yearly",
          name: "Professional (Yearly)",
          price: "99.99",
          interval: "yearly",
          features: ["Unlimited clients", "Unlimited invoices", "All templates", "Excel import", "No branding", "2 months free"],
          invoiceQuota: -1, // unlimited
          isActive: true
        },
        {
          id: "per-invoice",
          name: "Pay as you go",
          price: "19.99",
          interval: "one-time",
          features: ["10 invoices bundle", "All templates", "Excel import", "No branding", "Valid for 1 month"],
          invoiceQuota: 10,
          isActive: true
        }
      ]);
    }

    // Check if tax rates exist
    const existingTaxRates = await this.getTaxRates();
    if (existingTaxRates.length === 0) {
      // Initialize default tax rates
      await db.insert(taxRates).values([
        { id: 1, country: "United Kingdom", countryCode: "GB", name: "VAT", rate: "20.00", isDefault: true },
        { id: 2, country: "United States", countryCode: "US", name: "Sales Tax", rate: "0.00", isDefault: true },
        { id: 3, country: "Germany", countryCode: "DE", name: "VAT", rate: "19.00", isDefault: true },
        { id: 4, country: "France", countryCode: "FR", name: "VAT", rate: "20.00", isDefault: true },
        { id: 5, country: "Japan", countryCode: "JP", name: "Consumption Tax", rate: "10.00", isDefault: true },
        { id: 6, country: "Canada", countryCode: "CA", name: "GST", rate: "5.00", isDefault: true },
        { id: 7, country: "Australia", countryCode: "AU", name: "GST", rate: "10.00", isDefault: true },
        { id: 8, country: "Italy", countryCode: "IT", name: "VAT", rate: "22.00", isDefault: true },
        { id: 9, country: "Spain", countryCode: "ES", name: "VAT", rate: "21.00", isDefault: true },
        { id: 10, country: "Netherlands", countryCode: "NL", name: "VAT", rate: "21.00", isDefault: true },
      ]);
    }

    // Check if invoice templates exist
    const existingTemplates = await this.getInvoiceTemplates(true);
    if (existingTemplates.length === 0) {
      // Initialize invoice templates
      await db.insert(invoiceTemplates).values([
        { id: "classic", name: "Classic", previewUrl: "https://images.unsplash.com/photo-1616531770192-6eaea74c2456", isDefault: true, isPremium: false },
        { id: "modern-blue", name: "Modern Blue", previewUrl: "https://images.unsplash.com/photo-1586892477838-2b96e85e0f96", isDefault: false, isPremium: false },
        { id: "executive", name: "Executive", previewUrl: "https://images.unsplash.com/photo-1618044733300-9472054094ee", isDefault: false, isPremium: true },
        { id: "minimal", name: "Minimal", previewUrl: "https://images.unsplash.com/photo-1636633762833-5d1658f1e29b", isDefault: false, isPremium: false },
        { id: "dynamic", name: "Dynamic", previewUrl: "https://images.unsplash.com/photo-1586282391129-76a6df230234", isDefault: false, isPremium: true },
        { id: "geometric", name: "Geometric", previewUrl: "https://images.unsplash.com/photo-1542621334-a254cf47733d", isDefault: false, isPremium: true },
      ]);
    }
  }
}