import type PDFKit from "pdfkit";
import type { Invoice, CompanyProfile, Client, InvoiceItem, InvoiceTemplate } from "@shared/schema";
import PDFDocument from 'pdfkit';
// Remove import since formatDate is defined in this file

// Helper function to format currency amounts
function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const numberAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numberAmount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${currency} ${numberAmount.toFixed(2)}`;
  }
}

// Get currency symbol
function getCurrencySymbol(currencyCode: string): string {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    CAD: 'CA$',
    AUD: 'A$',
    CHF: 'CHF',
    CNY: '¥',
    INR: '₹',
    HKD: 'HK$',
  };
  return symbols[currencyCode] || currencyCode;
}

// Truncate text with ellipsis if it exceeds max length
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

export async function generatePdf(
  invoice: Invoice,
  companyProfile: CompanyProfile,
  client: Client,
  invoiceItems: InvoiceItem[],
  template: InvoiceTemplate
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create a PDF document
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      // Collect PDF data chunks
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      
      // Resolve with the complete PDF buffer when done
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      
      // Handle errors
      doc.on('error', (err) => reject(err));

      // Set document properties
      doc.info.Title = `Invoice ${invoice.invoiceNumber}`;
      doc.info.Author = companyProfile.name;
      doc.info.Subject = `Invoice for ${client.name}`;
      
      // Add styles based on template
      applyTemplate(doc, template.id);
      
      // Add company header
      generateHeader(doc, companyProfile);
      
      // Add invoice information section
      generateInvoiceInfo(doc, invoice, client);
      
      // Add items table
      generateInvoiceTable(doc, invoice, invoiceItems);
      
      // Add summary section
      generateSummary(doc, invoice, companyProfile);
      
      // Add footer
      generateFooter(doc, invoice, companyProfile);
      
      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

// Apply template styling
function applyTemplate(doc: PDFKit.PDFDocument, templateId: string): void {
  // Default fonts and colors
  doc.font('Helvetica');
  
  switch (templateId) {
    case 'modern-blue':
      // Modern Blue template
      doc.lineWidth(1);
      // Add a blue header bar
      doc.fillColor('#3b82f6').rect(0, 0, doc.page.width, 80).fill();
      doc.moveDown(5);
      break;
      
    case 'executive':
      // Executive template
      doc.lineWidth(1.5);
      // Add a dark header bar
      doc.fillColor('#1e3a8a').rect(0, 0, doc.page.width, 100).fill();
      doc.moveDown(6);
      break;
      
    case 'minimal':
      // Minimal template
      doc.lineWidth(0.5);
      // Clean white design with subtle gray background
      doc.fillColor('#f9fafb').rect(0, 0, doc.page.width, doc.page.height).fill();
      doc.fillColor('#000000');
      doc.moveDown(2);
      break;
      
    case 'dynamic':
      // Dynamic template with angled elements
      doc.lineWidth(1);
      // Colorful header with angled element
      doc.fillColor('#8b5cf6').polygon(
        [0, 0],
        [doc.page.width, 0],
        [doc.page.width - 200, 100],
        [0, 100]
      ).fill();
      doc.moveDown(6);
      break;
      
    case 'geometric':
      // Geometric template
      doc.lineWidth(1);
      // Geometric patterns
      doc.fillColor('#e0f2fe');
      for (let i = 0; i < doc.page.width; i += 40) {
        doc.circle(i, 40, 20).fill();
      }
      doc.moveDown(5);
      break;
      
    case 'classic':
    default:
      // Classic template (default)
      doc.lineWidth(0.5);
      // Simple elegant styling
      doc.fillColor('#f8fafc').rect(0, 0, doc.page.width, 40).fill();
      doc.fillColor('#000000');
      doc.moveDown(2);
      break;
  }
}

// Generate the company header section
function generateHeader(doc: PDFKit.PDFDocument, companyProfile: CompanyProfile): void {
  doc.fontSize(20).fillColor('#000000').text(companyProfile.name, 50, 110, { align: 'left' });
  
  doc.fontSize(10).fillColor('#666666');
  
  // Company address
  const addressParts = [];
  if (companyProfile.address) addressParts.push(companyProfile.address);
  if (companyProfile.city || companyProfile.state || companyProfile.postalCode) {
    const cityLine = [
      companyProfile.city,
      companyProfile.state,
      companyProfile.postalCode
    ].filter(Boolean).join(', ');
    addressParts.push(cityLine);
  }
  if (companyProfile.country) addressParts.push(companyProfile.country);
  
  doc.text(addressParts.join('\n'), 50, doc.y + 10);
  
  // Company contact info
  const contactParts = [];
  if (companyProfile.email) contactParts.push(`Email: ${companyProfile.email}`);
  if (companyProfile.phone) contactParts.push(`Phone: ${companyProfile.phone}`);
  if (companyProfile.website) contactParts.push(`Web: ${companyProfile.website}`);
  if (companyProfile.taxId) contactParts.push(`Tax ID: ${companyProfile.taxId}`);
  
  doc.text(contactParts.join('\n'), 50, doc.y + 10);
  
  // Right align invoice title
  doc.fontSize(24).fillColor('#000000').text('INVOICE', 400, 110, { align: 'right' });
  
  doc.moveDown(1);
}

// Generate the invoice information section
function generateInvoiceInfo(doc: PDFKit.PDFDocument, invoice: Invoice, client: Client): void {
  doc.fillColor('#444444').fontSize(14).text('Bill To:', 50, doc.y + 20);
  
  // Client information
  doc.fontSize(12).text(client.name, 50, doc.y + 5);
  
  const clientAddress = [];
  if (client.address) clientAddress.push(client.address);
  if (client.city || client.state || client.postalCode) {
    const cityLine = [
      client.city,
      client.state,
      client.postalCode
    ].filter(Boolean).join(', ');
    clientAddress.push(cityLine);
  }
  if (client.country) clientAddress.push(client.country);
  
  doc.fontSize(10).fillColor('#666666').text(clientAddress.join('\n'), 50, doc.y + 5);
  
  if (client.taxId) {
    doc.text(`Tax ID: ${client.taxId}`, 50, doc.y + 5);
  }
  
  if (client.email) {
    doc.text(`Email: ${client.email}`, 50, doc.y + 5);
  }
  
  if (client.phone) {
    doc.text(`Phone: ${client.phone}`, 50, doc.y + 5);
  }
  
  // Invoice details
  doc.fontSize(12).fillColor('#444444');
  
  const invoiceInfoX = 400;
  
  doc.text('Invoice Number:', invoiceInfoX, doc.y - (10 * (clientAddress.length + 2)));
  doc.text(invoice.invoiceNumber, invoiceInfoX + 150, doc.y - 12, { align: 'right' });
  
  doc.text('Invoice Date:', invoiceInfoX, doc.y);
  doc.text(formatDate(invoice.invoiceDate, 'PPP'), invoiceInfoX + 150, doc.y - 12, { align: 'right' });
  
  if (invoice.dueDate) {
    doc.text('Due Date:', invoiceInfoX, doc.y);
    doc.text(formatDate(invoice.dueDate, 'PPP'), invoiceInfoX + 150, doc.y - 12, { align: 'right' });
  }
  
  doc.moveDown(3);
  
  // Horizontal line
  doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  
  doc.moveDown(1);
}

// Generate the invoice items table
function generateInvoiceTable(doc: PDFKit.PDFDocument, invoice: Invoice, items: InvoiceItem[]): void {
  // Table headers
  const tableTop = doc.y;
  doc.fontSize(10).fillColor('#444444');
  
  // Header row
  doc.font('Helvetica-Bold')
     .text('Item Description', 50, tableTop, { width: 250 })
     .text('Quantity', 300, tableTop, { width: 70, align: 'right' })
     .text('Unit Price', 370, tableTop, { width: 80, align: 'right' })
     .text('Discount', 450, tableTop, { width: 50, align: 'right' })
     .text('Amount', 500, tableTop, { width: 50, align: 'right' });
  
  doc.moveDown(0.5);
  
  // Underline headers
  doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  
  doc.moveDown(0.5);
  
  // Table rows
  doc.font('Helvetica');
  let position = doc.y;
  
  // Currency symbol
  const currencySymbol = getCurrencySymbol(invoice.currency);
  
  items.forEach((item) => {
    position = doc.y;
    
    // Description (truncate if too long)
    doc.fillColor('#000000')
       .text(truncateText(item.description, 80), 50, position, { width: 250 });
    
    // Quantity
    doc.text(item.quantity.toString(), 300, position, { width: 70, align: 'right' });
    
    // Unit price
    doc.text(
      formatCurrency(item.unitPrice, invoice.currency),
      370, 
      position, 
      { width: 80, align: 'right' }
    );
    
    // Discount
    doc.text(
      item.discount ? `${item.discount}%` : '0%',
      450,
      position,
      { width: 50, align: 'right' }
    );
    
    // Amount
    doc.text(
      formatCurrency(item.amount, invoice.currency),
      500,
      position,
      { width: 50, align: 'right' }
    );
    
    doc.moveDown(1);
  });
  
  // Bottom border
  doc.strokeColor('#cccccc').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  
  doc.moveDown(1);
}

// Generate the invoice summary section
function generateSummary(doc: PDFKit.PDFDocument, invoice: Invoice, companyProfile: CompanyProfile): void {
  const summaryX = 350;
  const valueX = 550;
  const subtotal = parseFloat(invoice.subtotal.toString());
  const discount = parseFloat(invoice.discount?.toString() || '0');
  const tax = parseFloat(invoice.tax?.toString() || '0');
  const total = parseFloat(invoice.total.toString());
  
  doc.fontSize(10).fillColor('#444444');
  
  // Subtotal
  doc.text('Subtotal:', summaryX, doc.y, { align: 'left' });
  doc.text(
    formatCurrency(subtotal, invoice.currency),
    valueX,
    doc.y - 12,
    { align: 'right' }
  );
  
  // Discount
  if (discount > 0) {
    doc.text('Discount:', summaryX, doc.y, { align: 'left' });
    doc.text(
      `- ${formatCurrency(discount, invoice.currency)}`,
      valueX,
      doc.y - 12,
      { align: 'right' }
    );
  }
  
  // Tax
  if (tax > 0) {
    const taxLabel = `${invoice.taxRate ? `(${invoice.taxRate}%)` : ''} Tax:`;
    doc.text(taxLabel, summaryX, doc.y, { align: 'left' });
    doc.text(
      formatCurrency(tax, invoice.currency),
      valueX,
      doc.y - 12,
      { align: 'right' }
    );
  }
  
  // Total
  doc.font('Helvetica-Bold');
  doc.text('Total:', summaryX, doc.y + 5, { align: 'left' });
  doc.text(
    formatCurrency(total, invoice.currency),
    valueX,
    doc.y - 12,
    { align: 'right' }
  );
  
  doc.font('Helvetica');
  doc.moveDown(2);
  
  // Payment information
  if (companyProfile.bankName || companyProfile.bankAccountNumber) {
    doc.fontSize(11).fillColor('#444444').text('Payment Information', 50, doc.y, { underline: true });
    doc.moveDown(0.5);
    
    doc.fontSize(10);
    
    if (companyProfile.bankName) {
      doc.text(`Bank: ${companyProfile.bankName}`, 50, doc.y);
    }
    
    if (companyProfile.bankAccountName) {
      doc.text(`Account Name: ${companyProfile.bankAccountName}`, 50, doc.y);
    }
    
    if (companyProfile.bankAccountNumber) {
      doc.text(`Account Number: ${companyProfile.bankAccountNumber}`, 50, doc.y);
    }
    
    if (companyProfile.bankRoutingNumber) {
      doc.text(`Sort Code/Routing: ${companyProfile.bankRoutingNumber}`, 50, doc.y);
    }
    
    if (companyProfile.bankSwiftBic) {
      doc.text(`SWIFT/BIC: ${companyProfile.bankSwiftBic}`, 50, doc.y);
    }
    
    if (companyProfile.bankIban) {
      doc.text(`IBAN: ${companyProfile.bankIban}`, 50, doc.y);
    }
    
    doc.moveDown(1);
  }
  
  // Notes
  if (invoice.notes) {
    doc.fontSize(11).fillColor('#444444').text('Notes', 50, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(invoice.notes, 50, doc.y, { width: 500 });
    doc.moveDown(1);
  }
  
  // Terms
  if (invoice.terms) {
    doc.fontSize(11).fillColor('#444444').text('Terms & Conditions', 50, doc.y, { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).text(invoice.terms, 50, doc.y, { width: 500 });
  }
}

// Generate the footer
function generateFooter(doc: PDFKit.PDFDocument, invoice: Invoice, companyProfile: CompanyProfile): void {
  doc.fontSize(9).fillColor('#666666');
  
  // Position at the bottom of the page
  doc.text(
    `Thank you for your business. Invoice ${invoice.invoiceNumber} generated on ${formatDate(new Date(), 'PPP')}.`,
    50,
    700,
    { align: 'center', width: 500 }
  );
}

// Format date helper
function formatDate(date: Date | string, format: string = 'PPP'): string {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error: any) {
    console.error('Error formatting date:', error);
    return '';
  }
}
// In all catch blocks, type error as 'any' to safely access error.message
