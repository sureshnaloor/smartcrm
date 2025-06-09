import type { Express, Request, Response } from "express";
import multer from "multer";
import { storage } from "./invoice-storage";
import {
  insertQuotationSchema,
  insertQuotationItemSchema,
  insertQuotationTermSchema,
  insertQuotationDocumentSchema,
  insertCompanyItemSchema,
  insertCompanyTermSchema,
  insertDocumentSchema,
  insertClientSchema
} from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import path from "path";
import fs from "fs";
import session from "express-session";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { quotations } from "./../shared/schema";

// Setup multer for file uploads
const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Helper for authentication
const authenticate = async (req: Request & { session?: session.Session & { userId?: number } }, res: Response): Promise<number | undefined> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }
  const user = await storage.getUserById(userId);
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return undefined;
  }
  return userId;
};

// Check user's quote quota
const checkQuoteQuota = async (userId: number, res: Response): Promise<boolean> => {
  const user = await storage.getUserById(userId);
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  
  // Check if subscription has expired for "per-invoice" plan
  if (user.planId === "per-invoice" && user.subscriptionExpiresAt) {
    const now = new Date();
    if (now > user.subscriptionExpiresAt) {
      res.status(403).json({ message: "Your quote bundle has expired" });
      return false;
    }
  }
  
  // Check if user has exceeded their quota
  if (user.quoteQuota !== -1 && (user.quotesUsed ?? 0) >= (user.quoteQuota ?? 0)) {
    res.status(403).json({ message: "You have reached your quote quota for this period" });
    return false;
  }
  
  return true;
};

// Check user's material record quota
const checkMaterialUsageQuota = async (userId: number, res: Response): Promise<boolean> => {
  const user = await storage.getUserById(userId);
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  
  const plan = await storage.getSubscriptionPlan(user.planId);
  if (!plan) {
    res.status(500).json({ message: "Subscription plan not found" });
    return false;
  }
  
  // If the plan doesn't include central masters, deny access
  if (!plan.includesCentralMasters) {
    res.status(403).json({ message: "Your subscription plan does not include access to the central repository" });
    return false;
  }
  
  // Check if user has exceeded their material usage quota
  if (plan.materialRecordsLimit !== -1 && (user.materialRecordsUsed ?? 0) >= (plan.materialRecordsLimit ?? 0)) {
    res.status(403).json({ message: "You have reached your material usage quota for this period" });
    return false;
  }
  
  return true;
};

// Handle validation errors
const handleValidation = <T>(schema: any, data: T): T => {
  try {
    return schema.parse(data);
  } catch (error: any) {
    if (error instanceof ZodError) {
      const validationError = fromZodError(error);
      throw new Error(validationError.message);
    }
    throw error;
  }
};

