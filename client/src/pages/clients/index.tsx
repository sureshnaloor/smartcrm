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
  Users,
  Globe,
  Mail as MailIcon,
  Building,
  Briefcase,
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

  // Calculate stats
  const totalClients = clients.length;
  const uniqueCountries = new Set(clients.map(client => client.country).filter(Boolean)).size;
  const clientsWithEmail = clients.filter(client => client.email).length;
  const businessClients = clients.filter(client => client.taxId).length;

  return (
    <>
      <Helmet>
        <title>Clients | InvoiceFlow</title>
        <meta name="description" content="Manage your clients, track their information, and maintain your business relationships." />
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
                      Clients
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Manage and track your business clients
                    </p>
                  </div>
                  <Button 
                    onClick={() => navigate("/clients/create")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create New
                  </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Clients</p>
                          <h3 className="text-2xl font-bold mt-2">{totalClients}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Business Clients</p>
                          <h3 className="text-2xl font-bold mt-2">{businessClients}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Countries</p>
                          <h3 className="text-2xl font-bold mt-2">{uniqueCountries}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">With Email</p>
                          <h3 className="text-2xl font-bold mt-2">{clientsWithEmail}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                          <MailIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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
                    placeholder="Search clients..."
                    className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Main Content Card */}
              <Card className="bg-white dark:bg-gray-800 shadow-lg border-none">
                <CardHeader className="border-b border-gray-200 dark:border-gray-700">
                  <CardTitle className="text-xl font-semibold">All Clients</CardTitle>
                  <CardDescription>
                    View and manage your clients
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  {isLoading ? (
                    <div className="p-6 space-y-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-4 w-[250px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-4 w-[200px] bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredClients.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
                        <Users className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No clients found</h3>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {searchQuery
                          ? "No clients match your search criteria."
                          : "Get started by creating your first client."}
                      </p>
                      {!searchQuery && (
                        <Button 
                          onClick={() => navigate("/clients/create")}
                          className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create New Client
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700">
                            <th className="py-4 px-4 text-left font-medium text-gray-600 dark:text-gray-400">Client</th>
                            <th className="py-4 px-4 text-left font-medium text-gray-600 dark:text-gray-400">Email</th>
                            <th className="py-4 px-4 text-left font-medium text-gray-600 dark:text-gray-400">Phone</th>
                            <th className="py-4 px-4 text-left font-medium text-gray-600 dark:text-gray-400">Country</th>
                            <th className="py-4 px-4 text-right font-medium text-gray-600 dark:text-gray-400">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredClients.map((client) => (
                            <tr key={client.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-2">
                                    <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">{client.name}</div>
                                    {client.taxId && (
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        Tax ID: {client.taxId}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-gray-900 dark:text-gray-100">
                                    {client.email || "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-gray-900 dark:text-gray-100">
                                    {client.phone || "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4">
                                <div className="flex items-center">
                                  <Globe className="h-4 w-4 text-gray-400 mr-2" />
                                  <span className="text-gray-900 dark:text-gray-100">
                                    {client.country || "N/A"}
                                  </span>
                                </div>
                              </td>
                              <td className="py-4 px-4 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setViewClient(client)}>
                                      <User className="mr-2 h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate(`/clients/edit/${client.id}`)}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onClick={() => setClientToDelete(client.id)}
                                    >
                                      <Trash className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
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
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{viewClient.name}</h3>
                  {viewClient.taxId && <p className="text-sm text-gray-500 dark:text-gray-400">Tax ID: {viewClient.taxId}</p>}
                </div>
              </div>
              
              <div className="space-y-2">
                {viewClient.email && (
                  <div className="flex items-start">
                    <Mail className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-gray-900 dark:text-white">{viewClient.email}</p>
                    </div>
                  </div>
                )}
                
                {viewClient.phone && (
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="text-gray-900 dark:text-white">{viewClient.phone}</p>
                    </div>
                  </div>
                )}
                
                {(viewClient.address || viewClient.city || viewClient.state || viewClient.postalCode || viewClient.country) && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</p>
                      <p className="text-gray-900 dark:text-white">
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
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</p>
                    <p className="text-sm text-gray-900 dark:text-white">{viewClient.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button variant="outline" onClick={() => setViewClient(null)}>
                  Close
                </Button>
                <Button 
                  onClick={() => {
                    setViewClient(null);
                    navigate(`/clients/edit/${viewClient.id}`);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                >
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
