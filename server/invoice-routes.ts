import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./invoice-storage";
import { 
  insertUserSchema, 
  insertCompanyProfileSchema, 
  insertClientSchema, 
  insertInvoiceSchema, 
  insertInvoiceItemSchema,
  type InsertUser,
  type InsertCompanyProfile,
  type InsertClient,
  type InsertInvoice,
  type InsertInvoiceItem
} from "../shared/schema";
import { generatePdf } from "./lib/pdf-generator";
import multer from "multer";
import { parseExcelFile } from "./lib/excel-parser";
import fs from "fs";
import path from "path";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import crypto from "crypto";
import session from "express-session";
import { compare } from "bcrypt";

// Setup multer for file uploads
const upload = multer({ dest: "uploads/" });

// Helper for authentication - modified to always return a default user ID
const authenticate = async (req: Request & { session?: session.Session & { userId?: number } }, res: Response): Promise<number> => {
  // Return a default user ID (1) for all requests
  return 1;
};

// Check user's invoice quota
export const checkInvoiceQuota = async (userId: number, res: Response): Promise<boolean> => {
  const user = await storage.getUserById(userId);
  if (!user) {
    res.status(401).json({ message: "Unauthorized" });
    return false;
  }
  
  // Check if subscription has expired for "per-invoice" plan
  if (user.planId === "per-invoice" && user.subscriptionExpiresAt) {
    const now = new Date();
    if (now > user.subscriptionExpiresAt) {
      res.status(403).json({ message: "Your invoice bundle has expired" });
      return false;
    }
  }
  
  // Check if user has exceeded their quota
  if (user.invoiceQuota !== -1 && (user.invoicesUsed ?? 0) >= (user.invoiceQuota ?? 0)) {
    res.status(403).json({ message: "You have reached your invoice quota for this period" });
    return false;
  }
  
  return true;
};

// Helper for validation
const handleValidation = <T>(schema: any, data: unknown): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof ZodError) {
      throw fromZodError(error);
    }
    throw error;
  }
};

