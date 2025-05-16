import { eq, and, ne } from "drizzle-orm";
import { db } from "./db";
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
  type InvoiceStatus
} from "@shared/schema";
import { IStorage } from "./storage";
import { hashPassword } from "./auth";

// Postgresql Storage Implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const passwordHash = await hashPassword(userData.password);
    const { password, ...userWithoutPassword } = userData;
    
    const newUser = {
      ...userWithoutPassword,
      passwordHash,
      createdAt: new Date(),
      planId: "free",
      invoiceQuota: 10,
      invoicesUsed: 0,
      quoteQuota: 10,
      quotesUsed: 0,
      materialRecordsUsed: 0,
      subscriptionStatus: "active" as const
    };
    
    const [user] = await db.insert(users).values(newUser).returning();
    return user as User;
  }
  
  async getUserById(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user as User | undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user as User | undefined;
  }
  
  async updateUserSubscription(userId: number, planId: string, quota: number): Promise<User> {
    const subscriptionExpiresAt = new Date();
    subscriptionExpiresAt.setFullYear(subscriptionExpiresAt.getFullYear() + 1);
    
    const [user] = await db
      .update(users)
      .set({
        planId,
        invoiceQuota: quota,
        invoicesUsed: 0,
        quoteQuota: quota,
        quotesUsed: 0,
        materialRecordsUsed: 0,
        subscriptionStatus: "active" as const,
        subscriptionExpiresAt
      })
      .where(eq(users.id, userId))
      .returning();
      
    return user as User;
  }
  
  async incrementInvoiceUsage(userId: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");
    
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
    return await db
      .select()
      .from(companyProfiles)
      .where(eq(companyProfiles.userId, userId));
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
    const { isDefault = false } = profile;
    
    // If this is set as default, unset any existing default profile
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
    if (!existingProfile) throw new Error("Company profile not found");
    
    // If setting as default, unset any other default profile
    if (profile.isDefault) {
      await db
        .update(companyProfiles)
        .set({ isDefault: false })
        .where(
          and(
            eq(companyProfiles.userId, existingProfile.userId),
            eq(companyProfiles.isDefault, true),
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
    if (!profile) throw new Error("Company profile not found");
    
    // Check if profile is being used in any invoices
    const [invoiceUsingProfile] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.companyProfileId, id))
      .limit(1);
      
    if (invoiceUsingProfile) {
      throw new Error("Cannot delete company profile that is being used in invoices");
    }
    
    // If this was the default profile, set another profile as default
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
    return await db
      .select()
      .from(clients)
      .where(eq(clients.userId, userId));
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
    await db
      .delete(clients)
      .where(eq(clients.id, id));
  }
  
  // Invoice methods
  async getInvoices(userId: number): Promise<Invoice[]> {
    const results = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId));
    return results as Invoice[];
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice as Invoice | undefined;
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        ...invoice,
        subtotal: "0",
        total: "0"
      })
      .returning();
    return newInvoice as Invoice;
  }
  
  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(invoice)
      .where(eq(invoices.id, id))
      .returning();
      
    return updatedInvoice;
  }
  
  async deleteInvoice(id: number): Promise<void> {
    await db
      .delete(invoices)
      .where(eq(invoices.id, id));
  }
  
  // Invoice item methods
  async getInvoiceItems(invoiceId: number): Promise<InvoiceItem[]> {
    return await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, invoiceId));
  }
  
  async createInvoiceItem(item: InsertInvoiceItem): Promise<InvoiceItem> {
    const quantity = parseFloat(item.quantity.toString());
    const unitPrice = parseFloat(item.unitPrice.toString());
    const discount = parseFloat(item.discount?.toString() || "0");
    const amount = (quantity * unitPrice * (1 - discount / 100)).toFixed(2);

    const [newItem] = await db
      .insert(invoiceItems)
      .values({
        ...item,
        amount
      })
      .returning();
      
    return newItem;
  }
  
  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    const [updatedItem] = await db
      .update(invoiceItems)
      .set(item)
      .where(eq(invoiceItems.id, id))
      .returning();
      
    return updatedItem;
  }
  
  async deleteInvoiceItem(id: number): Promise<void> {
    await db
      .delete(invoiceItems)
      .where(eq(invoiceItems.id, id));
  }
  
  // Subscription plan methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await db
      .select()
      .from(subscriptionPlans);
  }
  
  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan | undefined> {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
      
    return plan;
  }
  
  async createSubscriptionPlan(plan: InsertSubscriptionPlan): Promise<SubscriptionPlan> {
    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(plan)
      .returning();
      
    return newPlan;
  }
  
  async updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set(plan)
      .where(eq(subscriptionPlans.id, id))
      .returning();
      
    return updatedPlan;
  }
  
  async deleteSubscriptionPlan(id: string): Promise<void> {
    await db
      .delete(subscriptionPlans)
      .where(eq(subscriptionPlans.id, id));
  }
  
  // Tax rate methods
  async getTaxRates(): Promise<TaxRate[]> {
    return await db
      .select()
      .from(taxRates);
  }

  async getTaxRatesByCountry(countryCode: string): Promise<TaxRate[]> {
    return await db
      .select()
      .from(taxRates)
      .where(eq(taxRates.countryCode, countryCode));
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
  
  async getTaxRate(id: number): Promise<TaxRate | undefined> {
    const [rate] = await db
      .select()
      .from(taxRates)
      .where(eq(taxRates.id, id));
      
    return rate;
  }
  
  async createTaxRate(rate: InsertTaxRate): Promise<TaxRate> {
    const [newRate] = await db
      .insert(taxRates)
      .values(rate)
      .returning();
      
    return newRate;
  }
  
  async updateTaxRate(id: number, rate: Partial<InsertTaxRate>): Promise<TaxRate> {
    const [updatedRate] = await db
      .update(taxRates)
      .set(rate)
      .where(eq(taxRates.id, id))
      .returning();
      
    return updatedRate;
  }
  
  async deleteTaxRate(id: number): Promise<void> {
    await db
      .delete(taxRates)
      .where(eq(taxRates.id, id));
  }
  
  // Invoice template methods
  async getInvoiceTemplates(): Promise<InvoiceTemplate[]> {
    return await db
      .select()
      .from(invoiceTemplates);
  }
  
  async getInvoiceTemplate(id: string): Promise<InvoiceTemplate | undefined> {
    const [template] = await db
      .select()
      .from(invoiceTemplates)
      .where(eq(invoiceTemplates.id, id));
      
    return template;
  }
  
  async createInvoiceTemplate(template: InsertInvoiceTemplate): Promise<InvoiceTemplate> {
    const [newTemplate] = await db
      .insert(invoiceTemplates)
      .values(template)
      .returning();
      
    return newTemplate;
  }
  
  async updateInvoiceTemplate(id: string, template: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate> {
    const [updatedTemplate] = await db
      .update(invoiceTemplates)
      .set(template)
      .where(eq(invoiceTemplates.id, id))
      .returning();
      
    return updatedTemplate;
  }
  
  async deleteInvoiceTemplate(id: string): Promise<void> {
    await db
      .delete(invoiceTemplates)
      .where(eq(invoiceTemplates.id, id));
  }

  async seedDefaultData(): Promise<void> {
    // Initialize default subscription plans
    const defaultPlans: InsertSubscriptionPlan[] = [
      {
        id: "free",
        name: "Free Plan",
        price: "0",
        interval: "monthly",
        features: ["5 clients", "10 invoices/month", "Basic templates", "PDF generation"],
        invoiceQuota: 10,
        quoteQuota: 5,
        materialRecordsLimit: 50,
        includesCentralMasters: false,
        isActive: true
      },
      {
        id: "monthly",
        name: "Professional",
        price: "9.99",
        interval: "monthly",
        features: ["Unlimited clients", "Unlimited invoices", "All templates", "Excel import", "No branding"],
        invoiceQuota: -1,
        quoteQuota: -1,
        materialRecordsLimit: -1,
        includesCentralMasters: true,
        isActive: true
      }
    ];

    // Initialize default tax rates
    const defaultTaxRates: InsertTaxRate[] = [
      { country: "United Kingdom", countryCode: "GB", name: "VAT", rate: "20.00", isDefault: true },
      { country: "United States", countryCode: "US", name: "Sales Tax", rate: "0.00", isDefault: true }
    ];

    // Insert default data only if it doesn't exist
    for (const plan of defaultPlans) {
      const existingPlan = await this.getSubscriptionPlan(plan.id);
      if (!existingPlan) {
        await this.createSubscriptionPlan(plan);
      }
    }

    for (const taxRate of defaultTaxRates) {
      const existingRates = await this.getTaxRatesByCountry(taxRate.countryCode);
      const rateExists = existingRates.some(rate => rate.name === taxRate.name);
      if (!rateExists) {
        await this.createTaxRate(taxRate);
      }
    }
  }
}