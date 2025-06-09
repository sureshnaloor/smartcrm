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
import { Pool } from 'pg';

// Create a new pool for raw queries
const rawPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Postgresql Storage Implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    console.log('Starting user creation process...');
    
    try {
      // First check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.email, userData.email));
      if (existingUser.length > 0) {
        throw new Error('User already exists');
      }

      const passwordHash = await hashPassword(userData.password);
      
      const newUser = {
        email: userData.email,
        fullName: userData.fullName,
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
      
      console.log('Inserting user:', { ...newUser, passwordHash: '[REDACTED]' });
      
      const [user] = await db.insert(users).values(newUser).returning();
      console.log('User created:', { ...user, passwordHash: '[REDACTED]' });
      
      return user as User;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
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
        [users.planId.name]: planId,
        [users.invoiceQuota.name]: quota,
        [users.invoicesUsed.name]: 0,
        [users.quoteQuota.name]: quota,
        [users.quotesUsed.name]: 0,
        [users.materialRecordsUsed.name]: 0,
        [users.subscriptionStatus.name]: "active",
        [users.subscriptionExpiresAt.name]: subscriptionExpiresAt
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
        [users.invoicesUsed.name]: currentUsage + 1
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
  
  async createCompanyProfile(profile: InsertCompanyProfile & { userId: number }): Promise<CompanyProfile> {
    const { isDefault = false } = profile;
    
    // If this is set as default, unset any existing default profile
    if (isDefault) {
      await db
        .update(companyProfiles)
        .set({ [companyProfiles.isDefault.name]: false })
        .where(
          and(
            eq(companyProfiles.userId, profile.userId),
            eq(companyProfiles.isDefault, true)
          )
        );
    }
    
    const [newProfile] = await db
      .insert(companyProfiles)
      .values({
        name: profile.name,
        userId: profile.userId
      })
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
        .set({ [companyProfiles.isDefault.name]: false })
        .where(
          and(
            eq(companyProfiles.userId, existingProfile.userId),
            eq(companyProfiles.isDefault, true)
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
          .set({ [companyProfiles.isDefault.name]: true })
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
    if (!client.name || !client.userId) {
      throw new Error("Name and userId are required fields");
    }
    const insertData: {
      name: string;
      userId: number;
      taxId?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      email?: string;
      phone?: string;
      notes?: string;
      isFromCentralRepo?: boolean;
    } = {
      name: client.name,
      userId: Number(client.userId),
    };
    if (client.taxId !== undefined && client.taxId !== null) insertData.taxId = client.taxId;
    if (client.address !== undefined && client.address !== null) insertData.address = client.address;
    if (client.city !== undefined && client.city !== null) insertData.city = client.city;
    if (client.state !== undefined && client.state !== null) insertData.state = client.state;
    if (client.postalCode !== undefined && client.postalCode !== null) insertData.postalCode = client.postalCode;
    if (client.country !== undefined && client.country !== null) insertData.country = client.country;
    if (client.email !== undefined && client.email !== null) insertData.email = client.email;
    if (client.phone !== undefined && client.phone !== null) insertData.phone = client.phone;
    if (client.notes !== undefined && client.notes !== null) insertData.notes = client.notes;
    if (client.isFromCentralRepo !== undefined) insertData.isFromCentralRepo = Boolean(client.isFromCentralRepo);

    const [newClient] = await db
      .insert(clients)
      .values(insertData)
      .returning();
    return newClient;
  }

  async updateClient(id: number, client: Partial<InsertClient>): Promise<Client> {
    const updateData: {
      name?: string;
      userId?: number;
      taxId?: string;
      address?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
      email?: string;
      phone?: string;
      notes?: string;
      isFromCentralRepo?: boolean;
    } = {};
    if (client.name !== undefined) updateData.name = client.name;
    if (client.userId !== undefined) updateData.userId = Number(client.userId);
    if (client.taxId !== undefined && client.taxId !== null) updateData.taxId = client.taxId;
    if (client.address !== undefined && client.address !== null) updateData.address = client.address;
    if (client.city !== undefined && client.city !== null) updateData.city = client.city;
    if (client.state !== undefined && client.state !== null) updateData.state = client.state;
    if (client.postalCode !== undefined && client.postalCode !== null) updateData.postalCode = client.postalCode;
    if (client.country !== undefined && client.country !== null) updateData.country = client.country;
    if (client.email !== undefined && client.email !== null) updateData.email = client.email;
    if (client.phone !== undefined && client.phone !== null) updateData.phone = client.phone;
    if (client.notes !== undefined && client.notes !== null) updateData.notes = client.notes;
    if (client.isFromCentralRepo !== undefined) updateData.isFromCentralRepo = Boolean(client.isFromCentralRepo);

    const [updatedClient] = await db
      .update(clients)
      .set(updateData)
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
    const insertData: any = {
      userId: Number(invoice.userId),
      country: invoice.country,
      companyProfileId: Number(invoice.companyProfileId),
      clientId: Number(invoice.clientId),
      currency: invoice.currency,
      templateId: invoice.templateId,
      discount: invoice.discount ?? "0.00",
      tax: invoice.tax ?? "0.00",
      taxRate: invoice.taxRate ?? "0.00",
      terms: invoice.terms,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status ?? "draft",
      subtotal: "0.00",
      total: "0.00"
    };

    if (invoice.quotationId !== undefined) insertData.quotationId = Number(invoice.quotationId);
    if (invoice.invoiceDate instanceof Date) insertData.invoiceDate = invoice.invoiceDate;
    if (invoice.dueDate instanceof Date) insertData.dueDate = invoice.dueDate;
    if (invoice.notes !== undefined) insertData.notes = invoice.notes;

    const [newInvoice] = await db
      .insert(invoices)
      .values(insertData)
      .returning();
    return newInvoice as Invoice;
  }
  
  async updateInvoice(id: number, invoice: Partial<InsertInvoice>): Promise<Invoice> {
    const updateData: {
      userId?: number;
      country?: string;
      companyProfileId?: number;
      clientId?: number;
      currency?: string;
      templateId?: string;
      discount?: string;
      tax?: string;
      taxRate?: string;
      terms?: string;
      status?: string;
      quotationId?: number;
      invoiceNumber?: string;
      invoiceDate?: Date;
      dueDate?: Date;
      notes?: string;
    } = {};

    if (invoice.userId !== undefined) updateData.userId = Number(invoice.userId);
    if (invoice.country !== undefined) updateData.country = invoice.country;
    if (invoice.companyProfileId !== undefined) updateData.companyProfileId = Number(invoice.companyProfileId);
    if (invoice.clientId !== undefined) updateData.clientId = Number(invoice.clientId);
    if (invoice.currency !== undefined) updateData.currency = invoice.currency;
    if (invoice.templateId !== undefined && invoice.templateId !== null) updateData.templateId = invoice.templateId;
    if (invoice.discount !== undefined) updateData.discount = String(invoice.discount);
    if (invoice.tax !== undefined) updateData.tax = String(invoice.tax);
    if (invoice.taxRate !== undefined) updateData.taxRate = String(invoice.taxRate);
    if (invoice.terms !== undefined && invoice.terms !== null) updateData.terms = invoice.terms;
    if (invoice.status !== undefined) updateData.status = invoice.status;
    if (invoice.quotationId !== undefined) updateData.quotationId = Number(invoice.quotationId);
    if (invoice.invoiceNumber !== undefined) updateData.invoiceNumber = invoice.invoiceNumber;
    if (invoice.invoiceDate !== undefined) updateData.invoiceDate = invoice.invoiceDate instanceof Date ? invoice.invoiceDate : new Date(invoice.invoiceDate as string | number);
    if (invoice.dueDate !== undefined && invoice.dueDate !== null) {
      updateData.dueDate = invoice.dueDate instanceof Date
        ? invoice.dueDate
        : new Date(invoice.dueDate as unknown as string | number);
    }
    if (invoice.notes !== undefined && invoice.notes !== null) updateData.notes = invoice.notes;

    const [updatedInvoice] = await db
      .update(invoices)
      .set(updateData)
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

    const insertData = {
      invoiceId: Number(item.invoiceId),
      description: item.description,
      quantity: String(item.quantity),
      unitPrice: String(item.unitPrice),
      discount: item.discount ?? "0.00",
      quotationItemId: item.quotationItemId ? Number(item.quotationItemId) : undefined,
      amount: amount
    };

    const [newItem] = await db
      .insert(invoiceItems)
      .values(insertData)
      .returning();
      
    return newItem;
  }
  
  async updateInvoiceItem(id: number, item: Partial<InsertInvoiceItem>): Promise<InvoiceItem> {
    const updateData: {
      description?: string;
      quantity?: string;
      unitPrice?: string;
      discount?: string;
      invoiceId?: number;
      quotationItemId?: number;
      amount?: string;
    } = {};

    if (item.description !== undefined) updateData.description = item.description;
    if (item.quantity !== undefined) updateData.quantity = String(item.quantity);
    if (item.unitPrice !== undefined) updateData.unitPrice = String(item.unitPrice);
    if (item.discount !== undefined) updateData.discount = String(item.discount);
    if (item.invoiceId !== undefined) updateData.invoiceId = Number(item.invoiceId);
    if (item.quotationItemId !== undefined) updateData.quotationItemId = Number(item.quotationItemId);
    if (item.quantity !== undefined && item.unitPrice !== undefined) {
      const quantity = parseFloat(String(item.quantity));
      const unitPrice = parseFloat(String(item.unitPrice));
      const discount = parseFloat(String(item.discount || "0"));
      updateData.amount = (quantity * unitPrice * (1 - discount / 100)).toFixed(2);
    }

    const [updatedItem] = await db
      .update(invoiceItems)
      .set(updateData)
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
    const insertData = {
      id: plan.id,
      name: plan.name,
      invoiceQuota: Number(plan.invoiceQuota),
      quoteQuota: Number(plan.quoteQuota),
      price: String(plan.price),
      interval: plan.interval,
      features: plan.features,
      materialRecordsLimit: Number(plan.materialRecordsLimit),
      includesCentralMasters: Boolean(plan.includesCentralMasters),
      isActive: Boolean(plan.isActive)
    };

    const [newPlan] = await db
      .insert(subscriptionPlans)
      .values(insertData)
      .returning();
      
    return newPlan;
  }
  
  async updateSubscriptionPlan(id: string, plan: Partial<InsertSubscriptionPlan>): Promise<SubscriptionPlan> {
    const updateData: {
      name?: string;
      invoiceQuota?: number;
      quoteQuota?: number;
      price?: string;
      interval?: string;
      features?: unknown;
      materialRecordsLimit?: number;
      includesCentralMasters?: boolean;
      isActive?: boolean;
    } = {};

    if (plan.name !== undefined) updateData.name = plan.name;
    if (plan.invoiceQuota !== undefined) updateData.invoiceQuota = Number(plan.invoiceQuota);
    if (plan.quoteQuota !== undefined) updateData.quoteQuota = Number(plan.quoteQuota);
    if (plan.price !== undefined) updateData.price = String(plan.price);
    if (plan.interval !== undefined) updateData.interval = plan.interval;
    if (plan.features !== undefined) updateData.features = plan.features;
    if (plan.materialRecordsLimit !== undefined) updateData.materialRecordsLimit = Number(plan.materialRecordsLimit);
    if (plan.includesCentralMasters !== undefined) updateData.includesCentralMasters = Boolean(plan.includesCentralMasters);
    if (plan.isActive !== undefined) updateData.isActive = Boolean(plan.isActive);

    const [updatedPlan] = await db
      .update(subscriptionPlans)
      .set(updateData)
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
    if (!rate.name || !rate.country || !rate.countryCode || !rate.rate) {
      throw new Error("Missing required fields");
    }

    const insertData = {
      name: rate.name,
      country: rate.country,
      countryCode: rate.countryCode,
      rate: String(rate.rate),
      isDefault: Boolean(rate.isDefault)
    };

    const [newRate] = await db
      .insert(taxRates)
      .values(insertData)
      .returning();
      
    return newRate;
  }
  
  async updateTaxRate(id: number, rate: Partial<InsertTaxRate>): Promise<TaxRate> {
    const updateData: {
      name?: string;
      country?: string;
      countryCode?: string;
      rate?: string;
      isDefault?: boolean;
    } = {};

    if (rate.name !== undefined) updateData.name = rate.name;
    if (rate.country !== undefined) updateData.country = rate.country;
    if (rate.countryCode !== undefined) updateData.countryCode = rate.countryCode;
    if (rate.rate !== undefined) updateData.rate = String(rate.rate);
    if (rate.isDefault !== undefined) updateData.isDefault = Boolean(rate.isDefault);

    const [updatedRate] = await db
      .update(taxRates)
      .set(updateData)
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
    if (!template.id || !template.name) {
      throw new Error("id and name are required fields");
    }

    const insertData = {
      id: template.id,
      name: template.name,
      type: template.type,
      isDefault: Boolean(template.isDefault),
      previewUrl: template.previewUrl,
      isPremium: Boolean(template.isPremium)
    };

    const [newTemplate] = await db
      .insert(invoiceTemplates)
      .values(insertData)
      .returning();
      
    return newTemplate;
  }
  
  async updateInvoiceTemplate(id: string, template: Partial<InsertInvoiceTemplate>): Promise<InvoiceTemplate> {
    const updateData: {
      name?: string;
      type?: string;
      isDefault?: boolean;
      previewUrl?: string;
      isPremium?: boolean;
    } = {};

    if (template.name !== undefined) updateData.name = template.name;
    if (template.type !== undefined && template.type !== null) updateData.type = template.type;
    if (template.isDefault !== undefined) updateData.isDefault = Boolean(template.isDefault);
    if (template.previewUrl !== undefined && template.previewUrl !== null) updateData.previewUrl = template.previewUrl;
    if (template.isPremium !== undefined) updateData.isPremium = Boolean(template.isPremium);

    const [updatedTemplate] = await db
      .update(invoiceTemplates)
      .set(updateData)
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