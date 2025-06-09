import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Quotation } from "@shared/schema";
import { 
  Plus, 
  Search, 
  FileText, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  Download,
  CalendarIcon,
  Clock,
  ArrowUpDown,
  TrendingUp,
  DollarSign,
  Users,
  FileSpreadsheet
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { Helmet } from "react-helmet-async";

export default function QuotationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all quotations
  const { data: quotations, isLoading } = useQuery({
    queryKey: ["/api/quotations"],
    queryFn: () => apiRequest("GET", "/api/quotations").then(res => res.json()),
  });

  // Delete quotation mutation
  const deleteQuotation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/quotations/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Quotation deleted successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete quotation",
        variant: "destructive",
      });
    },
  });

  // Clone quotation mutation
  const cloneQuotation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/quotations/${id}/clone`).then(res => res.json());
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Quotation cloned successfully",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to clone quotation",
        variant: "destructive",
      });
    },
  });

  // Filter quotations based on search term
  const filteredQuotations = quotations?.filter(
    (quotation: Quotation) => 
      quotation.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.clientId?.toString().includes(searchTerm.toLowerCase())
  );

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <>
      <Helmet>
        <title>Quotations | InvoiceFlow</title>
        <meta name="description" content="Manage your quotations, proposals, and estimates." />
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
                      Quotations
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Manage and track your business quotations
                    </p>
                  </div>
                  <Link href="/quotations/create">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New
                    </Button>
                  </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Quotations</p>
                          <h3 className="text-2xl font-bold mt-2">{quotations?.length || 0}</h3>
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
                            {formatCurrency(quotations?.reduce((sum: number, q: Quotation) => sum + Number(q.total || 0), 0) || 0)}
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
                            {new Set(quotations?.map(q => q.clientId)).size || 0}
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
                    placeholder="Search quotations..."
                    className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Main Content Card */}
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-none">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-xl font-semibold">All Quotations</CardTitle>
                  <CardDescription>
                    View and manage your quotations
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
                  ) : !filteredQuotations || filteredQuotations.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                        <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="mt-4 text-lg font-medium">No quotations found</h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {searchTerm
                          ? "No quotations match your search criteria."
                          : "Get started by creating your first quotation."}
                      </p>
                      {!searchTerm && (
                        <Link href="/quotations/create">
                          <Button className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Quotation
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="py-4 px-4 text-left font-medium text-gray-600 dark:text-gray-400">Quotation</th>
                            <th className="py-4 px-4 text-left font-medium text-gray-600 dark:text-gray-400">Client</th>
                            <th className="py-4 px-4 text-left font-medium text-gray-600 dark:text-gray-400">Date</th>
                            <th className="py-4 px-4 text-right font-medium text-gray-600 dark:text-gray-400">Amount</th>
                            <th className="py-4 px-4 text-right font-medium text-gray-600 dark:text-gray-400">Status</th>
                            <th className="py-4 px-4 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredQuotations.map((quotation: Quotation) => (
                            <tr key={quotation.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                              <td className="py-4 px-4">
                                <div className="font-medium text-gray-900 dark:text-gray-100">{quotation.quoteNumber}</div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {quotation.quoteNumber || 'No reference number'}
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-2">
                                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <span className="text-gray-900 dark:text-gray-100">
                                    {quotation.clientId?.toString() || 'No client'}
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
                                      {quotation.quoteDate ? format(new Date(quotation.quoteDate), "MMM d, yyyy") : "No date"}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      Valid until: {quotation.validUntil ? format(new Date(quotation.validUntil), "MMM d, yyyy") : "N/A"}
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
                                    {formatCurrency(Number(quotation.total) || 0)}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <Badge variant={
                                  quotation.status === "draft" ? "outline" :
                                  quotation.status === "sent" ? "secondary" :
                                  quotation.status === "accepted" ? "default" :
                                  quotation.status === "rejected" ? "destructive" :
                                  "outline"
                                } className="px-3 py-1">
                                  {quotation.status?.charAt(0).toUpperCase() + quotation.status?.slice(1) || 'Draft'}
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
                                      <Link href={`/quotations/${quotation.id}`} className="cursor-pointer">
                                        <Eye className="mr-2 h-4 w-4" />
                                        View Details
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                      <Link href={`/quotations/${quotation.id}/edit`} className="cursor-pointer">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => cloneQuotation.mutate(quotation.id)} className="cursor-pointer">
                                      <Copy className="mr-2 h-4 w-4" />
                                      Clone
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                      <a href={`/api/quotations/${quotation.id}/pdf`} target="_blank" rel="noopener noreferrer" className="cursor-pointer">
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
                                            This will permanently delete the quotation. This action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => deleteQuotation.mutate(quotation.id)}
                                            className="bg-red-600 text-white hover:bg-red-700"
                                          >
                                            {deleteQuotation.isPending ? "Deleting..." : "Delete"}
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))}
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