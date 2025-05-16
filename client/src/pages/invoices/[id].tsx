import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";
import { InvoiceItemTable } from "@/components/invoice/invoice-item-table";
import { InvoiceSummary } from "@/components/invoice/invoice-summary";
import { UpgradeBanner } from "@/components/subscription/upgrade-banner";
import { Helmet } from "react-helmet-async";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  User,
  CalendarDays,
  Download,
  Send,
  Edit,
  Trash,
  AlertCircle,
  Mail,
  Phone,
  FileText,
  Loader2,
} from "lucide-react";
import type { Invoice, CompanyProfile, Client, InvoiceItem } from "../../../../shared/schema";

interface InvoiceDetailsPageProps {
  id: string;
}

export default function InvoiceDetailsPage({ id }: InvoiceDetailsPageProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const invoiceId = parseInt(id);

  // Fetch invoice
  const { data: invoice, isLoading, error } = useQuery<Invoice>({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !isNaN(invoiceId),
  });

  // Fetch invoice items
  const { data: invoiceItems = [] } = useQuery<InvoiceItem[]>({
    queryKey: [`/api/invoices/${invoiceId}/items`],
    enabled: !isNaN(invoiceId) && !!invoice,
  });

  // Fetch company profile
  const { data: companyProfile } = useQuery<CompanyProfile>({
    queryKey: [`/api/company-profiles/${invoice?.companyProfileId}`],
    enabled: !!invoice?.companyProfileId,
  });

  // Fetch client
  const { data: client } = useQuery<Client>({
    queryKey: [`/api/clients/${invoice?.clientId}`],
    enabled: !!invoice?.clientId,
  });

  // Update invoice status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest("PUT", `/api/invoices/${invoiceId}`, { status });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      toast({
        title: "Status updated",
        description: "Invoice status has been updated successfully.",
      });
      setShowStatusDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsStatusUpdating(false);
    },
  });

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/invoices/${invoiceId}`);
    },
    onSuccess: () => {
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      });
      navigate("/invoices");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    setShowStatusDialog(true);
  };

  const handleUpdateStatus = () => {
    if (!newStatus) return;
    setIsStatusUpdating(true);
    updateStatusMutation.mutate(newStatus);
  };

  const handleDeleteInvoice = () => {
    deleteMutation.mutate();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsPdfGenerating(true);
      window.open(`/api/invoices/${invoiceId}/pdf`, "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsPdfGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex">
          <Sidebar className="w-64" />
          <main className="flex-1 md:ml-64 p-6 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex">
          <Sidebar className="w-64" />
          <main className="flex-1 md:ml-64 p-6 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Invoice Not Found</h1>
              <p className="text-gray-600 mb-4">
                The invoice you are looking for does not exist or you don't have permission to view it.
              </p>
              <Button onClick={() => navigate("/invoices")}>
                Back to Invoices
              </Button>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    );
  }

  // Status color mapping
  const statusColors: Record<Invoice['status'], string> = {
    draft: "bg-yellow-100 text-yellow-800",
    sent: "bg-blue-100 text-blue-800",
    paid: "bg-green-100 text-green-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-gray-100 text-gray-800",
  };

  return (
    <>
      <Helmet>
        <title>Invoice {invoice.invoiceNumber} | InvoiceFlow</title>
        <meta name="description" content={`View and manage invoice ${invoice.invoiceNumber}`} />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex">
          <Sidebar className="w-64" />
          <main className="flex-1 md:ml-64 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h1 className="text-2xl font-semibold text-gray-900 mr-3">
                      Invoice #{invoice.invoiceNumber}
                    </h1>
                    <Badge className={statusColors[invoice.status] || "bg-gray-100"}>
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </Badge>
                  </div>
                  <p className="text-gray-500 mt-1">
                    Created on {formatDate(invoice.createdAt, "PPP")}
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap md:mt-0 md:ml-4 gap-3">
                  <Select value={invoice.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Change status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="sent">Sent</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="outline" onClick={handleDownloadPdf} disabled={isPdfGenerating}>
                    <Download className="mr-2 h-4 w-4" />
                    {isPdfGenerating ? "Generating..." : "Download PDF"}
                  </Button>
                  
                  <Button variant="outline" onClick={() => navigate(`/invoices/edit/${invoiceId}`)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6 space-y-8">
                  {/* Invoice header */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Company info */}
                    {companyProfile && (
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-start">
                            <Building className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                            <div>
                              <h3 className="text-lg font-medium">
                                {companyProfile.name}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {companyProfile.taxId && (
                                  <span className="block">Tax ID: {companyProfile.taxId}</span>
                                )}
                                {companyProfile.address && (
                                  <span className="block">{companyProfile.address}</span>
                                )}
                                {(companyProfile.city || companyProfile.state || companyProfile.postalCode) && (
                                  <span className="block">
                                    {companyProfile.city}
                                    {companyProfile.city && companyProfile.state && ", "}
                                    {companyProfile.state}
                                    {(companyProfile.city || companyProfile.state) && companyProfile.postalCode && " "}
                                    {companyProfile.postalCode}
                                  </span>
                                )}
                                {companyProfile.country && (
                                  <span className="block">{companyProfile.country}</span>
                                )}
                                {companyProfile.email && (
                                  <span className="block flex items-center mt-2">
                                    <Mail className="h-4 w-4 mr-1" />
                                    {companyProfile.email}
                                  </span>
                                )}
                                {companyProfile.phone && (
                                  <span className="block flex items-center mt-1">
                                    <Phone className="h-4 w-4 mr-1" />
                                    {companyProfile.phone}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Invoice details */}
                    <Card>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Invoice Number</h3>
                            <p className="text-lg font-mono">{invoice.invoiceNumber}</p>
                          </div>
                          <div className="flex space-x-6">
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Invoice Date</h3>
                              <p className="flex items-center">
                                <CalendarDays className="h-4 w-4 mr-1 text-gray-400" />
                                {formatDate(invoice.invoiceDate, "PPP")}
                              </p>
                            </div>
                            <div>
                              <h3 className="text-sm font-medium text-gray-500">Due Date</h3>
                              <p className="flex items-center">
                                <CalendarDays className="h-4 w-4 mr-1 text-gray-400" />
                                {invoice.dueDate ? formatDate(invoice.dueDate, "PPP") : "N/A"}
                              </p>
                            </div>
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Currency</h3>
                            <p>{invoice.currency}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Client info */}
                  {client && (
                    <div>
                      <h2 className="text-lg font-medium text-gray-900 mb-4">Client Information</h2>
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-start">
                            <User className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                            <div>
                              <h3 className="text-lg font-medium">{client.name}</h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {client.taxId && (
                                  <span className="block">Tax ID: {client.taxId}</span>
                                )}
                                {client.address && (
                                  <span className="block">{client.address}</span>
                                )}
                                {(client.city || client.state || client.postalCode) && (
                                  <span className="block">
                                    {client.city}
                                    {client.city && client.state && ", "}
                                    {client.state}
                                    {(client.city || client.state) && client.postalCode && " "}
                                    {client.postalCode}
                                  </span>
                                )}
                                {client.country && (
                                  <span className="block">{client.country}</span>
                                )}
                                {client.email && (
                                  <span className="block flex items-center mt-2">
                                    <Mail className="h-4 w-4 mr-1" />
                                    {client.email}
                                  </span>
                                )}
                                {client.phone && (
                                  <span className="block flex items-center mt-1">
                                    <Phone className="h-4 w-4 mr-1" />
                                    {client.phone}
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Invoice items */}
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h2>
                    <InvoiceItemTable 
                      invoiceId={invoiceId}
                      items={invoiceItems}
                      currency={invoice.currency}
                      readOnly
                    />
                  </div>

                  {/* Invoice summary */}
                  <InvoiceSummary
                    invoice={invoice}
                    items={invoiceItems}
                    companyProfile={companyProfile}
                    currency={invoice.currency}
                  />
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>

      {/* Status Update Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Invoice Status</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the status of invoice #{invoice.invoiceNumber} to{" "}
              <span className="font-medium">
                {newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
              </span>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} disabled={isStatusUpdating}>
              Cancel
            </Button>
            <Button onClick={handleUpdateStatus} disabled={isStatusUpdating}>
              {isStatusUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isStatusUpdating ? "Updating..." : "Update Status"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete invoice #{invoice.invoiceNumber}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteInvoice}>
              Delete Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <UpgradeBanner />
    </>
  );
}
