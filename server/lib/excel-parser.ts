import * as XLSX from 'xlsx';
import type { WorkBook, WorkSheet } from "xlsx";
import type { InsertInvoiceItem } from "@shared/schema";

// Expected column names in the Excel file
const EXPECTED_COLUMNS = {
  description: ['description', 'item', 'product', 'service', 'name', 'desc'],
  quantity: ['quantity', 'qty', 'amount', 'count'],
  unitPrice: ['unit price', 'price', 'rate', 'unit cost', 'cost', 'unitprice'],
  discount: ['discount', 'disc', 'discount percentage', 'discount %', 'disc %'],
};

/**
 * Parse Excel file and extract invoice items
 * @param filePath Path to the uploaded Excel file
 * @returns Array of invoice items
 */
export async function parseExcelFile(filePath: string): Promise<InsertInvoiceItem[]> {
  try {
    // Read the Excel file
    const workbook = XLSX.readFile(filePath);
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet);
    
    if (!Array.isArray(rawData) || rawData.length === 0) {
      throw new Error('Excel file contains no data');
    }
    
    // Map column headers to expected fields
    const columnMap = mapColumns(rawData[0] as Record<string, any>);
    
    // Convert raw data to invoice items
    const invoiceItems: InsertInvoiceItem[] = rawData.map((row) => {
      // Extract values from the row using mapped column headers
      const description = extractStringValue(row as Record<string, any>, columnMap.description);
      const quantity = extractNumberValue(row as Record<string, any>, columnMap.quantity);
      const unitPrice = extractNumberValue(row as Record<string, any>, columnMap.unitPrice);
      const discount = extractNumberValue(row as Record<string, any>, columnMap.discount, true); // Optional field
      
      // Validate required fields
      if (!description) {
        throw new Error('Item description is required');
      }
      
      if (quantity === undefined || quantity <= 0) {
        throw new Error(`Invalid quantity for item "${description}"`);
      }
      
      if (unitPrice === undefined || unitPrice < 0) {
        throw new Error(`Invalid unit price for item "${description}"`);
      }
      
      // Create invoice item object
      const invoiceItem: InsertInvoiceItem = {
        description,
        quantity: quantity.toString(),
        unitPrice: unitPrice.toString(),
        invoiceId: 0, // Will be set by the caller
      };
      
      // Add discount if present
      if (discount !== undefined) {
        invoiceItem.discount = discount.toString();
      }
      
      return invoiceItem;
    });
    
    return invoiceItems;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    } else {
      throw new Error('Failed to parse Excel file: Unknown error');
    }
  }
}

/**
 * Map column headers in the Excel file to expected fields
 */
function mapColumns(firstRow: Record<string, any>): Record<string, string> {
  const columnMap: Record<string, string> = {};
  const headers = Object.keys(firstRow);
  
  // Map each expected column to a header in the Excel file
  for (const [field, possibleNames] of Object.entries(EXPECTED_COLUMNS)) {
    const matchedHeader = headers.find((header) => 
      possibleNames.includes(header.toLowerCase())
    );
    
    if (matchedHeader) {
      columnMap[field] = matchedHeader;
    }
  }
  
  // Check if required columns are mapped
  if (!columnMap.description) {
    throw new Error('Description column not found in Excel file');
  }
  
  if (!columnMap.quantity) {
    throw new Error('Quantity column not found in Excel file');
  }
  
  if (!columnMap.unitPrice) {
    throw new Error('Unit price column not found in Excel file');
  }
  
  return columnMap;
}

/**
 * Extract string value from a row
 */
function extractStringValue(row: Record<string, any>, column?: string): string {
  if (!column || row[column] === undefined) return '';
  return String(row[column]).trim();
}

/**
 * Extract number value from a row
 */
function extractNumberValue(row: Record<string, any>, column?: string, optional = false): number | undefined {
  if (!column) {
    return optional ? undefined : 0;
  }
  
  const value = row[column];
  
  if (value === undefined) {
    return optional ? undefined : 0;
  }
  
  // Try to convert the value to a number
  const num = Number(value);
  
  if (isNaN(num)) {
    if (optional) {
      return undefined;
    }
    throw new Error(`Invalid number value: ${value}`);
  }
  
  return num;
}

/**
 * Generate an example/template Excel file
 */
export function generateTemplateExcel(): Buffer {
  // Create a new workbook
  const workbook = XLSX.utils.book_new();
  
  // Create sample data
  const sampleData = [
    {
      Description: 'Website Development',
      Quantity: 1,
      'Unit Price': 1500,
      'Discount %': 0
    },
    {
      Description: 'Logo Design',
      Quantity: 1,
      'Unit Price': 500,
      'Discount %': 10
    },
    {
      Description: 'Hosting (1 year)',
      Quantity: 1,
      'Unit Price': 120,
      'Discount %': 0
    }
  ];
  
  // Create a worksheet from the sample data
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Invoice Items');
  
  // Generate Excel file buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  
  return buffer;
}
