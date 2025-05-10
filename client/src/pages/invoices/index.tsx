import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { UpgradeBanner } from "@/components/subscription/upgrade-banner";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Helmet } from "react-helmet-async";
import {
  Plus,
  Download,
  FileText,
  Eye,
  Trash,
  MoreHorizontal,
  Search,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InvoiceWithRelations } from "@/types";

export default function InvoicesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);

  // Fetch invoices
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/invoices"],
  });

  // Fetch clients for displaying client names
  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  // Download invoice PDF
  const handleDownloadPdf = (invoiceId: number, invoiceNumber: string) => {
    window.open(`/api/invoices/${invoiceId}/pdf`, "_blank");
  };

  // Delete invoice
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice deleted",
        description: "The invoice has been deleted successfully.",
      });
      setInvoiceToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Could not delete the invoice",
        variant: "destructive",
      });
    },
  });

  // Filter invoices based on search query
  const filteredInvoices = searchQuery.trim() === ""
    ? invoices
    : invoices.filter((invoice: InvoiceWithRelations) => {
        const searchTerms = searchQuery.toLowerCase();
        const client = clients.find(c => c.id === invoice.clientId);
        
        return (
          invoice.invoiceNumber.toLowerCase().includes(searchTerms) ||
          (client?.name && client.name.toLowerCase().includes(searchTerms))
        );
      });

  return (
    <>
      <Helmet>
        <title>Invoices | InvoiceFlow</title>
        <meta name="description" content="Manage all your invoices in one place. Create, edit, and send professional invoices to your clients." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex">
          <Sidebar className="w-64" />
          <main className="flex-1 md:ml-64 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="md:flex md:items-center md:justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
                  <p className="text-gray-500">
                    Manage and track all your invoices
                  </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <Button onClick={() => navigate("/invoices/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Invoice
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div className="relative w-full sm:w-64">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search invoices..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 w-full"
                      />
                    </div>
                    
                    <UpgradeBanner minimal />
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <DataTable
                      data={filteredInvoices}
                      columns={[
                        {
                          header: "Invoice #",
                          accessorKey: "invoiceNumber",
                        },
                        {
                          header: "Client",
                          accessorKey: "clientId",
                          cell: (item) => {
                            const client = clients.find(c => c.id === item.clientId);
                            return client?.name || "Unknown";
                          }
                        },
                        {
                          header: "Date",
                          accessorKey: "invoiceDate",
                          cell: (item) => formatDate(item.invoiceDate, "PP")
                        },
                        {
                          header: "Due Date",
                          accessorKey: "dueDate",
                          cell: (item) => item.dueDate ? formatDate(item.dueDate, "PP") : "N/A"
                        },
                        {
                          header: "Amount",
                          accessorKey: "total",
                          cell: (item) => formatCurrency(item.total, item.currency)
                        },
                        {
                          header: "Status",
                          accessorKey: "status",
                          cell: (item) => (
                            <span className={`text-xs py-1 px-2 rounded-full ${
                              item.status === "paid" ? "bg-green-100 text-green-800" :
                              item.status === "overdue" ? "bg-red-100 text-red-800" :
                              item.status === "sent" ? "bg-blue-100 text-blue-800" :
                              item.status === "cancelled" ? "bg-gray-100 text-gray-800" :
                              "bg-yellow-100 text-yellow-800"
                            }`}>
                              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                            </span>
                          )
                        },
                        {
                          header: "Actions",
                          accessorKey: (item) => (
                            <div className="flex justify-end">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => navigate(`/invoices/${item.id}`)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDownloadPdf(item.id, item.invoiceNumber)}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download PDF
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => setInvoiceToDelete(item.id)}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )
                        }
                      ]}
                      onRowClick={(item) => navigate(`/invoices/${item.id}`)}
                    />
                  )}

                  {!isLoading && filteredInvoices.length === 0 && searchQuery === "" && (
                    <div className="text-center py-12">
                      <FileText className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No invoices</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by creating a new invoice.
                      </p>
                      <div className="mt-6">
                        <Button onClick={() => navigate("/invoices/create")}>
                          <Plus className="mr-2 h-4 w-4" />
                          New Invoice
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isLoading && filteredInvoices.length === 0 && searchQuery !== "" && (
                    <div className="text-center py-12">
                      <Search className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        We couldn't find any invoices matching "{searchQuery}"
                      </p>
                      <div className="mt-6">
                        <Button variant="outline" onClick={() => setSearchQuery("")}>
                          Clear Search
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={invoiceToDelete !== null} onOpenChange={() => setInvoiceToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (invoiceToDelete) {
                  deleteMutation.mutate(invoiceToDelete);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <UpgradeBanner />
    </>
  );
}
