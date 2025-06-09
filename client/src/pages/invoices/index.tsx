import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Helmet } from "react-helmet-async";
import { 
  Plus, 
  Search, 
  FileText, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Download,
  Trash2,
  CalendarIcon,
  DollarSign,
  Users,
  Building
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Invoice, Client } from "@shared/schema";
import { Footer } from "@/components/layout/footer";

export default function InvoicesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [invoiceToDelete, setInvoiceToDelete] = useState<number | null>(null);

  // Fetch invoices
  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  // Fetch clients for displaying client names
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Delete invoice mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/invoices/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
        variant: "default",
      });
      setInvoiceToDelete(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete invoice",
        variant: "destructive",
      });
    },
  });

  // Filter invoices based on search term
  const filteredInvoices = searchTerm.trim() === ""
    ? invoices
    : invoices.filter((invoice: Invoice) => {
        const searchTerms = searchTerm.toLowerCase();
        const client = clients.find(c => c.id === invoice.clientId);
        
        return (
          invoice.invoiceNumber.toLowerCase().includes(searchTerms) ||
          (client?.name && client.name.toLowerCase().includes(searchTerms))
        );
      });

  // Format currency
  const formatCurrency = (amount: number, currency: string = "USD"): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  };

  return (
    <>
      <Helmet>
        <title>Invoices | InvoiceFlow</title>
        <meta name="description" content="Manage all your invoices in one place. Create, edit, and send professional invoices to your clients." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar className="w-64" />
          <main className="flex-1 p-8 ml-64">
            <div className="max-w-7xl mx-auto">
              {/* Header Section with Stats */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Invoices
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Manage and track your business invoices
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate("/invoices/create")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New
                  </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
                          <h3 className="text-2xl font-bold mt-2">{invoices.length}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Value</p>
                          <h3 className="text-2xl font-bold mt-2">
                            {formatCurrency(invoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0))}
                          </h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Clients</p>
                          <h3 className="text-2xl font-bold mt-2">
                            {new Set(invoices.map(inv => inv.clientId)).size}
                          </h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search invoices..."
                    className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Main Content Card */}
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-none">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-xl font-semibold">All Invoices</CardTitle>
                  <CardDescription>
                    View and manage your invoices
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-6 space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                          </div>
                          <Skeleton className="ml-auto h-10 w-[120px]" />
                        </div>
                      ))}
                    </div>
                  ) : !filteredInvoices || filteredInvoices.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                        <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="mt-4 text-lg font-medium">No invoices found</h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm
                          ? "No invoices match your search criteria."
                          : "Get started by creating your first invoice."}
                      </p>
                      {!searchTerm && (
                        <Button 
                          onClick={() => navigate("/invoices/create")}
                          className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Invoice
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="py-4 px-4 text-left font-medium text-gray-600 dark:text-gray-400">Invoice</th>
                            <th className="py-4 px-4 text-left font-medium text-gray-600 dark:text-gray-400">Client</th>
                            <th className="py-4 px-4 text-left font-medium text-gray-600 dark:text-gray-400">Date</th>
                            <th className="py-4 px-4 text-right font-medium text-gray-600 dark:text-gray-400">Amount</th>
                            <th className="py-4 px-4 text-right font-medium text-gray-600 dark:text-gray-400">Status</th>
                            <th className="py-4 px-4 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInvoices.map((invoice: Invoice) => {
                            const client = clients.find(c => c.id === invoice.clientId);
                            return (
                              <tr key={invoice.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                                <td className="py-4 px-4">
                                  <div className="font-medium text-gray-900 dark:text-gray-100">{invoice.invoiceNumber}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {invoice.invoiceNumber || 'No reference number'}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-2">
                                      <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <span className="text-gray-900 dark:text-gray-100">
                                      {client?.name || 'No client'}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
                                      <CalendarIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                      <div className="text-gray-900 dark:text-gray-100">
                                        {invoice.invoiceDate ? format(new Date(invoice.invoiceDate), "MMM d, yyyy") : "No date"}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Due: {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d, yyyy") : "N/A"}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <div className="flex items-center justify-end">
                                    <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-2">
                                      <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-gray-100">
                                      {formatCurrency(Number(invoice.total) || 0, invoice.currency)}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <Badge variant={
                                    invoice.status === "draft" ? "outline" :
                                    invoice.status === "sent" ? "secondary" :
                                    invoice.status === "paid" ? "default" :
                                    invoice.status === "overdue" ? "destructive" :
                                    "outline"
                                  } className="px-3 py-1">
                                    {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1) || 'Draft'}
                                  </Badge>
                                </td>
                                <td className="py-4 px-4 text-right">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuItem asChild>
                                        <a href={`/invoices/${invoice.id}`} className="cursor-pointer">
                                          <Eye className="mr-2 h-4 w-4" />
                                          View Details
                                        </a>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem asChild>
                                        <a href={`/invoices/${invoice.id}/edit`} className="cursor-pointer">
                                          <Edit className="mr-2 h-4 w-4" />
                                          Edit
                                        </a>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem asChild>
                                        <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                                          <Download className="mr-2 h-4 w-4" />
                                          Download PDF
                                        </a>
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer text-red-600 dark:text-red-400">
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete
                                          </DropdownMenuItem>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              This will permanently delete the invoice. This action cannot be undone.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() => deleteMutation.mutate(invoice.id)}
                                              className="bg-red-600 text-white hover:bg-red-700"
                                            >
                                              {deleteMutation.isPending ? "Deleting..." : "Delete"}
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
}
