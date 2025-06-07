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
  // Client/customer methods
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

    const insertData = {
      name: item.name,
      description: item.description,
      category: item.category,
      unitOfMeasure: item.unitOfMeasure,
      defaultPrice: item.defaultPrice != null ? String(item.defaultPrice) : null,
      isActive: true,
      ...(item.code ? { code: item.code } : {})
    };

    const [createdItem] = await db
      .insert(masterItems)
      .values(insertData)
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

    const safeItem = item as InsertCompanyItem;

    // Check if this is from a master item, track usage
    if (item.masterItemId) {
      await this.trackMaterialUsage({
        userId: item.userId,
        masterItemId: item.masterItemId,
        quotationId: null
      });
    }
    
    const insertData = {
      name: item.name!,
      description: item.description!,
      category: item.category!,
      unitOfMeasure: item.unitOfMeasure!,
      price: String(item.price),
      userId: Number(item.userId),
          } satisfies typeof companyItems.$inferInsert;

    const [createdItem] = await db
      .insert(companyItems)
      .values(insertData)
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
        price: String(item.price),
        userId: Number(item.userId),       
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
    let query;
    if (category) {
      query = db
        .select()
        .from(companyTerms)
        .where(and(eq(companyTerms.userId, userId), eq(companyTerms.category, category)));
    } else {
      query = db
        .select()
        .from(companyTerms)
        .where(eq(companyTerms.userId, userId));
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
      await this.clearDefaultCompanyTerm(Number(term.userId), term.category);
    }
    
    const [createdTerm] = await db
      .insert(companyTerms)
      .values({       
        userId: Number(term.userId),
        category: term.category,
        title: term.title,
        content: term.content,
        
        
      } satisfies typeof companyTerms.$inferInsert)
      .returning();
    
    return createdTerm;
  }
  
  async updateCompanyTerm(id: number, term: Partial<InsertCompanyTerm>): Promise<CompanyTerm> {
    // If setting as default, clear any existing default term
    if (term.isDefault) {
      const existingTerm = await this.getCompanyTerm(id);
      if (existingTerm) {
        await this.clearDefaultCompanyTerm(Number(existingTerm.userId), existingTerm.category);
      }
    }
    
    const [updatedTerm] = await db
      .update(companyTerms)
      .set({
        userId: Number(term.userId),
        category: term.category,
        title: term.title,
        content: term.content,
        
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
      .set({ [companyTerms.isDefault.name]: false })
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
      .values({
        userId: Number(document.userId),
        name: document.name,
        type: document.type,        
        filePath: document.filePath,
        fileSize: Number(document.fileSize),
        mimeType: document.mimeType,
      } satisfies typeof documents.$inferInsert)
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
    
    const [createdQuote] = await db
      .insert(quotations)
      .values({
        userId: Number(quotation.userId),
        companyProfileId: Number(quotation.companyProfileId),
        clientId: Number(quotation.clientId),
        quoteNumber: quotation.quoteNumber,
        quoteDate: quotation.quoteDate instanceof Date ? quotation.quoteDate : new Date(quotation.quoteDate as string | number | Date),
        country: quotation.country,
        currency: quotation.currency,
        
        subtotal: "0",
        total: "0"
      } satisfies typeof quotations.$inferInsert)
      .returning();
    
    // Increment quote usage
    await this.incrementQuoteUsage(Number(quotation.userId));
    
    return createdQuote;
  }
  
  async updateQuotation(id: number, quotation: Partial<typeof quotations.$inferInsert>): Promise<Quotation> {
    const [updatedQuote] = await db
      .update(quotations)
      .set({
        ...quotation
      })
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
    
    // If this is from a master item, track usage
    if (item.masterItemId) {
      // Get the quotation to get the userId
      const [quotation] = await db
        .select()
        .from(quotations)
        .where(eq(quotations.id, Number(item.quotationId)));
      
      if (quotation) {
        await this.trackMaterialUsage({
          userId: quotation.userId,
          masterItemId: item.masterItemId,
          quotationId: Number(item.quotationId)
        });
      }
    }
    
    // Create the item
    const [createdItem] = await db
      .insert(quotationItems)
      .values({
        quotationId: Number(item.quotationId),
        description: item.description,
        quantity: String(item.quantity),       
        
        unitPrice: String(item.unitPrice),
        
        amount,
      } satisfies typeof quotationItems.$inferInsert)
      .returning();
    
    // Recalculate quotation totals
    await this.recalculateQuotationTotals(Number(item.quotationId));
    
    return createdItem;
  }
  
  async updateQuotationItem(id: number, item: Partial<InsertQuotationItem>): Promise<QuotationItem> {
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
      discount: item.discount ? String(item.discount) : undefined,
      // Will be set below if needed
    } satisfies Partial<InsertQuotationItem>;
    
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
    await this.recalculateQuotationTotals(Number(existingItem.quotationId));
    
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
      .values({
        quotationId: Number(doc.quotationId),
        documentId: Number(doc.documentId),
      } satisfies typeof quotationDocuments.$inferInsert)
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
        .where(eq(quotations.id, Number(term.quotationId)));
      
      if (quotation) {
        await this.incrementMaterialUsage(quotation.userId);
      }
    }
    
    const [createdTerm] = await db
      .insert(quotationTerms)
      .values({
        quotationId: Number(term.quotationId),
        category: term.category!,
        title: term.title!,
        content: term.content!,
        
        
        
      } satisfies typeof quotationTerms.$inferInsert)
      .returning();
    
    return createdTerm;
  }
  
  async updateQuotationTerm(id: number, term: Partial<InsertQuotationTerm>): Promise<QuotationTerm> {
    const updateData = {
      ...term,
      quotationId: term.quotationId !== undefined ? Number(term.quotationId) : undefined,
      masterTermId: term.masterTermId !== undefined ? Number(term.masterTermId) : undefined,
      companyTermId: term.companyTermId !== undefined ? Number(term.companyTermId) : undefined,
      sortOrder: term.sortOrder !== undefined ? Number(term.sortOrder) : undefined,
    };
    const [updatedTerm] = await db
      .update(quotationTerms)
      .set(updateData)
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
    await this.incrementMaterialUsage(Number(usage.userId));
    
    // Record the specific usage
    const [record] = await db
      .insert(materialUsage)
      .values({
        userId: Number(usage.userId),
        masterItemId: Number(usage.masterItemId),
        
        
      } satisfies typeof materialUsage.$inferInsert)
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
        
        total: total.toString(),
        
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
          content: "Payment is due within 30 days from the invoice date."
        },
        {
          category: "Payment",
          title: "Net 15",
          content: "Payment is due within 15 days from the invoice date."
        },
        {
          category: "Payment",
          title: "50% Advance",
          content: "50% payment is due in advance, with the remaining balance due upon delivery."
        },
        {
          category: "Delivery",
          title: "Standard Delivery",
          content: "Delivery will be made within 10-15 business days from order confirmation."
        },
        {
          category: "Warranty",
          title: "Standard Warranty",
          content: "All products come with a standard 12-month warranty against manufacturing defects."
        },
        {
          category: "Refund",
          title: "No Refund Policy",
          content: "All sales are final. No refunds will be issued once services have been rendered or products delivered."
        }
      ] satisfies InsertMasterTerm[])
      .onConflictDoNothing();
      
    // Seed master items
    await db
      .insert(masterItems)
      .values([
        {
        
          name: "Standard Steel Beam",
          description: "Standard structural steel I-beam, Grade A36",
          category: "Material",
          unitOfMeasure: "m",
          
          
        },
        {
          
          name: "Portland Cement",
          description: "General purpose Portland cement, Type I/II",
          category: "Material",
          unitOfMeasure: "kg",
          
        },       {
          
          name: "Copper Pipe",
          description: "Type L copper pipe, 3/4 inch diameter",
          category: "Material",
          unitOfMeasure: "m",

        },
        {
          
          name: "Engineering Consultation",
          description: "Professional engineering consultation services",
          category: "Service",
          unitOfMeasure: "hour",

        },
        {
          
          name: "Installation Service",
          description: "Standard installation service by certified technician",
          category: "Service",
          unitOfMeasure: "hour",
          
          
        },
        {
          
          name: "Project Management",
          description: "Project management and coordination services",
          category: "Service",
          unitOfMeasure: "day",
          
          
        }
      ] as typeof masterItems.$inferInsert[])
      .onConflictDoNothing({ target: masterItems.code });
  }

  async incrementQuoteUsage(userId: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");
    
    const currentUsage = user.quotesUsed || 0;
    
    await db
      .update(users)
      .set({
        [users.quotesUsed.name]: currentUsage + 1
      })
      .where(eq(users.id, userId));
  }

  private async incrementMaterialUsage(userId: number): Promise<void> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) throw new Error("User not found");
    
    const currentUsage = user.materialRecordsUsed || 0;
    
    await db
      .update(users)
      .set({
        [users.materialRecordsUsed.name]: currentUsage + 1
      })
      .where(eq(users.id, userId));
  }
}