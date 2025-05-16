import { db } from "./lib/db";
import { 
  users,
  quotations,
  quotationItems,
  quotationDocuments,
  quotationTerms,
  masterItems,
  companyItems,
  masterTerms,
  companyTerms,
  documents,
  materialUsage,
  MasterItem,
  InsertMasterItem,
  CompanyItem,
  InsertCompanyItem,
  MasterTerm,
  InsertMasterTerm,
  CompanyTerm,
  InsertCompanyTerm,
  Document,
  InsertDocument,
  Quotation,
  InsertQuotation,
  QuotationItem,
  InsertQuotationItem,
  QuotationDocument,
  InsertQuotationDocument,
  QuotationTerm,
  InsertQuotationTerm,
  MaterialUsage,
  InsertMaterialUsage,
  clients,
  Client
} from "@shared/schema";
import { eq, and, or, desc, asc, isNull } from "drizzle-orm";
import { DatabaseStorage } from "./db-storage";

/**
 * Implementation of quotation-related storage methods
 */
export class QuotationStorage extends DatabaseStorage {
  // ==================
  // Client methods
  // ==================
  async getCentralRepoClients(): Promise<Client[]> {
    const result = await db
      .select()
      .from(clients)
      .where(eq(clients.isFromCentralRepo, true))
      .orderBy(asc(clients.name));
    
    return result;
  }

  // ==================
  // Material and Service methods
  // ==================
  async getMasterItems(category?: string): Promise<MasterItem[]> {
    let query = db
      .select()
      .from(masterItems)
      .where(eq(masterItems.isActive, true));
    
    if (category) {
      // Remove invalid query = query.where(...)
      query = db
        .select()
        .from(masterItems)
        .where(and(eq(masterItems.isActive, true), eq(masterItems.category, category)));
    }
    
    const items = await query.orderBy(asc(masterItems.name));
    return items;
  }
  
  async getMasterItem(id: number): Promise<MasterItem | undefined> {
    const [item] = await db
      .select()
      .from(masterItems)
      .where(eq(masterItems.id, id));
    
    return item;
  }
  
  async getMasterItemByCode(code: string): Promise<MasterItem | undefined> {
    const [item] = await db
      .select()
      .from(masterItems)
      .where(eq(masterItems.code, code));
    
    return item;
  }
  
  async createMasterItem(item: InsertMasterItem): Promise<MasterItem> {
    if (!item.name || !item.description || !item.category || !item.unitOfMeasure) {
      throw new Error("Missing required fields for master item");
    }

    const [createdItem] = await db
      .insert(masterItems)
      .values({
        name: item.name,
        description: item.description,
        category: item.category,
        unitOfMeasure: item.unitOfMeasure,
        defaultPrice: item.defaultPrice ? item.defaultPrice.toString() : null,
        isActive: true,
        ...(item.code ? { code: item.code } : {})
      })
      .returning();
    
    return createdItem;
  }
  
  async updateMasterItem(id: number, item: Partial<InsertMasterItem>): Promise<MasterItem> {
    const [updatedItem] = await db
      .update(masterItems)
      .set({
        name: item.name,
        description: item.description,
        category: item.category,
        unitOfMeasure: item.unitOfMeasure,
        ...(item.code ? { code: item.code } : {}),
        ...(item.defaultPrice !== undefined ? { defaultPrice: item.defaultPrice } : {}),
        ...(item.isActive !== undefined ? { isActive: item.isActive } : {})
      } satisfies Partial<typeof masterItems.$inferInsert>)
      .where(eq(masterItems.id, id))
      .returning();
    
    return updatedItem;
  }
  
  async deleteMasterItem(id: number): Promise<void> {
    await db
      .delete(masterItems)
      .where(eq(masterItems.id, id));
  }
  
