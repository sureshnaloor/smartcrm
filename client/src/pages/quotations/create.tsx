import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { CalendarIcon, ArrowLeft, Plus, X, Save, Search } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CompanyItem, Document, CompanyTerm, Client, CompanyProfile } from "@shared/schema";

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

type FormValues = z.infer<typeof createQuotationSchema>;

export default function CreateQuotationPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
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
      navigate(`/quotations/${data.id}`);
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

  // Handle form submission
  const onSubmit = (values: FormValues) => {
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
      ...values,
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
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate("/quotations")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Create New Quotation</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="items">Items & Services</TabsTrigger>
              <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
              <TabsTrigger value="documents">Documents</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>
                    Enter the basic information for your quotation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quotation Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter quotation title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="validUntil"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Valid Until</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="w-full pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="clientId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Client</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a client" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {clients?.map((client: Client) => (
                              <SelectItem key={client.id} value={client.id.toString()}>
                                {client.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="companyProfileId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Profile</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your company profile" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {companyProfiles?.map((profile: CompanyProfile) => (
                              <SelectItem key={profile.id} value={profile.id.toString()}>
                                {profile.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="reference"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reference Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional reference number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes for the quotation"
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="items" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Items & Services</CardTitle>
                      <CardDescription>
                        Add materials and services to your quotation
                      </CardDescription>
                    </div>
                    <Dialog open={itemsDialogOpen} onOpenChange={setItemsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Items
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Items</DialogTitle>
                          <DialogDescription>
                            Select materials and services to add to your quotation
                          </DialogDescription>
                        </DialogHeader>
                        <div className="my-4 space-y-4">
                          <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-grow">
                              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                placeholder="Search items..."
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                              />
                            </div>
                            <Select value={categoryFilter || ""} onValueChange={(value) => setCategoryFilter(value || null)}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="All Categories" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">All Categories</SelectItem>
                                <SelectItem value="material">Materials</SelectItem>
                                <SelectItem value="service">Services</SelectItem>
                                <SelectItem value="equipment">Equipment</SelectItem>
                                <SelectItem value="labor">Labor</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {loadingCompanyItems ? (
                            <div className="space-y-4">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <Skeleton className="h-12 w-[70%]" />
                                  <Skeleton className="h-10 w-[100px]" />
                                </div>
                              ))}
                            </div>
                          ) : !filteredCompanyItems || filteredCompanyItems.length === 0 ? (
                            <div className="text-center py-12">
                              <p className="text-muted-foreground">
                                {searchTerm || categoryFilter
                                  ? "No items match your search criteria."
                                  : "No items available. Add materials and services to your catalog first."}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {filteredCompanyItems.map((item: CompanyItem) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between border rounded-lg p-3"
                                >
                                  <div>
                                    <div className="font-medium">{item.name}</div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Badge variant="outline">{item.category}</Badge>
                                      <span>|</span>
                                      <span>{item.unitOfMeasure}</span>
                                      <span>|</span>
                                      <span>{formatCurrency(Number(item.price))}</span>
                                    </div>
                                  </div>
                                  <Button 
                                    onClick={() => addItem(item)}
                                    disabled={selectedItems.some(i => i.id === item.id)}
                                  >
                                    {selectedItems.some(i => i.id === item.id) ? "Added" : "Add"}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setItemsDialogOpen(false)}
                          >
                            Done
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedItems.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        No items added to the quotation yet.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setItemsDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Items
                      </Button>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedItems.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.category} | {item.unit}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                                  disabled={item.quantity <= 1}
                                >
                                  -
                                </Button>
                                <Input
                                  className="w-16 h-8 text-center"
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                                >
                                  +
                                </Button>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(Number(item.price))}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.quantity * Number(item.price))}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeItem(item.id)}
                                className="text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <tfoot>
                        <tr>
                          <td colSpan={3} className="text-right font-medium p-2">Subtotal:</td>
                          <td className="text-right p-2">{formatCurrency(calculateTotal().subtotal)}</td>
                          <td></td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="text-right font-medium p-2">Total:</td>
                          <td className="text-right p-2 text-lg font-bold">{formatCurrency(calculateTotal().total)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="terms" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Terms & Conditions</CardTitle>
                      <CardDescription>
                        Add terms and conditions to your quotation
                      </CardDescription>
                    </div>
                    <Dialog open={termsDialogOpen} onOpenChange={setTermsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Terms
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Terms & Conditions</DialogTitle>
                          <DialogDescription>
                            Select terms and conditions to add to your quotation
                          </DialogDescription>
                        </DialogHeader>
                        <div className="my-4 space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search terms..."
                              className="pl-10"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          
                          {loadingCompanyTerms ? (
                            <div className="space-y-4">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-24 w-full" />
                              ))}
                            </div>
                          ) : !filteredCompanyTerms || filteredCompanyTerms.length === 0 ? (
                            <div className="text-center py-12">
                              <p className="text-muted-foreground">
                                {searchTerm
                                  ? "No terms match your search criteria."
                                  : "No terms available. Create terms and conditions in the Terms section first."}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              {filteredCompanyTerms.map((term: CompanyTerm) => (
                                <div
                                  key={term.id}
                                  className="border rounded-lg p-4"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div>
                                      <h3 className="font-medium">{term.title}</h3>
                                      <Badge variant="outline">{term.category}</Badge>
                                    </div>
                                    <Button 
                                      onClick={() => addTerm(term)}
                                      disabled={selectedTerms.some(t => t.id === term.id)}
                                    >
                                      {selectedTerms.some(t => t.id === term.id) ? "Added" : "Add"}
                                    </Button>
                                  </div>
                                  <div className="text-sm text-muted-foreground line-clamp-3">
                                    {term.content}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setTermsDialogOpen(false)}
                          >
                            Done
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedTerms.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        No terms and conditions added to the quotation yet.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setTermsDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Terms
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedTerms.map((term) => (
                        <div key={term.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{term.title}</h3>
                              <Badge variant="outline" className="mt-1">{term.category}</Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeTerm(term.id)}
                              className="text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="text-sm mt-2 whitespace-pre-wrap">
                            {term.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="documents" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Documents</CardTitle>
                      <CardDescription>
                        Attach documents to your quotation
                      </CardDescription>
                    </div>
                    <Dialog open={documentsDialogOpen} onOpenChange={setDocumentsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Documents
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Add Documents</DialogTitle>
                          <DialogDescription>
                            Select documents to attach to your quotation
                          </DialogDescription>
                        </DialogHeader>
                        <div className="my-4 space-y-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search documents..."
                              className="pl-10"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>
                          
                          {loadingDocuments ? (
                            <div className="space-y-4">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                  <Skeleton className="h-12 w-[70%]" />
                                  <Skeleton className="h-10 w-[100px]" />
                                </div>
                              ))}
                            </div>
                          ) : !filteredDocuments || filteredDocuments.length === 0 ? (
                            <div className="text-center py-12">
                              <p className="text-muted-foreground">
                                {searchTerm
                                  ? "No documents match your search criteria."
                                  : "No documents available. Upload documents in the Documents section first."}
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {filteredDocuments.map((doc: Document) => (
                                <div
                                  key={doc.id}
                                  className="flex items-center justify-between border rounded-lg p-3"
                                >
                                  <div>
                                    <div className="font-medium">{doc.name}</div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Badge variant="outline">{doc.type}</Badge>
                                      <span>|</span>
                                      <span>{formatFileSize(doc.fileSize)}</span>
                                    </div>
                                  </div>
                                  <Button 
                                    onClick={() => addDocument(doc)}
                                    disabled={selectedDocuments.some(d => d.id === doc.id)}
                                  >
                                    {selectedDocuments.some(d => d.id === doc.id) ? "Added" : "Add"}
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button 
                            variant="outline" 
                            onClick={() => setDocumentsDialogOpen(false)}
                          >
                            Done
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground mb-4">
                        No documents attached to the quotation yet.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setDocumentsDialogOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Documents
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between border rounded-lg p-3"
                        >
                          <div>
                            <div className="font-medium">{doc.name}</div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Badge variant="outline">{doc.type}</Badge>
                              <span>|</span>
                              <span>{formatFileSize(doc.fileSize)}</span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeDocument(doc.id)}
                            className="text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/quotations")}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createQuotation.isPending}
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {createQuotation.isPending ? "Creating..." : "Create Quotation"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}