export function registerQuotationRoutes(app: Express): void {
  // Health check endpoint for AWS EB monitoring
  app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "health ok" });
  });

  // Materials and Services Master routes
  app.get("/api/materials/master", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    // Check if user's plan allows access to master items
    if (!(await checkMaterialUsageQuota(userId, res))) return;
    
    try {
      const category = req.query.category as string | undefined;
      const items = await storage.getMasterItems(category);
      res.json(items);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.get("/api/materials/master/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    // Check if user's plan allows access to master items
    if (!(await checkMaterialUsageQuota(userId, res))) return;
    
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getMasterItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Material or service not found" });
      }
      
      res.json(item);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  // Company Materials and Services routes
  app.get("/api/materials/company", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const category = req.query.category as string | undefined;
      const items = await storage.getCompanyItems(userId, category);
      res.json(items);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.get("/api/materials/company/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getCompanyItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Material or service not found" });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(item);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.post("/api/materials/company", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const itemData = insertCompanyItemSchema.parse({
        ...req.body,
        userId
      });
      
      // If using a master item, check quota
      if (itemData.masterItemId && !(await checkMaterialUsageQuota(userId, res))) {
        return;
      }
      
      const item = await storage.createCompanyItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  app.put("/api/materials/company/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getCompanyItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Material or service not found" });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedItem = await storage.updateCompanyItem(id, req.body);
      res.json(updatedItem);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  app.delete("/api/materials/company/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const id = parseInt(req.params.id);
      const item = await storage.getCompanyItem(id);
      
      if (!item) {
        return res.status(404).json({ message: "Material or service not found" });
      }
      
      if (item.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteCompanyItem(id);
      res.status(204).send();
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  // Terms and Conditions Master routes
  app.get("/api/terms/master", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    // Check if user's plan allows access to master terms
    if (!(await checkMaterialUsageQuota(userId, res))) return;
    
    try {
      const category = req.query.category as string | undefined;
      const terms = await storage.getMasterTerms(category);
      res.json(terms);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.get("/api/terms/master/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    // Check if user's plan allows access to master terms
    if (!(await checkMaterialUsageQuota(userId, res))) return;
    
    try {
      const id = parseInt(req.params.id);
      const term = await storage.getMasterTerm(id);
      
      if (!term) {
        return res.status(404).json({ message: "Term not found" });
      }
      
      res.json(term);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  // Company Terms and Conditions routes
  app.get("/api/terms/company", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const category = req.query.category as string | undefined;
      const terms = await storage.getCompanyTerms(userId, category);
      res.json(terms);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.get("/api/terms/company/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const id = parseInt(req.params.id);
      const term = await storage.getCompanyTerm(id);
      
      if (!term) {
        return res.status(404).json({ message: "Term not found" });
      }
      
      if (term.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(term);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.post("/api/terms/company", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const termData = handleValidation(insertCompanyTermSchema, {
        ...req.body,
        userId
      });
      
      // If using a master term, check quota
      if (termData.masterTermId && !(await checkMaterialUsageQuota(userId, res))) {
        return;
      }
      
      const term = await storage.createCompanyTerm(termData);
      res.status(201).json(term);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  app.put("/api/terms/company/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const id = parseInt(req.params.id);
      const term = await storage.getCompanyTerm(id);
      
      if (!term) {
        return res.status(404).json({ message: "Term not found" });
      }
      
      if (term.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedTerm = await storage.updateCompanyTerm(id, req.body);
      res.json(updatedTerm);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  app.delete("/api/terms/company/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const id = parseInt(req.params.id);
      const term = await storage.getCompanyTerm(id);
      
      if (!term) {
        return res.status(404).json({ message: "Term not found" });
      }
      
      if (term.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteCompanyTerm(id);
      res.status(204).send();
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  // Document management routes
  app.get("/api/documents", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const type = req.query.type as string | undefined;
      const documents = await storage.getUserDocuments(userId, type);
      res.json(documents);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.get("/api/documents/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(document);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.get("/api/documents/:id/download", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check if file exists
      if (!fs.existsSync(document.filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      // Set appropriate content type
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${document.name}"`);
      
      // Stream the file
      const fileStream = fs.createReadStream(document.filePath);
      fileStream.pipe(res);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.post("/api/documents", upload.single("file"), async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }
      
      const { originalname, mimetype, path: filePath, size } = req.file;
      
      // Get document type from request body
      const { type } = req.body;
      if (!type) {
        return res.status(400).json({ message: "Document type is required" });
      }
      
      const documentData = handleValidation(insertDocumentSchema, {
        userId,
        name: originalname,
        type,
        filePath,
        fileSize: size,
        mimeType: mimetype
      });
      
      const document = await storage.createDocument(documentData);
      res.status(201).json(document);
    } catch (error) {
      // Clean up uploaded file if there was an error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  app.delete("/api/documents/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const id = parseInt(req.params.id);
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Delete the file from disk if it exists
      if (fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }
      
      await storage.deleteDocument(id);
      res.status(204).send();
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  // Quotation routes
  app.get("/api/quotations", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotations = await storage.getQuotations(userId);
      res.json(quotations);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.get("/api/quotations/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.getQuotation(id);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(quotation);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.post("/api/quotations", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    // Check quota
    if (!(await checkQuoteQuota(userId, res))) return;
    
    try {
      const quotationData = handleValidation(insertQuotationSchema, {
        ...req.body,
        userId
      });
      
      // Validate company profile and client
      const companyProfile = await storage.getCompanyProfile(quotationData.companyProfileId);
      if (!companyProfile || companyProfile.userId !== userId) {
        return res.status(400).json({ message: "Invalid company profile" });
      }
      
      const client = await storage.getClient(quotationData.clientId);
      if (!client || client.userId !== userId) {
        return res.status(400).json({ message: "Invalid client" });
      }
      
      const quotation = await storage.createQuotation(quotationData);
      
      res.status(201).json(quotation);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  app.put("/api/quotations/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.getQuotation(id);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedQuotation = await storage.updateQuotation(id, req.body);
      res.json(updatedQuotation);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  app.delete("/api/quotations/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const id = parseInt(req.params.id);
      const quotation = await storage.getQuotation(id);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteQuotation(id);
      res.status(204).send();
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  // Quotation items routes
  app.get("/api/quotations/:id/items", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const items = await storage.getQuotationItems(quotationId);
      res.json(items);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.post("/api/quotations/:id/items", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // If using a master item, check quota
      if (req.body.masterItemId && !(await checkMaterialUsageQuota(userId, res))) {
        return;
      }
      
      const itemData = handleValidation(insertQuotationItemSchema, {
        ...req.body,
        quotationId
      });
      
      const item = await storage.createQuotationItem(itemData);
      res.status(201).json(item);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  app.put("/api/quotations/:quotationId/items/:itemId", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.quotationId);
      const itemId = parseInt(req.params.itemId);
      
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedItem = await storage.updateQuotationItem(itemId, req.body);
      res.json(updatedItem);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  app.delete("/api/quotations/:quotationId/items/:itemId", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.quotationId);
      const itemId = parseInt(req.params.itemId);
      
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteQuotationItem(itemId);
      res.status(204).send();
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  // Import items from Excel for quotation 
  app.post("/api/quotations/:id/import-excel", upload.single("file"), async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    const quotationId = parseInt(req.params.id);
    const quotation = await storage.getQuotation(quotationId);
    
    if (!quotation) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    
    if (quotation.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    try {
      // Parse Excel file - reusing existing function
      const excelParser = await import("./lib/excel-parser");
      const items = await excelParser.parseExcelFile(req.file.path);
      
      // Add items to quotation
      const createdItems = [];
      for (const item of items) {
        const itemData = handleValidation(insertQuotationItemSchema, {
          description: item.description,
          quantity: item.quantity !== undefined ? String(item.quantity) : "0",
          unitPrice: item.unitPrice !== undefined ? String(item.unitPrice) : "0",
          discount: item.discount !== undefined ? String(item.discount) : "0",
          quotationId
        });
                const createdItem = await storage.createQuotationItem(itemData);
        createdItems.push(createdItem);
      }
      
      // Clean up temporary file
      fs.unlinkSync(req.file.path);
      
      res.json({ 
        message: `Successfully imported ${createdItems.length} items`,
        items: createdItems
      });
    } catch (error) {
      // Clean up temporary file
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  // Quotation terms routes
  app.get("/api/quotations/:id/terms", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const terms = await storage.getQuotationTerms(quotationId);
      res.json(terms);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.post("/api/quotations/:id/terms", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // If using a master term, check quota
      if (req.body.masterTermId && !(await checkMaterialUsageQuota(userId, res))) {
        return;
      }
      
      const termData = handleValidation(insertQuotationTermSchema, {
        ...req.body,
        quotationId
      });
      
      const term = await storage.createQuotationTerm(termData);
      res.status(201).json(term);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  app.put("/api/quotations/:quotationId/terms/:termId", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.quotationId);
      const termId = parseInt(req.params.termId);
      
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedTerm = await storage.updateQuotationTerm(termId, req.body);
      res.json(updatedTerm);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  app.delete("/api/quotations/:quotationId/terms/:termId", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.quotationId);
      const termId = parseInt(req.params.termId);
      
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      await storage.deleteQuotationTerm(termId);
      res.status(204).send();
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  // Quotation document attachment routes
  app.get("/api/quotations/:id/documents", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const documents = await storage.getQuotationDocuments(quotationId);
      
      // Get full document details for each attachment
      const fullDocuments = [];
      for (const docAttachment of documents) {
        const document = await storage.getDocument(docAttachment.documentId);
        if (document) {
          fullDocuments.push({
            ...docAttachment,
            document
          });
        }
      }
      
      res.json(fullDocuments);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  app.post("/api/quotations/:id/documents", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Verify document exists and belongs to user
      const documentId = req.body.documentId;
      if (!documentId) {
        return res.status(400).json({ message: "Document ID is required" });
      }
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      if (document.userId !== userId) {
        return res.status(403).json({ message: "Access denied to document" });
      }
      
      const docData = handleValidation(insertQuotationDocumentSchema, {
        quotationId,
        documentId
      });
      
      const attachment = await storage.createQuotationDocument(docData);
      
      // Return full document details
      res.status(201).json({
        ...attachment,
        document
      });
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  app.delete("/api/quotations/:quotationId/documents/:documentId", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.quotationId);
      const documentId = parseInt(req.params.documentId);
      
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Find the quotation document by its ID
      const documents = await storage.getQuotationDocuments(quotationId);
      const attachment = documents.find(doc => doc.documentId === documentId);
      
      if (!attachment) {
        return res.status(404).json({ message: "Document attachment not found" });
      }
      
      await storage.deleteQuotationDocument(attachment.id);
      res.status(204).send();
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  // Convert quotation to invoice
  app.post("/api/quotations/:id/convert-to-invoice", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Check invoice quota
      const checkQuota = await import("./invoice-routes");
      if (!(await checkQuota.checkInvoiceQuota(userId, res))) {
        return;
      }
      
      // Create invoice from quotation data
      const invoice = await storage.createInvoice({
        userId,
        companyProfileId: quotation.companyProfileId,
        clientId: quotation.clientId,
        quotationId: quotation.id,
        invoiceNumber: req.body.invoiceNumber || `INV-${Date.now()}`,
        invoiceDate: new Date(),
        dueDate: req.body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Default: 30 days
        country: quotation.country,
        currency: quotation.currency,
        templateId: quotation.templateId,
        discount: quotation.discount ?? undefined,
        taxRate: quotation.taxRate ?? undefined,
        notes: quotation.notes,
        terms: quotation.terms,
        status: 'draft'
      });
      
      // Return the created invoice
      res.status(201).json(invoice);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(400).json({ message });
    }
  });
  
  // Generate quotation PDF
  app.post("/api/quotations/:id/generate-pdf", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    try {
      const quotationId = parseInt(req.params.id);
      const quotation = await storage.getQuotation(quotationId);
      
      if (!quotation) {
        return res.status(404).json({ message: "Quotation not found" });
      }
      
      if (quotation.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get related data
      const companyProfile = await storage.getCompanyProfile(quotation.companyProfileId);
      if (!companyProfile) {
        return res.status(404).json({ message: "Company profile not found" });
      }
      
      const client = await storage.getClient(quotation.clientId);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      const items = await storage.getQuotationItems(quotationId);

      if (!quotation.templateId) {
        return res.status(404).json({ message: "Template not found" });
      }
      const template = await storage.getInvoiceTemplate(quotation.templateId);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }
      
      // Generate PDF using the existing PDF generator but with quotation data
      const pdfGenerator = await import("./lib/pdf-generator");
      
      // Create directory for PDFs if it doesn't exist
      const pdfDir = path.join(process.cwd(), "uploads", "pdfs");
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }
      
      // Generate a unique filename
      const filename = `quotation_${quotationId}_${Date.now()}.pdf`;
      const pdfPath = path.join(pdfDir, filename);
      
      // Generate PDF
      await pdfGenerator.generatePdf(
        // Convert quotation to invoice format for PDF generator
        {
          id: quotation.id,
          userId: quotation.userId,
          companyProfileId: quotation.companyProfileId,
          clientId: quotation.clientId,
          quotationId: quotation.id,
          invoiceNumber: quotation.quoteNumber,
          invoiceDate: quotation.quoteDate,
          dueDate: quotation.validUntil,
          country: quotation.country,
          currency: quotation.currency,
          templateId: quotation.templateId,
          subtotal: quotation.subtotal,
          discount: quotation.discount,
          tax: quotation.tax,
          taxRate: quotation.taxRate,
          total: quotation.total,
          notes: quotation.notes,
          terms: quotation.terms,
          status: 'draft',
          pdfUrl: null,
          createdAt: quotation.createdAt,
          updatedAt: quotation.updatedAt
        },
        companyProfile,
        client,
        items.map(item => ({
          ...item,
          invoiceId: quotation.id,
          quotationItemId: item.id
        })),
        template
      );
      
      // Create document record
      const document = await storage.createDocument({
        userId,
        name: `quotation_${quotationId}.pdf`,
        type: 'quotation',
        filePath: pdfPath,
        fileSize: fs.statSync(pdfPath).size,
        mimeType: 'application/pdf'
      });

      // Update quotation with PDF URL
      const pdfUrl = `/api/documents/${document.id}/download`;
      const [updatedQuotation] = await db
        .update(quotations)
        .set({ [quotations.pdfUrl.name]: pdfUrl as string })
        .where(eq(quotations.id, quotation.id))
        .returning();
      
      // Return the updated quotation
      res.json(updatedQuotation);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
  
  // Get central repository clients
  app.get("/api/central-repo/clients", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    // Check if user's plan allows access to central repository
    if (!(await checkMaterialUsageQuota(userId, res))) return;
    
    try {
      const clients = await storage.getCentralRepoClients();
      res.json(clients);
    } catch (error) {
      const message = (error && typeof error === "object" && "message" in error) ? (error as any).message : String(error);
      res.status(500).json({ message });
    }
  });
}