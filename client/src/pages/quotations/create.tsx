import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { CalendarIcon, ArrowLeft, Plus, X, Save, Search, Eye, Clock, FileText, DollarSign, Users, Building2, FileSpreadsheet, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CompanyItem, Document, CompanyTerm, Client, CompanyProfile, Quotation } from "@shared/schema";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { DatePicker } from "@/components/ui/date-picker";

// Define the schema for creating a quotation
const createQuotationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  clientId: z.number().optional(),
  companyProfileId: z.number().optional(),
  date: z.date().optional(),
  validUntil: z.date().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  status: z.string().default("draft"),
});

interface FormValues {
  title: string;
  status: string;
  clientId?: number;
  companyProfileId?: number;
  date?: Date;
  validUntil?: Date;
  reference?: string;
  notes?: string;
  items: any[];
  terms: any[];
  documents: any[];
}

export default function CreateQuotationPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [previewMode, setPreviewMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<any[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [itemsDialogOpen, setItemsDialogOpen] = useState(false);
  const [termsDialogOpen, setTermsDialogOpen] = useState(false);
  const [documentsDialogOpen, setDocumentsDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormValues>({
    title: "",
    status: "draft",
    clientId: undefined,
    companyProfileId: undefined,
    date: undefined,
    validUntil: undefined,
    reference: "",
    notes: "",
    items: [],
    terms: [],
    documents: []
  });

  // Define the form
  const form = useForm<FormValues>({
    resolver: zodResolver(createQuotationSchema),
    defaultValues: {
      title: "",
      status: "draft",
      date: new Date(),
    },
  });

  // Get clients
  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: () => apiRequest("GET", "/api/clients").then(res => res.json()),
  });

  // Get company profiles
  const { data: companyProfiles } = useQuery({
    queryKey: ["/api/company-profiles"],
    queryFn: () => apiRequest("GET", "/api/company-profiles").then(res => res.json()),
  });

  // Get materials and services
  const { data: companyItems, isLoading: loadingCompanyItems } = useQuery({
    queryKey: ["/api/materials/company", categoryFilter],
    queryFn: () => 
      apiRequest(
        "GET", 
        categoryFilter ? `/api/materials/company?category=${categoryFilter}` : "/api/materials/company"
      ).then(res => res.json()),
  });

  // Get terms
  const { data: companyTerms, isLoading: loadingCompanyTerms } = useQuery({
    queryKey: ["/api/terms/company"],
    queryFn: () => apiRequest("GET", "/api/terms/company").then(res => res.json()),
  });

  // Get documents
  const { data: documents, isLoading: loadingDocuments } = useQuery({
    queryKey: ["/api/documents"],
    queryFn: () => apiRequest("GET", "/api/documents").then(res => res.json()),
  });

  // Filter materials and services based on search term
  const filteredCompanyItems = companyItems?.filter(
    (item: CompanyItem) => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter terms based on search term
  const filteredCompanyTerms = companyTerms?.filter(
    (term: CompanyTerm) => 
      term.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      term.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter documents based on search term
  const filteredDocuments = documents?.filter(
    (doc: Document) => 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Create quotation mutation
  const createQuotation = useMutation({
    mutationFn: async (data: FormValues & { items: any[], terms: any[], documents: any[] }) => {
      return apiRequest("POST", "/api/quotations", data).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
      navigate("/quotations");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create quotation. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate total amount
  const calculateTotal = (): { subtotal: number, total: number } => {
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.quantity * Number(item.price)), 0);
    return {
      subtotal,
      total: subtotal // Add tax calculations later
    };
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast({
        title: "Warning",
        description: "Please add at least one item to the quotation",
        variant: "destructive",
      });
      return;
    }

    const formattedItems = selectedItems.map(item => ({
      name: item.name,
      description: item.description,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: Number(item.price),
      totalPrice: item.quantity * Number(item.price),
      materialItemId: item.id,
    }));

    const formattedTerms = selectedTerms.map(term => ({
      title: term.title,
      content: term.content,
      termId: term.id,
    }));

    const formattedDocuments = selectedDocuments.map(doc => ({
      documentId: doc.id,
    }));

    const { subtotal, total } = calculateTotal();

    const quotationData = {
      ...formData,
      items: formattedItems,
      terms: formattedTerms,
      documents: formattedDocuments,
      subtotalAmount: subtotal,
      totalAmount: total,
    };

    createQuotation.mutate(quotationData);
  };

  // Add an item to the quotation
  const addItem = (item: any) => {
    // Check if item is already added
    const existingItem = selectedItems.find(i => i.id === item.id);
    if (existingItem) {
      // Update quantity
      setSelectedItems(selectedItems.map(i => 
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      // Add new item with quantity 1
      setSelectedItems([...selectedItems, { ...item, quantity: 1 }]);
    }
  };

  // Remove an item from the quotation
  const removeItem = (itemId: number) => {
    setSelectedItems(selectedItems.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const updateItemQuantity = (itemId: number, quantity: number) => {
    if (quantity < 1) return;
    setSelectedItems(selectedItems.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  // Add a term to the quotation
  const addTerm = (term: any) => {
    // Check if term is already added
    const existingTerm = selectedTerms.find(t => t.id === term.id);
    if (!existingTerm) {
      setSelectedTerms([...selectedTerms, term]);
    }
  };

  // Remove a term from the quotation
  const removeTerm = (termId: number) => {
    setSelectedTerms(selectedTerms.filter(term => term.id !== termId));
  };

  // Add a document to the quotation
  const addDocument = (document: any) => {
    // Check if document is already added
    const existingDocument = selectedDocuments.find(d => d.id === document.id);
    if (!existingDocument) {
      setSelectedDocuments([...selectedDocuments, document]);
    }
  };

  // Remove a document from the quotation
  const removeDocument = (documentId: number) => {
    setSelectedDocuments(selectedDocuments.filter(doc => doc.id !== documentId));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <div className="flex h-[calc(100vh-64px)]">
        <div className="w-64 flex-shrink-0">
          <Sidebar />
        </div>
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/quotations")}
                  className="hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Create Quotation
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Create a new quotation for your client
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="flex items-center"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {previewMode ? "Edit Mode" : "Preview Mode"}
                </Button>
                <Button
                  type="submit"
                  form="quotation-form"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Quotation
                </Button>
              </div>
            </div>

            {/* Form and Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Form */}
              <div className={`${previewMode ? 'hidden lg:block' : ''}`}>
                <form id="quotation-form" onSubmit={handleSubmit} className="space-y-6">
                  <Card className="bg-white dark:bg-gray-800 shadow-lg border-none">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold">Quotation Details</CardTitle>
                      <CardDescription>Enter the basic information for your quotation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="quoteNumber">Quotation Number</Label>
                          <Input
                            id="quoteNumber"
                            name="quoteNumber"
                            placeholder="Q-2024-001"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="clientId">Client</Label>
                          <Select name="clientId" required>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                            <SelectContent>
                              {clients?.map((client: any) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Quotation Date</Label>
                          <DatePicker
                            date={formData.date}
                            setDate={(date) => setFormData({ ...formData, date })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="validUntil">Valid Until</Label>
                          <DatePicker
                            date={formData.validUntil}
                            setDate={(date) => setFormData({ ...formData, validUntil: date })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea
                          id="notes"
                          name="notes"
                          placeholder="Enter any additional notes or terms..."
                          rows={4}
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800 shadow-lg border-none">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold">Items</CardTitle>
                      <CardDescription>Add items to your quotation</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Item rows will be added here */}
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => {/* Add item row */}}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Item
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </div>

              {/* Preview */}
              <div className={`${!previewMode ? 'hidden lg:block' : ''}`}>
                <Card className="bg-white dark:bg-gray-800 shadow-lg border-none">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold">Preview</CardTitle>
                    <CardDescription>See how your quotation will look</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-[1/1.414] bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8">
                      {/* Preview content will be rendered here */}
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        Preview will be available when you start filling the form
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}