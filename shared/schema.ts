import { pgTable, text, serial, integer, numeric, boolean, timestamp, unique, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Subscription-related fields
  planId: text("plan_id").default("free").notNull(),
  invoiceQuota: integer("invoice_quota").default(10),
  invoicesUsed: integer("invoices_used").default(0),
  subscriptionStatus: text("subscription_status").default("active"),
  subscriptionExpiresAt: timestamp("subscription_expires_at"),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  passwordHash: true,
  planId: true,
  invoiceQuota: true,
  invoicesUsed: true,
  subscriptionStatus: true,
  subscriptionExpiresAt: true,
}).extend({
  password: z.string().min(8),
});

// Company profiles table
export const companyProfiles = pgTable("company_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  taxId: text("tax_id"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  logoUrl: text("logo_url"),
  bankName: text("bank_name"),
  bankAccountName: text("bank_account_name"),
  bankAccountNumber: text("bank_account_number"),
  bankRoutingNumber: text("bank_routing_number"),
  bankSwiftBic: text("bank_swift_bic"),
  bankIban: text("bank_iban"),
  isDefault: boolean("is_default").default(false),
});

export const insertCompanyProfileSchema = createInsertSchema(companyProfiles).omit({
  id: true,
});

// Clients table
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  taxId: text("tax_id"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country"),
  email: text("email"),
  phone: text("phone"),
  notes: text("notes"),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyProfileId: integer("company_profile_id").notNull().references(() => companyProfiles.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  invoiceNumber: text("invoice_number").notNull(),
  invoiceDate: timestamp("invoice_date").notNull(),
  dueDate: timestamp("due_date"),
  country: text("country").notNull(), 
  currency: text("currency").notNull(),
  templateId: text("template_id").default("classic"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).default("0"),
  tax: numeric("tax", { precision: 10, scale: 2 }).default("0"),
  taxRate: numeric("tax_rate", { precision: 5, scale: 2 }),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  terms: text("terms"),
  status: text("status").default("draft").notNull(), // draft, sent, paid, overdue, cancelled
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  subtotal: true,
  total: true,
  pdfUrl: true,
  createdAt: true,
  updatedAt: true,
});

// Invoice items table
export const invoiceItems = pgTable("invoice_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull().references(() => invoices.id),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 5, scale: 2 }).default("0"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
  amount: true,
});

// Subscription plans table
export const subscriptionPlans = pgTable("subscription_plans", {
  id: text("id").primaryKey(), // "free", "monthly", "yearly", "per-invoice"
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  interval: text("interval").notNull(), // "monthly", "yearly", "one-time"
  features: jsonb("features").notNull(), // Array of features included in this plan
  invoiceQuota: integer("invoice_quota").notNull(), // Number of invoices allowed per period
  isActive: boolean("is_active").default(true),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans);

// Tax rates table
export const taxRates = pgTable("tax_rates", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  countryCode: text("country_code").notNull(),
  name: text("name").notNull(), // e.g., "VAT", "GST", "Sales Tax"
  rate: numeric("rate", { precision: 5, scale: 2 }).notNull(), // e.g., 20.00 for 20%
  isDefault: boolean("is_default").default(false),
});

export const insertTaxRateSchema = createInsertSchema(taxRates).omit({
  id: true,
});

// Invoice templates table
export const invoiceTemplates = pgTable("invoice_templates", {
  id: text("id").primaryKey(), // e.g., "classic", "modern", "minimal"
  name: text("name").notNull(),
  previewUrl: text("preview_url"),
  isDefault: boolean("is_default").default(false),
  isPremium: boolean("is_premium").default(false),
});

export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates);

// Type definitions for our schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;

export type TaxRate = typeof taxRates.$inferSelect;
export type InsertTaxRate = z.infer<typeof insertTaxRateSchema>;

export type InvoiceTemplate = typeof invoiceTemplates.$inferSelect;
export type InsertInvoiceTemplate = z.infer<typeof insertInvoiceTemplateSchema>;
