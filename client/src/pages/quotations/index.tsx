import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, FileText, ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { useState } from "react";

export default function QuotationsPage() {
  const [sortField, setSortField] = useState<string>("quoteDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const { data: quotations, isLoading, error } = useQuery({
    queryKey: ["/api/quotations"],
    select: (data) => {
      // Sort the data based on sortField and sortOrder
      return [...data].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue < bValue) {
          return sortOrder === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortOrder === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

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

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quotations</h1>
        <Link href="/quotations/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Quotation
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Quotations</CardTitle>
          <CardDescription>
            View and manage all your quotations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            // Skeleton loader
            <>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-[400px]" />
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </>
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              Error loading quotations. Please try again.
            </div>
          ) : !quotations || quotations.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No quotations found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Get started by creating a new quotation.
              </p>
              <Link href="/quotations/create">
                <Button className="mt-4" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  New Quotation
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("quoteNumber")}
                        className="flex items-center space-x-1 font-medium"
                      >
                        Quotation
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("quoteDate")}
                        className="flex items-center space-x-1 font-medium"
                      >
                        Date
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => toggleSort("total")}
                        className="flex items-center space-x-1 font-medium"
                      >
                        Amount
                        <ArrowUpDown className="h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-medium">
                        <Link href={`/quotations/${quotation.id}`}>
                          {quotation.quoteNumber}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {format(new Date(quotation.quoteDate), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{quotation.client?.name || "Unknown"}</TableCell>
                      <TableCell>
                        {new Intl.NumberFormat("en-US", {
                          style: "currency",
                          currency: quotation.currency || "USD",
                        }).format(quotation.total || 0)}
                      </TableCell>
                      <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <Link href={`/quotations/${quotation.id}`}>
                              <DropdownMenuItem>View details</DropdownMenuItem>
                            </Link>
                            <Link href={`/quotations/${quotation.id}/edit`}>
                              <DropdownMenuItem>Edit</DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              onClick={() => {
                                // Handle download PDF
                                // Add implementation
                              }}
                            >
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                // Handle convert to invoice
                                // Add implementation
                              }}
                            >
                              Convert to Invoice
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}