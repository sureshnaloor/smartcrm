import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  ArrowLeft,
  Download,
  Edit,
  Clock,
  CalendarIcon,
  ClipboardCheck,
  Paperclip,
  FileText,
  Send,
  Package,
  User,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Tag,
  Plus,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QuotationItem, CompanyTerm, Document } from "@shared/schema";

interface QuotationDetailsPageProps {
  id: string;
}

export default function QuotationDetailsPage({ id }: QuotationDetailsPageProps) {
  const [, navigate] = useLocation();

  // Get quotation details
  const { data: quotation, isLoading: loadingQuotation } = useQuery({
    queryKey: [`/api/quotations/${id}`],
    queryFn: () => apiRequest("GET", `/api/quotations/${id}`).then(res => res.json()),
  });

  // Get quotation items
  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: [`/api/quotations/${id}/items`],
    queryFn: () => apiRequest("GET", `/api/quotations/${id}/items`).then(res => res.json()),
  });

  // Get quotation documents
  const { data: documents, isLoading: loadingDocuments } = useQuery({
    queryKey: [`/api/quotations/${id}/documents`],
    queryFn: () => apiRequest("GET", `/api/quotations/${id}/documents`).then(res => res.json()),
  });

  // Get quotation terms
  const { data: terms, isLoading: loadingTerms } = useQuery({
    queryKey: [`/api/quotations/${id}/terms`],
    queryFn: () => apiRequest("GET", `/api/quotations/${id}/terms`).then(res => res.json()),
  });

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return { variant: "outline" as const, label: "Draft" };
      case "sent":
        return { variant: "secondary" as const, label: "Sent" };
      case "accepted":
        return { variant: "default" as const, label: "Accepted" };
      case "rejected":
        return { variant: "destructive" as const, label: "Rejected" };
      default:
        return { variant: "outline" as const, label: "Unknown" };
    }
  };

  // Loading state
  if (loadingQuotation) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate("/quotations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-60" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  // Handle 404
  if (!quotation) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Quotation Not Found</h1>
        <p className="text-muted-foreground mb-6">The quotation you're looking for doesn't exist or has been deleted.</p>
        <Button onClick={() => navigate("/quotations")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quotations
        </Button>
      </div>
    );
  }

  const statusBadge = getStatusBadge(quotation.status);

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="mr-2" onClick={() => navigate("/quotations")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">{quotation.title}</h1>
          <Badge variant={statusBadge.variant} className="ml-4">
            {statusBadge.label}
          </Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/quotations/${id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <a href={`/api/quotations/${id}/pdf`} target="_blank" rel="noopener noreferrer">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </a>
          </Button>
          {quotation.status === "draft" && (
            <Button>
              <Send className="mr-2 h-4 w-4" />
              Send to Client
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Items & Services
              </CardTitle>
              <CardDescription>
                Products and services included in this quotation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingItems ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-6 w-60" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                  ))}
                </div>
              ) : !items || items.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  No items added to this quotation yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: QuotationItem) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{item.description}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(item.unitPrice))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(item.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">Subtotal</TableCell>
                      <TableCell className="text-right">{formatCurrency(quotation.subtotalAmount || 0)}</TableCell>
                    </TableRow>
                    {quotation.taxAmount > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">Tax ({quotation.taxRate || 0}%)</TableCell>
                        <TableCell className="text-right">{formatCurrency(quotation.taxAmount || 0)}</TableCell>
                      </TableRow>
                    )}
                    {quotation.discountAmount > 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-right font-medium">Discount</TableCell>
                        <TableCell className="text-right">-{formatCurrency(quotation.discountAmount || 0)}</TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium">Total</TableCell>
                      <TableCell className="text-right text-lg">{formatCurrency(quotation.totalAmount || 0)}</TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
            </CardContent>
          </Card>

          <Tabs defaultValue="terms" className="w-full">
            <TabsList>
              <TabsTrigger value="terms" className="flex items-center">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Terms & Conditions
              </TabsTrigger>
              <TabsTrigger value="documents" className="flex items-center">
                <Paperclip className="mr-2 h-4 w-4" />
                Documents
              </TabsTrigger>
            </TabsList>
            <TabsContent value="terms">
              <Card>
                <CardHeader>
                  <CardTitle>Terms & Conditions</CardTitle>
                  <CardDescription>
                    Terms and conditions applied to this quotation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingTerms ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : !terms || terms.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-25" />
                      <p>No terms and conditions have been added to this quotation.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {terms.map((term: CompanyTerm) => (
                        <div key={term.id} className="border rounded-lg p-4">
                          <h3 className="text-lg font-medium mb-2">{term.title}</h3>
                          <div className="whitespace-pre-wrap text-sm">
                            {term.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="documents">
              <Card>
                <CardHeader>
                  <CardTitle>Attached Documents</CardTitle>
                  <CardDescription>
                    Documents attached to this quotation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingDocuments ? (
                    <div className="space-y-4">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <div key={i} className="flex justify-between">
                          <Skeleton className="h-10 w-60" />
                          <Skeleton className="h-10 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : !documents || documents.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                      <Paperclip className="h-12 w-12 mx-auto mb-2 opacity-25" />
                      <p>No documents have been attached to this quotation.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {documents.map((doc: Document) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center">
                            <div className="p-2 mr-2 bg-muted rounded">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium">{doc.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatFileSize(doc.fileSize)}
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!quotation.clientName ? (
                <div className="text-center py-6 text-muted-foreground">
                  No client associated with this quotation.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Client Name</div>
                    <div className="flex items-center">
                      <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div>{quotation.clientName}</div>
                    </div>
                  </div>
                  
                  {quotation.clientEmail && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Email</div>
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>{quotation.clientEmail}</div>
                      </div>
                    </div>
                  )}
                  
                  {quotation.clientPhone && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Phone</div>
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                        <div>{quotation.clientPhone}</div>
                      </div>
                    </div>
                  )}
                  
                  {quotation.clientAddress && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">Address</div>
                      <div className="flex items-start">
                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div style={{ whiteSpace: 'pre-line' }}>{quotation.clientAddress}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CalendarIcon className="mr-2 h-5 w-5" />
                Quotation Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Quotation Number</div>
                  <div>{quotation.quotationNumber || "Not assigned"}</div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Date Created</div>
                  <div className="flex items-center">
                    <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>{quotation.date ? format(new Date(quotation.date), "MMMM d, yyyy") : "Not set"}</div>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Valid Until</div>
                  <div className="flex items-center">
                    <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                    <div>{quotation.validUntil ? format(new Date(quotation.validUntil), "MMMM d, yyyy") : "Not set"}</div>
                  </div>
                </div>
                
                {quotation.reference && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Reference</div>
                    <div className="flex items-center">
                      <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                      <div>{quotation.reference}</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {quotation.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line">
                  {quotation.notes}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}