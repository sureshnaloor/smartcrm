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
import { Input } from "@/components/ui/input";
import { Helmet } from "react-helmet-async";
import {
  Plus,
  Search,
  MoreHorizontal,
  Trash,
  Edit,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Client {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  country?: string;
  taxId?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  notes?: string;
}

export default function ClientsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [viewClient, setViewClient] = useState<any | null>(null);

  // Fetch clients
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Delete client
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/clients/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Client deleted",
        description: "The client has been deleted successfully.",
      });
      setClientToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Could not delete the client. The client may be used in existing invoices.",
        variant: "destructive",
      });
    },
  });

  // Filter clients based on search query
  const filteredClients = searchQuery.trim() === ""
    ? clients
    : clients.filter((client) => {
        const searchTerms = searchQuery.toLowerCase();
        return (
          client.name.toLowerCase().includes(searchTerms) ||
          (client.email && client.email.toLowerCase().includes(searchTerms)) ||
          (client.phone && client.phone.toLowerCase().includes(searchTerms)) ||
          (client.country && client.country.toLowerCase().includes(searchTerms))
        );
      });

  return (
    <>
      <Helmet>
        <title>Clients | InvoiceFlow</title>
        <meta name="description" content="Manage your clients and their information for easy invoicing." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex">
          <Sidebar className="w-64" />
          <main className="flex-1 md:ml-64 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="md:flex md:items-center md:justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
                  <p className="text-gray-500">
                    Manage your clients and their information
                  </p>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4">
                  <Button onClick={() => navigate("/clients/create")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Client
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <div className="relative w-full max-w-sm">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        placeholder="Search clients..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="flex justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <DataTable
                      data={filteredClients}
                      columns={[
                        {
                          header: "Name",
                          accessorKey: "name",
                        },
                        {
                          header: "Email",
                          accessorKey: "email",
                          cell: (item) => item.email || "N/A"
                        },
                        {
                          header: "Phone",
                          accessorKey: "phone",
                          cell: (item) => item.phone || "N/A"
                        },
                        {
                          header: "Country",
                          accessorKey: "country",
                          cell: (item) => item.country || "N/A"
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
                                  <DropdownMenuItem onClick={() => setViewClient(item)}>
                                    <User className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => navigate(`/clients/edit/${item.id}`)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive"
                                    onClick={() => setClientToDelete(item.id)}
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
                      onRowClick={(item) => setViewClient(item)}
                    />
                  )}

                  {!isLoading && filteredClients.length === 0 && searchQuery === "" && (
                    <div className="text-center py-12">
                      <User className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Get started by creating a new client.
                      </p>
                      <div className="mt-6">
                        <Button onClick={() => navigate("/clients/create")}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Client
                        </Button>
                      </div>
                    </div>
                  )}

                  {!isLoading && filteredClients.length === 0 && searchQuery !== "" && (
                    <div className="text-center py-12">
                      <Search className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No results found</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        We couldn't find any clients matching "{searchQuery}"
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
      <Dialog open={clientToDelete !== null} onOpenChange={() => setClientToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
              Note that you cannot delete a client that is referenced in existing invoices.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClientToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (clientToDelete) {
                  deleteMutation.mutate(clientToDelete);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={viewClient !== null} onOpenChange={() => setViewClient(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Client Details</DialogTitle>
          </DialogHeader>
          
          {viewClient && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{viewClient.name}</h3>
                  {viewClient.taxId && <p className="text-sm text-gray-500">Tax ID: {viewClient.taxId}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                {viewClient.email && (
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p>{viewClient.email}</p>
                    </div>
                  </div>
                )}
                
                {viewClient.phone && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p>{viewClient.phone}</p>
                    </div>
                  </div>
                )}
                
                {(viewClient.address || viewClient.city || viewClient.state || viewClient.postalCode || viewClient.country) && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Address</p>
                      <p>
                        {viewClient.address && <span className="block">{viewClient.address}</span>}
                        {(viewClient.city || viewClient.state || viewClient.postalCode) && (
                          <span className="block">
                            {viewClient.city}
                            {viewClient.city && viewClient.state && ", "}
                            {viewClient.state}
                            {(viewClient.city || viewClient.state) && viewClient.postalCode && " "}
                            {viewClient.postalCode}
                          </span>
                        )}
                        {viewClient.country && <span className="block">{viewClient.country}</span>}
                      </p>
                    </div>
                  </div>
                )}
                
                {viewClient.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Notes</p>
                    <p className="text-sm">{viewClient.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setViewClient(null)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setViewClient(null);
                  navigate(`/clients/edit/${viewClient.id}`);
                }}>
                  Edit Client
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      <UpgradeBanner />
    </>
  );
}
