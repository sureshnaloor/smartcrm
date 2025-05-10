import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { ChevronLeft, Download, Edit, FileText, Printer, Send, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface QuotationDetailsPageProps {
  id: string;
}

export default function QuotationDetailsPage({ id }: QuotationDetailsPageProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Get quotation
  const { data: quotation, isLoading, error } = useQuery({
    queryKey: ["/api/quotations", id],
    queryFn: () => apiRequest("GET", `/api/quotations/${id}`).then((res) => res.json()),
  });

  // Get quotation items
  const { data: items, isLoading: loadingItems } = useQuery({
    queryKey: ["/api/quotations", id, "items"],
    queryFn: () => apiRequest("GET", `/api/quotations/${id}/items`).then((res) => res.json()),
    enabled: !!quotation,
  });

  // Get quotation terms
  const { data: terms, isLoading: loadingTerms } = useQuery({
    queryKey: ["/api/quotations", id, "terms"],
    queryFn: () => apiRequest("GET", `/api/quotations/${id}/terms`).then((res) => res.json()),
    enabled: !!quotation,
  });

  // Get quotation documents
  const { data: documents, isLoading: loadingDocuments } = useQuery({
    queryKey: ["/api/quotations", id, "documents"],
    queryFn: () => apiRequest("GET", `/api/quotations/${id}/documents`).then((res) => res.json()),
    enabled: !!quotation,
  });

  // Function to get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Draft</Badge>;
      case "sent":
        return <Badge variant="secondary">Sent</Badge>;
      case "accepted":
        return <Badge variant="success">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "expired":
        return <Badge variant="muted">Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const handleGeneratePdf = async () => {
    try {
      const response = await apiRequest(
        "POST",
        `/api/quotations/${id}/generate-pdf`
      );
      const data = await response.json();
      
      if (data.pdfUrl) {
        window.open(data.pdfUrl, "_blank");
      }
      
      toast({
        title: "Success",
        description: "PDF generated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    }
  };

  const handleConvertToInvoice = async () => {
    try {
      const response = await apiRequest(
        "POST",
        `/api/quotations/${id}/convert-to-invoice`
      );
      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Quotation converted to invoice successfully",
      });
      
      navigate(`/invoices/${data.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to convert quotation to invoice",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/quotations">
            <Button variant="ghost" className="mr-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <div>
            {isLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              <div className="flex items-center">
                <h1 className="text-3xl font-bold mr-3">
                  {quotation?.quoteNumber || "Quotation"}
                </h1>
                {quotation && getStatusBadge(quotation.status)}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleGeneratePdf}>
            <Download className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" onClick={handleConvertToInvoice}>
            <Copy className="mr-2 h-4 w-4" />
            Convert to Invoice
          </Button>
          <Link href={`/quotations/${id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error ? (
        <div className="text-center py-8 text-red-500">
          Error loading quotation. Please try again.
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials">Materials & Services</TabsTrigger>
            <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Quotation Information</CardTitle>
                  <CardDescription>
                    Overview of quotation details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Quotation Number</h3>
                        <p className="mt-1">{quotation?.quoteNumber}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                        <p className="mt-1">{getStatusBadge(quotation?.status)}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Date</h3>
                        <p className="mt-1">
                          {quotation?.quoteDate
                            ? format(new Date(quotation.quoteDate), "MMMM d, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Valid Until</h3>
                        <p className="mt-1">
                          {quotation?.validUntil
                            ? format(new Date(quotation.validUntil), "MMMM d, yyyy")
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Currency</h3>
                        <p className="mt-1">{quotation?.currency}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground">Discount</h3>
                        <p className="mt-1">{quotation?.discount ? `${quotation.discount}%` : "0%"}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                      <p className="mt-1">{quotation?.notes || "No notes provided"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                  <CardDescription>
                    Financial summary of quotation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: quotation?.currency || "USD",
                        }).format(quotation?.subtotal || 0)}
                      </span>
                    </div>
                    
                    {quotation?.discount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Discount ({quotation.discount}%)</span>
                        <span>
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: quotation?.currency || "USD",
                          }).format(
                            ((quotation?.subtotal || 0) * (parseInt(quotation.discount) / 100)) * -1
                          )}
                        </span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax</span>
                      <span>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: quotation?.currency || "USD",
                        }).format(quotation?.tax || 0)}
                      </span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: quotation?.currency || "USD",
                        }).format(quotation?.total || 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Client Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingItems ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium">{quotation?.client?.name}</p>
                      <p>{quotation?.client?.contactName}</p>
                      <p>{quotation?.client?.email}</p>
                      <p>{quotation?.client?.phone}</p>
                      <p>{quotation?.client?.address}</p>
                      {quotation?.client?.city && (
                        <p>
                          {quotation.client.city}
                          {quotation.client.state && `, ${quotation.client.state}`}
                          {quotation.client.postalCode && ` ${quotation.client.postalCode}`}
                        </p>
                      )}
                      <p>{quotation?.client?.country}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Your Company Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingItems ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-64" />
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="font-medium">{quotation?.companyProfile?.companyName}</p>
                      <p>{quotation?.companyProfile?.contactName}</p>
                      <p>{quotation?.companyProfile?.email}</p>
                      <p>{quotation?.companyProfile?.phone}</p>
                      <p>{quotation?.companyProfile?.address}</p>
                      {quotation?.companyProfile?.city && (
                        <p>
                          {quotation.companyProfile.city}
                          {quotation.companyProfile.state && `, ${quotation.companyProfile.state}`}
                          {quotation.companyProfile.postalCode && ` ${quotation.companyProfile.postalCode}`}
                        </p>
                      )}
                      <p>{quotation?.companyProfile?.country}</p>
                      {quotation?.companyProfile?.taxId && (
                        <p>Tax ID: {quotation.companyProfile.taxId}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Materials & Services</CardTitle>
                <CardDescription>
                  Items included in this quotation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingItems ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-8 w-[400px]" />
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-8 w-24" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                ) : !items || items.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No items found</h3>
                    <p className="text-sm text-muted-foreground">
                      This quotation doesn't have any materials or services.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-3 px-4 font-medium">Description</th>
                          <th className="py-3 px-4 font-medium text-right">Quantity</th>
                          <th className="py-3 px-4 font-medium text-right">Unit Price</th>
                          <th className="py-3 px-4 font-medium text-right">Discount</th>
                          <th className="py-3 px-4 font-medium text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-b">
                            <td className="py-3 px-4">{item.description}</td>
                            <td className="py-3 px-4 text-right">{item.quantity}</td>
                            <td className="py-3 px-4 text-right">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: quotation?.currency || "USD",
                              }).format(item.unitPrice)}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {item.discount ? `${item.discount}%` : "-"}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {new Intl.NumberFormat("en-US", {
                                style: "currency",
                                currency: quotation?.currency || "USD",
                              }).format(
                                item.quantity * item.unitPrice * (1 - (item.discount ? parseInt(item.discount) / 100 : 0))
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="terms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Terms & Conditions</CardTitle>
                <CardDescription>
                  Terms and conditions for this quotation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingTerms ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : !terms || terms.length === 0 ? (
                  <div>
                    {quotation?.terms ? (
                      <div className="prose prose-sm max-w-none">
                        <pre className="whitespace-pre-wrap">{quotation.terms}</pre>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium">No terms found</h3>
                        <p className="text-sm text-muted-foreground">
                          This quotation doesn't have any terms and conditions.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {terms.map((term) => (
                      <div key={term.id} className="border-b pb-4">
                        <h3 className="font-medium text-lg mb-2">{term.title}</h3>
                        <p className="text-sm text-muted-foreground">{term.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Supporting documents for this quotation
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingDocuments ? (
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-8 w-[400px]" />
                        <Skeleton className="h-8 w-24" />
                      </div>
                    ))}
                  </div>
                ) : !documents || documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No documents found</h3>
                    <p className="text-sm text-muted-foreground">
                      This quotation doesn't have any attached documents.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-3 px-4 font-medium">Name</th>
                          <th className="py-3 px-4 font-medium">Type</th>
                          <th className="py-3 px-4 font-medium">Size</th>
                          <th className="py-3 px-4 font-medium">Date Added</th>
                          <th className="py-3 px-4 font-medium"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((doc) => (
                          <tr key={doc.id} className="border-b">
                            <td className="py-3 px-4">{doc.document.name}</td>
                            <td className="py-3 px-4">{doc.document.type}</td>
                            <td className="py-3 px-4">
                              {formatFileSize(doc.document.fileSize)}
                            </td>
                            <td className="py-3 px-4">
                              {format(new Date(doc.document.createdAt), "MMM d, yyyy")}
                            </td>
                            <td className="py-3 px-4">
                              <a 
                                href={`/api/documents/${doc.document.id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button variant="ghost" size="sm">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
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