  // ==================
  // Company item methods
  // ==================
  async getCompanyItems(userId: number, category?: string): Promise<CompanyItem[]> {
    let query = db
      .select()
      .from(companyItems)
      .where(and(
        eq(companyItems.userId, userId),
        eq(companyItems.isActive, true)
      ));
    
    if (category) {
      // Remove invalid query = query.where(...)
      query = db
        .select()
        .from(companyItems)
        .where(and(eq(companyItems.userId, userId), eq(companyItems.isActive, true), eq(companyItems.category, category)));
    }
    
    const items = await query.orderBy(asc(companyItems.name));
    return items;
  }
  
  async getCompanyItem(id: number): Promise<CompanyItem | undefined> {
    const [item] = await db
      .select()
      .from(companyItems)
      .where(eq(companyItems.id, id));
    
    return item;
  }
  
  async createCompanyItem(item: InsertCompanyItem): Promise<CompanyItem> {
    if (!item.name || !item.description || !item.category || !item.unitOfMeasure || !item.price || !item.userId) {
      throw new Error("Missing required fields for company item");
    }

    // Check if this is from a master item, track usage
    if (item.masterItemId) {
      await this.trackMaterialUsage({
        userId: item.userId,
        masterItemId: item.masterItemId,
        quotationId: null
      });
    }
    
    const [createdItem] = await db
      .insert(companyItems)
      .values({
        name: item.name,
        description: item.description,
        category: item.category,
        unitOfMeasure: item.unitOfMeasure,
        price: item.price,
        userId: item.userId,
        masterItemId: item.masterItemId,
        code: item.code,
        cost: item.cost,
        isActive: true
      })
      .returning();
    
    return createdItem;
  }
  
  async updateCompanyItem(id: number, item: Partial<InsertCompanyItem>): Promise<CompanyItem> {
    const [updatedItem] = await db
      .update(companyItems)
      .set({
        name: item.name,
        description: item.description,
        category: item.category,
        unitOfMeasure: item.unitOfMeasure,
        price: item.price,
        userId: item.userId,
        masterItemId: item.masterItemId,
        code: item.code,
        cost: item.cost,
        isActive: item.isActive
      })
      .where(eq(companyItems.id, id))
      .returning();
    
    return updatedItem;
  }
  
  async deleteCompanyItem(id: number): Promise<void> {
    await db
      .delete(companyItems)
      .where(eq(companyItems.id, id));
  }
  
  // ==================
  // Terms methods
  // ==================
  async getMasterTerms(category?: string): Promise<MasterTerm[]> {
    let query = db
      .select()
      .from(masterTerms)
      .where(eq(masterTerms.isActive, true));
    
    if (category) {
      // Remove invalid query = query.where(...)
      query = db
        .select()
        .from(masterTerms)
        .where(and(eq(masterTerms.isActive, true), eq(masterTerms.category, category)));
    }
    
    const terms = await query.orderBy(asc(masterTerms.category), asc(masterTerms.title));
    return terms;
  }
  
  async getMasterTerm(id: number): Promise<MasterTerm | undefined> {
    const [term] = await db
      .select()
      .from(masterTerms)
      .where(eq(masterTerms.id, id));
    
    return term;
  }
  
  async createMasterTerm(term: InsertMasterTerm): Promise<MasterTerm> {
    if (!term.category || !term.title || !term.content) {
      throw new Error("Missing required fields for master term");
    }

    const [createdTerm] = await db
      .insert(masterTerms)
      .values({
        category: term.category,
        title: term.title,
        content: term.content,
        isActive: true
      })
      .returning();
    
    return createdTerm;
  }
  
  async updateMasterTerm(id: number, term: Partial<InsertMasterTerm>): Promise<MasterTerm> {
    const [updatedTerm] = await db
      .update(masterTerms)
      .set({
        category: term.category,
        title: term.title,
        content: term.content,
        isActive: term.isActive
      })
      .where(eq(masterTerms.id, id))
      .returning();
    
    return updatedTerm;
  }
  
  async deleteMasterTerm(id: number): Promise<void> {
    await db
      .delete(masterTerms)
      .where(eq(masterTerms.id, id));
  }
  
