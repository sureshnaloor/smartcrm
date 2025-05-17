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
  quoteQuota: integer("quote_quota").default(10),
  quotesUsed: integer("quotes_used").default(0),
  materialRecordsUsed: integer("material_records_used").default(0),
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
  quoteQuota: true,
  quotesUsed: true,
  materialRecordsUsed: true,
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
}).extend({
  userId: z.number()
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
  isFromCentralRepo: boolean("is_from_central_repo").default(false),
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
});

// Materials/Services Master table (central repository)
export const masterItems = pgTable("master_items", {
  id: serial("id").primaryKey(),
  code: text("code").unique(), // Unique identifier for reference
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Material or Service
  unitOfMeasure: text("unit_of_measure").notNull(),
  defaultPrice: numeric("default_price", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMasterItemSchema = createInsertSchema(masterItems).omit({
  id: true,
  createdAt: true,
}).extend({
  code: z.string().optional(),
  defaultPrice: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
});

// Company specific materials and services
export const companyItems = pgTable("company_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  masterItemId: integer("master_item_id").references(() => masterItems.id),
  code: text("code"), // Company specific code
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // Material or Service
  unitOfMeasure: text("unit_of_measure").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  cost: numeric("cost", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanyItemSchema = createInsertSchema(companyItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Terms and conditions master table (central repository)
export const masterTerms = pgTable("master_terms", {
  id: serial("id").primaryKey(),
  category: text("category").notNull(), // Payment, Delivery, Warranty, etc.
  title: text("title").notNull(),
  content: text("content").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMasterTermSchema = createInsertSchema(masterTerms).omit({
  id: true,
  createdAt: true,
}).extend({
  isActive: z.boolean().optional(),
});

// Company specific terms and conditions
export const companyTerms = pgTable("company_terms", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  masterTermId: integer("master_term_id").references(() => masterTerms.id),
  category: text("category").notNull(), // Payment, Delivery, Warranty, etc.
  title: text("title").notNull(),
  content: text("content").notNull(),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanyTermSchema = createInsertSchema(companyTerms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Document uploads table
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // Catalog, Scope, T&C, etc.
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(),
  mimeType: text("mime_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

// Quotations table
export const quotations = pgTable("quotations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyProfileId: integer("company_profile_id").notNull().references(() => companyProfiles.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  quoteNumber: text("quote_number").notNull(),
  quoteDate: timestamp("quote_date").notNull(),
  validUntil: timestamp("valid_until"),
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
  status: text("status").default("draft").notNull(), // draft, sent, accepted, declined, expired
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertQuotationSchema = createInsertSchema(quotations).omit({
  id: true,
  subtotal: true,
  total: true,
  pdfUrl: true,
  createdAt: true,
  updatedAt: true,
});

// Quotation items table
export const quotationItems = pgTable("quotation_items", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").notNull().references(() => quotations.id),
  companyItemId: integer("company_item_id").references(() => companyItems.id),
  masterItemId: integer("master_item_id").references(() => masterItems.id),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 5, scale: 2 }).default("0"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
});

export const insertQuotationItemSchema = createInsertSchema(quotationItems).omit({
  id: true,
}).extend({
  discount: z.string().optional(),
  quotationId: z.number(),
  description: z.string(),
  quantity: z.string(),
  unitPrice: z.string(),
  amount: z.string().optional(),
  companyItemId: z.number().optional(),
  masterItemId: z.number().optional()
});

// Quotation document attachments
export const quotationDocuments = pgTable("quotation_documents", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").notNull().references(() => quotations.id),
  documentId: integer("document_id").notNull().references(() => documents.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuotationDocumentSchema = createInsertSchema(quotationDocuments).omit({
  id: true,
  createdAt: true,
});

// Quotation terms
export const quotationTerms = pgTable("quotation_terms", {
  id: serial("id").primaryKey(),
  quotationId: integer("quotation_id").notNull().references(() => quotations.id),
  companyTermId: integer("company_term_id").references(() => companyTerms.id),
  masterTermId: integer("master_term_id").references(() => masterTerms.id),
  category: text("category").notNull(), // Payment, Delivery, Warranty, etc.
  title: text("title").notNull(),
  content: text("content").notNull(),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertQuotationTermSchema = createInsertSchema(quotationTerms).omit({
  id: true,
  createdAt: true,
});

// Material usage tracking
export const materialUsage = pgTable("material_usage", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  masterItemId: integer("master_item_id").notNull().references(() => masterItems.id),
  quotationId: integer("quotation_id").references(() => quotations.id),
  usedAt: timestamp("used_at").defaultNow().notNull(),
});

export const insertMaterialUsageSchema = createInsertSchema(materialUsage).omit({
  id: true,
  usedAt: true,
});

// Invoice tables from original schema
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyProfileId: integer("company_profile_id").notNull().references(() => companyProfiles.id),
  clientId: integer("client_id").notNull().references(() => clients.id),
  quotationId: integer("quotation_id").references(() => quotations.id),
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
  quotationItemId: integer("quotation_item_id").references(() => quotationItems.id),
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
  quoteQuota: integer("quote_quota").notNull(), // Number of quotes allowed per period
  materialRecordsLimit: integer("material_records_limit").default(-1), // -1 for unlimited
  includesCentralMasters: boolean("includes_central_masters").default(false),
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

// Quote/Invoice templates table
export const invoiceTemplates = pgTable("invoice_templates", {
  id: text("id").primaryKey(), // e.g., "classic", "modern", "minimal"
  name: text("name").notNull(),
  previewUrl: text("preview_url"),
  isDefault: boolean("is_default").default(false),
  isPremium: boolean("is_premium").default(false),
  type: text("type").default("both"), // invoice, quote, or both
});

export const insertInvoiceTemplateSchema = createInsertSchema(invoiceTemplates);

// Type definitions for our schemas
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CompanyProfile = typeof companyProfiles.$inferSelect;
export type InsertCompanyProfile = z.infer<typeof insertCompanyProfileSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type MasterItem = typeof masterItems.$inferSelect;
export type InsertMasterItem = z.infer<typeof insertMasterItemSchema>;

export type CompanyItem = typeof companyItems.$inferSelect;
export type InsertCompanyItem = z.infer<typeof insertCompanyItemSchema>;

export type MasterTerm = typeof masterTerms.$inferSelect;
export type InsertMasterTerm = z.infer<typeof insertMasterTermSchema>;

export type CompanyTerm = typeof companyTerms.$inferSelect;
export type InsertCompanyTerm = z.infer<typeof insertCompanyTermSchema>;

export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = z.infer<typeof insertQuotationSchema>;

export type QuotationItem = typeof quotationItems.$inferSelect;
export type InsertQuotationItem = z.infer<typeof insertQuotationItemSchema>;

export type QuotationDocument = typeof quotationDocuments.$inferSelect;
export type InsertQuotationDocument = z.infer<typeof insertQuotationDocumentSchema>;

export type QuotationTerm = typeof quotationTerms.$inferSelect;
export type InsertQuotationTerm = z.infer<typeof insertQuotationTermSchema>;

export type MaterialUsage = typeof materialUsage.$inferSelect;
export type InsertMaterialUsage = z.infer<typeof insertMaterialUsageSchema>;

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

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type QuotationStatus = "draft" | "sent" | "accepted" | "declined" | "expired"; 
export type TemplateType = "invoice" | "quote" | "both";
