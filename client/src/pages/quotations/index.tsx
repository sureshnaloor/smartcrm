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
  ArrowUpDown
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
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quotations</h1>
        <Link href="/quotations/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </Link>
      </div>
      
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search quotations..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quotations</CardTitle>
          <CardDescription>
            View and manage your quotations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
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
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No quotations found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm
                  ? "No quotations match your search criteria."
                  : "Get started by creating your first quotation."}
              </p>
              {!searchTerm && (
                <Link href="/quotations/create">
                  <Button className="mt-4" variant="outline">
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
                  <tr className="border-b">
                    <th className="py-3 px-2 text-left font-medium">Quotation</th>
                    <th className="py-3 px-2 text-left font-medium">Client</th>
                    <th className="py-3 px-2 text-left font-medium">Date</th>
                    <th className="py-3 px-2 text-right font-medium">Amount</th>
                    <th className="py-3 px-2 text-right font-medium">Status</th>
                    <th className="py-3 px-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuotations.map((quotation: Quotation) => (
                    <tr key={quotation.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-2">
                        <div className="font-medium">{quotation.quoteNumber}</div>
                        <div className="text-xs text-muted-foreground">
                          {quotation.quoteNumber || 'No reference number'}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        {quotation.clientId?.toString() || 'No client'}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center">
                          <CalendarIcon className="mr-2 h-3 w-3 text-muted-foreground" />
                          <span>{quotation.quoteDate ? format(new Date(quotation.quoteDate), "MMM d, yyyy") : "No date"}</span>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="mr-2 h-3 w-3" />
                          <span>Valid until: {quotation.validUntil ? format(new Date(quotation.validUntil), "MMM d, yyyy") : "N/A"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {formatCurrency(Number(quotation.total) || 0)}
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Badge variant={
                          quotation.status === "draft" ? "outline" :
                          quotation.status === "sent" ? "secondary" :
                          quotation.status === "accepted" ? "default" :
                          quotation.status === "rejected" ? "destructive" :
                          "outline"
                        }>
                          {quotation.status?.charAt(0).toUpperCase() + quotation.status?.slice(1) || 'Draft'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem asChild>
                              <Link href={`/quotations/${quotation.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/quotations/${quotation.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => cloneQuotation.mutate(quotation.id)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Clone
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <a href={`/api/quotations/${quotation.id}/pdf`} target="_blank" rel="noopener noreferrer">
                                <Download className="mr-2 h-4 w-4" />
                                Download PDF
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                  <span className="text-destructive">Delete</span>
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
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
  );
}