  // ==================
  // Company terms methods
  // ==================
  async getCompanyTerms(userId: number, category?: string): Promise<CompanyTerm[]> {
    let query = db
      .select()
      .from(companyTerms)
      .where(eq(companyTerms.userId, userId));
    
    if (category) {
      query = query.where(eq(companyTerms.category, category));
    }
    
    const terms = await query.orderBy(desc(companyTerms.isDefault), asc(companyTerms.category), asc(companyTerms.title));
    return terms;
  }
  
  async getCompanyTerm(id: number): Promise<CompanyTerm | undefined> {
    const [term] = await db
      .select()
      .from(companyTerms)
      .where(eq(companyTerms.id, id));
    
    return term;
  }
  
  async createCompanyTerm(term: InsertCompanyTerm): Promise<CompanyTerm> {
    if (!term.userId || !term.category || !term.title || !term.content) {
      throw new Error("Missing required fields for company term");
    }

    // Clear any existing default term in this category
    if (term.isDefault) {
      await this.clearDefaultCompanyTerm(term.userId, term.category);
    }
    
    const [createdTerm] = await db
      .insert(companyTerms)
      .values({
        userId: term.userId,
        category: term.category,
        title: term.title,
        content: term.content,
        masterTermId: term.masterTermId,
        isDefault: term.isDefault || false
      })
      .returning();
    
    return createdTerm;
  }
  
  async updateCompanyTerm(id: number, term: Partial<InsertCompanyTerm>): Promise<CompanyTerm> {
    // If setting as default, clear any existing default term
    if (term.isDefault) {
      const existingTerm = await this.getCompanyTerm(id);
      if (existingTerm) {
        await this.clearDefaultCompanyTerm(existingTerm.userId, existingTerm.category);
      }
    }
    
    const [updatedTerm] = await db
      .update(companyTerms)
      .set({
        userId: term.userId,
        category: term.category,
        title: term.title,
        content: term.content,
        masterTermId: term.masterTermId,
        isDefault: term.isDefault
      })
      .where(eq(companyTerms.id, id))
      .returning();
    
    return updatedTerm;
  }
  
  async deleteCompanyTerm(id: number): Promise<void> {
    await db
      .delete(companyTerms)
      .where(eq(companyTerms.id, id));
  }
  
  private async clearDefaultCompanyTerm(userId: number, category: string): Promise<void> {
    await db
      .update(companyTerms)
      .set({ isDefault: false })
      .where(and(
        eq(companyTerms.userId, userId),
        eq(companyTerms.category, category),
        eq(companyTerms.isDefault, true)
      ));
  }
  