// Import quotation routes
import { registerQuotationRoutes } from "./quotation-routes";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register quotation related routes
  registerQuotationRoutes(app);

  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Use sessions
  app.use((req: Request & { session?: session.Session & { userId?: number } }, res, next) => {
    if (!req.session) {
      req.session = {} as session.Session & { userId?: number };
    }
    // Set default user ID for all requests
    req.session.userId = 1;
    next();
  });
  
  // Handle validation errors
  app.use((err: any, req: Request, res: Response, next: any) => {
    if (err instanceof ZodError) {
      const validationError = fromZodError(err);
      return res.status(400).json({ message: validationError.message });
    }
    next(err);
  });
  
  // Auth routes - modified to always succeed
  app.post("/api/auth/register", async (req: Request & { session?: session.Session & { userId?: number } }, res) => {
    try {
      const userData = handleValidation<InsertUser & { password: string }>(insertUserSchema, req.body);
      const user = await storage.createUser(userData);
      const { passwordHash, ...userWithoutPassword } = user;
      req.session!.userId = user.id;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: (error instanceof Error ? error.message : String(error)) });
    }
  });
  
  app.post("/api/auth/login", async (req: Request & { session?: session.Session & { userId?: number } }, res) => {
    try {
      const { email, password } = req.body;
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const { passwordHash: _, ...userWithoutPassword } = user;
      req.session!.userId = user.id;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.post("/api/auth/logout", (req: Request & { session?: session.Session }, res) => {
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          return res.status(500).json({ message: "Logout failed" });
        }
        res.json({ message: "Logged out successfully" });
      });
    } else {
      res.json({ message: "Logged out successfully" });
    }
  });
  
  app.get("/api/auth/me", async (req: Request & { session?: session.Session & { userId?: number } }, res: Response) => {
    const userId = await authenticate(req as Request & { session?: session.Session & { userId?: number } }, res);
    const user = await storage.getUserById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });
  
  // Company profiles routes
  app.get("/api/company-profiles", async (req: Request & { session?: session.Session & { userId?: number } }, res: Response) => {
    const userId = await authenticate(req, res);
    const profiles = await storage.getCompanyProfiles(userId);
    res.json(profiles);
  });
  
  app.get("/api/company-profiles/:id", async (req: Request & { session?: session.Session & { userId?: number } }, res: Response) => {
    const userId = await authenticate(req, res);
    const profileId = parseInt(req.params.id, 10);
    const profile = await storage.getCompanyProfile(profileId);
    if (!profile) {
      return res.status(404).json({ message: "Company profile not found" });
    }
    res.json(profile);
  });
  
  app.post("/api/company-profiles", async (req: Request & { session?: session.Session & { userId?: number } }, res: Response) => {
    const userId = await authenticate(req, res);
    try {
      const profileData = handleValidation<InsertCompanyProfile>(insertCompanyProfileSchema, {
        ...req.body,
        userId
      });
      const profile = await storage.createCompanyProfile(profileData);
      res.status(201).json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.put("/api/company-profiles/:id", async (req: Request & { session?: session.Session & { userId?: number } }, res: Response) => {
    const userId = await authenticate(req, res);
    const profileId = parseInt(req.params.id, 10);
    const profile = await storage.getCompanyProfile(profileId);
    if (!profile) {
      return res.status(404).json({ message: "Company profile not found" });
    }
    try {
      const updatedProfile = await storage.updateCompanyProfile(profileId, req.body);
      res.json(updatedProfile);
    } catch (error: any) {
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.delete("/api/company-profiles/:id", async (req: Request & { session?: session.Session & { userId?: number } }, res: Response) => {
    const userId = await authenticate(req, res);
    const profileId = parseInt(req.params.id, 10);
    const profile = await storage.getCompanyProfile(profileId);
    if (!profile) {
      return res.status(404).json({ message: "Company profile not found" });
    }
    try {
      await storage.deleteCompanyProfile(profileId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Client routes
  app.get("/api/clients", async (req, res) => {
    const userId = await authenticate(req, res);
    const clients = await storage.getClients(userId);
    res.json(clients);
  });
  
  app.get("/api/clients/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    const clientId = parseInt(req.params.id, 10);
    const client = await storage.getClient(clientId);
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    if (client.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(client);
  });
  
  app.post("/api/clients", async (req: Request & { session?: session.Session & { userId?: number } }, res: Response) => {
    const userId = await authenticate(req, res);
    try {
      const clientData = handleValidation<InsertClient>(insertClientSchema, {
        ...req.body,
        userId
      });
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error: any) {
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.put("/api/clients/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    const clientId = parseInt(req.params.id, 10);
    const client = await storage.getClient(clientId);
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    if (client.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const updatedClient = await storage.updateClient(clientId, req.body);
      res.json(updatedClient);
    } catch (error: any) {
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.delete("/api/clients/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    const clientId = parseInt(req.params.id, 10);
    const client = await storage.getClient(clientId);
    
    if (!client) {
      return res.status(404).json({ message: "Client not found" });
    }
    
    if (client.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      await storage.deleteClient(clientId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Invoice routes
  app.get("/api/invoices", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    const invoices = await storage.getInvoices(userId);
    res.json(invoices);
  });
  
  app.get("/api/invoices/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    const invoiceId = parseInt(req.params.id, 10);
    const invoice = await storage.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    res.json(invoice);
  });
  
  app.post("/api/invoices", async (req: Request & { session?: session.Session & { userId?: number } }, res: Response) => {
    const userId = await authenticate(req, res);
    try {
      const invoiceData: any = {
        userId,
        invoiceDate: new Date(req.body.invoiceDate),
        companyProfileId: parseInt(req.body.companyProfileId, 10),
        clientId: parseInt(req.body.clientId, 10),
        invoiceNumber: req.body.invoiceNumber,
        country: req.body.country,
        currency: req.body.currency,
        status: req.body.status || "draft",
        discount: req.body.discount || "0",
        taxRate: req.body.taxRate,
        notes: req.body.notes,
        terms: req.body.terms,
        quotationId: req.body.quotationId ? parseInt(req.body.quotationId, 10) : undefined,
        templateId: req.body.templateId || "classic"
      };
      if (req.body.dueDate) {
        const parsed = new Date(req.body.dueDate);
        if (!isNaN(parsed.getTime())) {
          invoiceData.dueDate = parsed;
        }
      }
      const validatedInvoiceData = handleValidation<InsertInvoice>(insertInvoiceSchema, invoiceData);
      const invoice = await storage.createInvoice(validatedInvoiceData);
      res.status(201).json(invoice);
    } catch (error: any) {
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.put("/api/invoices/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    const invoiceId = parseInt(req.params.id, 10);
    const invoice = await storage.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      const updatedInvoice = await storage.updateInvoice(invoiceId, req.body);
      res.json(updatedInvoice);
    } catch (error: any) {
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.delete("/api/invoices/:id", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    const invoiceId = parseInt(req.params.id, 10);
    const invoice = await storage.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      await storage.deleteInvoice(invoiceId);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Invoice items routes
  app.get("/api/invoices/:id/items", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    const invoiceId = parseInt(req.params.id, 10);
    const invoice = await storage.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const items = await storage.getInvoiceItems(invoiceId);
    res.json(items);
  });
  
  app.post("/api/invoice-items", async (req: Request & { session?: session.Session & { userId?: number } }, res: Response) => {
    const userId = await authenticate(req, res);
    try {
      const itemData = handleValidation<InsertInvoiceItem>(insertInvoiceItemSchema, {
        invoiceId: parseInt(req.body.invoiceId, 10),
        description: req.body.description,
        quantity: req.body.quantity,
        unitPrice: req.body.unitPrice,
        discount: req.body.discount || "0",
        quotationItemId: req.body.quotationItemId ? parseInt(req.body.quotationItemId, 10) : undefined
      });
      const item = await storage.createInvoiceItem(itemData);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.put("/api/invoice-items/:id", async (req: Request & { session?: session.Session & { userId?: number } }, res: Response) => {
    const userId = await authenticate(req, res);
    const itemId = parseInt(req.params.id, 10);
    try {
      const itemData = handleValidation<InsertInvoiceItem>(insertInvoiceItemSchema, {
        invoiceId: parseInt(req.body.invoiceId, 10),
        description: req.body.description,
        quantity: req.body.quantity,
        unitPrice: req.body.unitPrice,
        discount: req.body.discount || "0",
        quotationItemId: req.body.quotationItemId ? parseInt(req.body.quotationItemId, 10) : undefined
      });
      const item = await storage.updateInvoiceItem(itemId, itemData as Partial<InsertInvoiceItem>);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  app.delete("/api/invoices/:invoiceId/items/:itemId", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    const invoiceId = parseInt(req.params.invoiceId, 10);
    const itemId = parseInt(req.params.itemId, 10);
    
    const invoice = await storage.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      await storage.deleteInvoiceItem(itemId);
      res.status(204).send();
    } catch (error) {
      res.status(400).json({ message: (error instanceof Error ? error.message : String(error)) });
    }
  });
  
  // Import Excel for invoice items
  app.post("/api/invoices/:id/import-excel", upload.single("file"), async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    const invoiceId = parseInt(req.params.id, 10);
    const invoice = await storage.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    
    try {
      // Parse Excel file
      const items = await parseExcelFile(req.file.path);
      
      // Add items to invoice
      const createdItems = [];
      for (const item of items) {
        const itemData = handleValidation(insertInvoiceItemSchema, {
          ...item,
          invoiceId
        });
        
        const createdItem = await storage.createInvoiceItem(itemData);
        createdItems.push(createdItem);
      }
      
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      
      res.status(201).json(createdItems);
    } catch (error) {
      // Clean up uploaded file
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(400).json({ message: error instanceof Error ? error.message : String(error) });
    }
  });
  
  // Generate PDF for invoice
  app.get("/api/invoices/:id/pdf", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    const invoiceId = parseInt(req.params.id, 10);
    const invoice = await storage.getInvoice(invoiceId);
    
    if (!invoice) {
      return res.status(404).json({ message: "Invoice not found" });
    }
    
    if (invoice.userId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    
    try {
      // Get related data
      const companyProfile = await storage.getCompanyProfile(invoice.companyProfileId);
      const client = await storage.getClient(invoice.clientId);
      const items = await storage.getInvoiceItems(invoiceId);

      if (!invoice.templateId) {
        return res.status(400).json({ message: "Missing required data for PDF generation" });
      }
      const template = await storage.getInvoiceTemplate(invoice.templateId);

      if (!companyProfile || !client || !template) {
        return res.status(400).json({ message: "Missing required data for PDF generation" });
      }
      
      // Generate PDF
      const pdfBuffer = await generatePdf(invoice, companyProfile, client, items, template);
      
      // Set response headers
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
      
      // Send PDF
      res.send(pdfBuffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(500).json({ message: "Error generating PDF: " + message });
    }
  });
  
  // Subscription plans routes
  app.get("/api/subscription-plans", async (req, res) => {
    const plans = await storage.getSubscriptionPlans();
    res.json(plans);
  });
  
  // Tax rates routes
  app.get("/api/tax-rates", async (req, res) => {
    const taxRates = await storage.getTaxRates();
    res.json(taxRates);
  });
  
  app.get("/api/tax-rates/:countryCode", async (req, res) => {
    const countryCode = req.params.countryCode;
    const taxRates = await storage.getTaxRatesByCountry(countryCode);
    res.json(taxRates);
  });
  
  // Invoice templates routes
  app.get("/api/invoice-templates", async (req, res) => {
    const userId = await authenticate(req, res);
    if (!userId) return;
    
    // Check if user has premium templates access
    const user = await storage.getUserById(userId);
    const hasPremiumAccess = user && user.planId !== "free";
    
    const templates = await storage.getInvoiceTemplates(!!hasPremiumAccess);
    res.json(templates);
  });
  
  const httpServer = createServer(app);
  return httpServer;
}

// In all catch blocks, type error as 'any' to safely access error.message