  // ==================
  // Document methods
  // ==================
  async getUserDocuments(userId: number, type?: string): Promise<Document[]> {
    let query = db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId));
    
    if (type) {
      // Remove invalid query = query.where(...)
      query = db
        .select()
        .from(documents)
        .where(and(eq(documents.userId, userId), eq(documents.type, type)));
    }
    
    const docs = await query.orderBy(desc(documents.createdAt));
    return docs;
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    const [doc] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    
    return doc;
  }
  
  async createDocument(document: InsertDocument): Promise<Document> {
    const [createdDoc] = await db
      .insert(documents)
      .values(document)
      .returning();
    
    return createdDoc;
  }
  
  async deleteDocument(id: number): Promise<void> {
    await db
      .delete(documents)
      .where(eq(documents.id, id));
  }
  
  // ==================
  // Quotation methods
  // ==================
  async getQuotations(userId: number): Promise<Quotation[]> {
    const quotes = await db
      .select()
      .from(quotations)
      .where(eq(quotations.userId, userId))
      .orderBy(desc(quotations.createdAt));
    
    return quotes;
  }
  
  async getQuotation(id: number): Promise<Quotation | undefined> {
    const [quote] = await db
      .select()
      .from(quotations)
      .where(eq(quotations.id, id));
    
    return quote;
  }
  
  async createQuotation(quotation: InsertQuotation): Promise<Quotation> {
    // Initialize values
    quotation.status = quotation.status || 'draft';
    
    const subtotal = "0"; // Will be set by items
    const total = "0"; // Will be set by items
    
    const [createdQuote] = await db
      .insert(quotations)
      .values({
        ...quotation,
        subtotal,
        total,
        createdAt: new Date(),
        updatedAt: new Date(),
        pdfUrl: null,
      })
      .returning();
    
    // Increment quote usage
    await this.incrementQuoteUsage(quotation.userId);
    
    return createdQuote;
  }
  
  async updateQuotation(id: number, quotation: Partial<InsertQuotation>): Promise<Quotation> {
    const updateData: Partial<typeof quotations.$inferInsert> = {
      ...quotation,
      updatedAt: new Date(),
    };

    // Handle pdfUrl separately since it's omitted from insertQuotationSchema
    if ('pdfUrl' in quotation) {
      updateData.pdfUrl = quotation.pdfUrl as string;
    }

    const [updatedQuote] = await db
      .update(quotations)
      .set(updateData)
      .where(eq(quotations.id, id))
      .returning();
    
    return updatedQuote;
  }
  
  async deleteQuotation(id: number): Promise<void> {
    // First, delete all related items, terms, and documents
    await db
      .delete(quotationItems)
      .where(eq(quotationItems.quotationId, id));
    
    await db
      .delete(quotationTerms)
      .where(eq(quotationTerms.quotationId, id));
    
    await db
      .delete(quotationDocuments)
      .where(eq(quotationDocuments.quotationId, id));
    
    // Then delete the quotation
    await db
      .delete(quotations)
      .where(eq(quotations.id, id));
  }
  
  // ==================
  // Quotation items methods
  // ==================
  async getQuotationItems(quotationId: number): Promise<QuotationItem[]> {
    const items = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.quotationId, quotationId));
    
    return items;
  }
  
  async createQuotationItem(item: InsertQuotationItem): Promise<QuotationItem> {
    // Calculate the amount
    const quantity = parseFloat(item.quantity.toString());
    const unitPrice = parseFloat(item.unitPrice.toString());
    const discount = item.discount ? parseFloat(item.discount.toString()) : 0;
    
    const amount = (quantity * unitPrice * (1 - (discount ?? 0) / 100)).toString();
    updatedFields.amount = amount;
    
    // If this is from a master item, track usage
    if (item.masterItemId) {
      // Get the quotation to get the userId
      const [quotation] = await db
        .select()
        .from(quotations)
        .where(eq(quotations.id, item.quotationId));
      
      if (quotation) {
        await this.trackMaterialUsage({
          userId: quotation.userId,
          masterItemId: item.masterItemId,
          quotationId: item.quotationId
        });
      }
    }
    
    // Create the item
    const [createdItem] = await db
      .insert(quotationItems)
      .values({
        ...item,
        amount,
      })
      .returning();
    
    // Recalculate quotation totals
    await this.recalculateQuotationTotals(item.quotationId);
    
    return createdItem;
  }
  
  async updateQuotationItem(id: number, item: Partial<InsertQuotationItem>): Promise<QuotationItem> {
    // First get the existing item
    const [existingItem] = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.id, id));
    
    if (!existingItem) {
      throw new Error("Quotation item not found");
    }
    
    // Merge with updates
    const updatedFields = {
      ...item,
    };
    
    // Recalculate amount if quantity, unitPrice, or discount changes
    if (item.quantity !== undefined || item.unitPrice !== undefined || item.discount !== undefined) {
      const quantity = parseFloat((item.quantity || existingItem.quantity).toString());
      const unitPrice = parseFloat((item.unitPrice || existingItem.unitPrice).toString());
      const discount = item.discount !== undefined 
        ? parseFloat(item.discount.toString()) 
        : (existingItem.discount ? parseFloat(existingItem.discount.toString()) : 0);
      
      updatedFields.amount = (quantity * unitPrice * (1 - discount / 100)).toString();
    }
    
    // Update the item
    const [updatedItem] = await db
      .update(quotationItems)
      .set(updatedFields)
      .where(eq(quotationItems.id, id))
      .returning();
    
    // Recalculate quotation totals
    await this.recalculateQuotationTotals(existingItem.quotationId);
    
    return updatedItem;
  }
  
  async deleteQuotationItem(id: number): Promise<void> {
    // Get quotation ID before deleting
    const [item] = await db
      .select()
      .from(quotationItems)
      .where(eq(quotationItems.id, id));
    
    if (!item) {
      throw new Error("Quotation item not found");
    }
    
    const quotationId = item.quotationId;
    
    // Delete the item
    await db
      .delete(quotationItems)
      .where(eq(quotationItems.id, id));
    
    // Recalculate quotation totals
    await this.recalculateQuotationTotals(quotationId);
  }
  
  // ==================
  // Quotation document methods
  // ==================
  async getQuotationDocuments(quotationId: number): Promise<QuotationDocument[]> {
    const docs = await db
      .select()
      .from(quotationDocuments)
      .where(eq(quotationDocuments.quotationId, quotationId));
    
    return docs;
  }
  
  async createQuotationDocument(doc: InsertQuotationDocument): Promise<QuotationDocument> {
    const [createdDoc] = await db
      .insert(quotationDocuments)
      .values(doc)
      .returning();
    
    return createdDoc;
  }
  
  async deleteQuotationDocument(id: number): Promise<void> {
    await db
      .delete(quotationDocuments)
      .where(eq(quotationDocuments.id, id));
  }
  
  // ==================
  // Quotation terms methods
  // ==================
  async getQuotationTerms(quotationId: number): Promise<QuotationTerm[]> {
    const terms = await db
      .select()
      .from(quotationTerms)
      .where(eq(quotationTerms.quotationId, quotationId))
      .orderBy(asc(quotationTerms.sortOrder), asc(quotationTerms.category));
    
    return terms;
  }
  
  async createQuotationTerm(term: InsertQuotationTerm): Promise<QuotationTerm> {
    // Track usage if using a master term
    if (term.masterTermId) {
      // Get the quotation to get the userId
      const [quotation] = await db
        .select()
        .from(quotations)
        .where(eq(quotations.id, term.quotationId));
      
      if (quotation) {
        await this.incrementMaterialUsage(quotation.userId);
      }
    }
    
    const [createdTerm] = await db
      .insert(quotationTerms)
      .values(term)
      .returning();
    
    return createdTerm;
  }
  
  async updateQuotationTerm(id: number, term: Partial<InsertQuotationTerm>): Promise<QuotationTerm> {
    const [updatedTerm] = await db
      .update(quotationTerms)
      .set(term)
      .where(eq(quotationTerms.id, id))
      .returning();
    
    return updatedTerm;
  }
  
  async deleteQuotationTerm(id: number): Promise<void> {
    await db
      .delete(quotationTerms)
      .where(eq(quotationTerms.id, id));
  }
  
  // ==================
  // Material usage methods
  // ==================
  async trackMaterialUsage(usage: InsertMaterialUsage): Promise<MaterialUsage> {
    // Increment the user's material usage
    await this.incrementMaterialUsage(usage.userId);
    
    // Record the specific usage
    const [record] = await db
      .insert(materialUsage)
      .values({
        ...usage,
        usedAt: new Date()
      })
      .returning();
    
    return record;
  }
  
  async getMaterialUsage(userId: number): Promise<MaterialUsage[]> {
    const usage = await db
      .select()
      .from(materialUsage)
      .where(eq(materialUsage.userId, userId))
      .orderBy(desc(materialUsage.usedAt));
    
    return usage;
  }
  
  // ==================
  // Helper methods
  // ==================
  private async recalculateQuotationTotals(quotationId: number): Promise<void> {
    // Get all quotation items
    const items = await this.getQuotationItems(quotationId);
    
    // Calculate subtotal
    let subtotal = 0;
    for (const item of items) {
      subtotal += parseFloat(item.amount.toString());
    }
    
    // Get quotation to determine tax and discount
    const quotation = await this.getQuotation(quotationId);
    if (!quotation) {
      throw new Error("Quotation not found");
    }
    
    // Calculate tax and total
    const discount = quotation.discount ? parseFloat(quotation.discount.toString()) : 0;
    const discountedSubtotal = subtotal * (1 - discount / 100);
    
    let tax = 0;
    if (quotation.taxRate) {
      const taxRate = parseFloat(quotation.taxRate.toString());
      tax = discountedSubtotal * (taxRate / 100);
    }
    
    const total = discountedSubtotal + tax;
    
    // Update quotation with new totals
    await db
      .update(quotations)
      .set({
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        updatedAt: new Date(),
      })
      .where(eq(quotations.id, quotationId));
  }
  
  // ==================
  // Additional seed methods
  // ==================
  async seedQuotationData(): Promise<void> {
    // Seed master terms
    await db
      .insert(masterTerms)
      .values([
        {
          category: "Payment",
          title: "Net 30",
          content: "Payment is due within 30 days from the invoice date.",
          isActive: true,
          createdAt: new Date(),
        },
        {
          category: "Payment",
          title: "Net 15",
          content: "Payment is due within 15 days from the invoice date.",
          isActive: true,
          createdAt: new Date(),
        },
        {
          category: "Payment",
          title: "50% Advance",
          content: "50% payment is due in advance, with the remaining balance due upon delivery.",
          isActive: true,
          createdAt: new Date(),
        },
        {
          category: "Delivery",
          title: "Standard Delivery",
          content: "Delivery will be made within 10-15 business days from order confirmation.",
          isActive: true,
          createdAt: new Date(),
        },
        {
          category: "Warranty",
          title: "Standard Warranty",
          content: "All products come with a standard 12-month warranty against manufacturing defects.",
          isActive: true,
          createdAt: new Date(),
        },
        {
          category: "Refund",
          title: "No Refund Policy",
          content: "All sales are final. No refunds will be issued once services have been rendered or products delivered.",
          isActive: true,
          createdAt: new Date(),
        }
      ])
      .onConflictDoNothing();
      
    // Seed master items
    await db
      .insert(masterItems)
      .values([
        {
          code: "MAT-001",
          name: "Standard Steel Beam",
          description: "Standard structural steel I-beam, Grade A36",
          category: "Material",
          unitOfMeasure: "m",
          defaultPrice: "45.00",
          isActive: true,
          createdAt: new Date(),
        },
        {
          code: "MAT-002",
          name: "Portland Cement",
          description: "General purpose Portland cement, Type I/II",
          category: "Material",
          unitOfMeasure: "kg",
          defaultPrice: "0.15",
          isActive: true,
          createdAt: new Date(),
        },
        {
          code: "MAT-003",
          name: "Copper Pipe",
          description: "Type L copper pipe, 3/4 inch diameter",
          category: "Material",
          unitOfMeasure: "m",
          defaultPrice: "12.50",
          isActive: true,
          createdAt: new Date(),
        },
        {
          code: "SRV-001",
          name: "Engineering Consultation",
          description: "Professional engineering consultation services",
          category: "Service",
          unitOfMeasure: "hour",
          defaultPrice: "85.00",
          isActive: true,
          createdAt: new Date(),
        },
        {
          code: "SRV-002",
          name: "Installation Service",
          description: "Standard installation service by certified technician",
          category: "Service",
          unitOfMeasure: "hour",
          defaultPrice: "65.00",
          isActive: true,
          createdAt: new Date(),
        },
        {
          code: "SRV-003",
          name: "Project Management",
          description: "Project management and coordination services",
          category: "Service",
          unitOfMeasure: "day",
          defaultPrice: "450.00",
          isActive: true,
          createdAt: new Date(),
        }
      ])
      .onConflictDoNothing();
  }
}