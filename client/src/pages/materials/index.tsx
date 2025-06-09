import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Package, Filter, MoreHorizontal, Search, Building, Tag, DollarSign, Box } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { CompanyItem, MasterItem } from "@shared/schema";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Helmet } from "react-helmet-async";
import { Footer } from "@/components/layout/footer";

export default function MaterialsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("company");
  const [category, setCategory] = useState<string | null>(null);

  // Get company items
  const { data: companyItems, isLoading: loadingCompanyItems } = useQuery({
    queryKey: ["/api/materials/company", category],
    queryFn: () => 
      apiRequest(
        "GET", 
        category ? `/api/materials/company?category=${category}` : "/api/materials/company"
      ).then(res => res.json()),
  });

  // Get master items
  const { data: masterItems, isLoading: loadingMasterItems } = useQuery({
    queryKey: ["/api/materials/master", category],
    queryFn: () => 
      apiRequest(
        "GET", 
        category ? `/api/materials/master?category=${category}` : "/api/materials/master"
      ).then(res => res.json()),
  });

  // Filter items based on search term
  const filteredCompanyItems = companyItems?.filter(
    (item: CompanyItem) => item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredMasterItems = masterItems?.filter(
    (item: MasterItem) => item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Categories for materials and services
  const categories = [
    { id: "material", name: "Materials" },
    { id: "service", name: "Services" },
    { id: "equipment", name: "Equipment" },
    { id: "labor", name: "Labor" },
  ];

  // Calculate statistics
  const totalItems = (companyItems?.length || 0) + (masterItems?.length || 0);
  const totalCategories = new Set([
    ...(companyItems?.map((item: CompanyItem) => item.category) || []),
    ...(masterItems?.map((item: MasterItem) => item.category) || [])
  ]).size;
  const totalValue = (companyItems?.reduce((sum: number, item: CompanyItem) => sum + Number(item.price || 0), 0) || 0) +
                    (masterItems?.reduce((sum: number, item: MasterItem) => sum + Number(item.defaultPrice || 0), 0) || 0);

  return (
    <>
      <Helmet>
        <title>Materials | InvoiceFlow</title>
        <meta name="description" content="Manage your materials, products, and inventory items." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar className="w-64" />
          <main className="flex-1 p-8 ml-64">
            <div className="max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Materials & Services
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Manage your catalog and browse the central repository
                    </p>
                  </div>
                  <Link href="/materials/create">
                    <Button 
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add New
                    </Button>
                  </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Items</p>
                          <h3 className="text-2xl font-bold mt-2">{totalItems}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                          <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Categories</p>
                          <h3 className="text-2xl font-bold mt-2">{totalCategories}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                          <Tag className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(totalValue)}
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
                          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Company Items</p>
                          <h3 className="text-2xl font-bold mt-2">{companyItems?.length || 0}</h3>
                        </div>
                        <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                          <Building className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search materials and services..."
                      className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400 shadow-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={category === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategory(null)}
                      className={category === null ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" : ""}
                    >
                      All
                    </Button>
                    
                    {categories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={category === cat.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCategory(cat.id)}
                        className={category === cat.id ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" : ""}
                      >
                        {cat.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tabs Content */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-white dark:bg-gray-800 shadow-lg">
                  <TabsTrigger value="company">Your Items</TabsTrigger>
                  <TabsTrigger value="master">Central Repository</TabsTrigger>
                </TabsList>
                
                <TabsContent value="company">
                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Your Materials & Services</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Manage your company's materials and services catalog
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingCompanyItems ? (
                        <div className="space-y-4">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                              <Skeleton className="h-8 w-[200px]" />
                              <Skeleton className="h-8 w-[200px]" />
                              <Skeleton className="h-8 w-[100px]" />
                              <Skeleton className="h-8 w-[100px]" />
                            </div>
                          ))}
                        </div>
                      ) : filteredCompanyItems.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No items found</h3>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {searchTerm
                              ? "No items match your search criteria."
                              : "Get started by adding your materials and services."}
                          </p>
                          {!searchTerm && (
                            <Link href="/materials/create">
                              <Button 
                                className="mt-4 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                                variant="outline"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Add New Item
                              </Button>
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredCompanyItems.map((item: CompanyItem) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.code || "-"}</TableCell>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{item.unitOfMeasure}</TableCell>
                                  <TableCell className="text-right">
                                    {new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency: "USD",
                                    }).format(Number(item.price))}
                                  </TableCell>
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
                                        <Link href={`/materials/${item.id}/edit`}>
                                          <DropdownMenuItem>Edit</DropdownMenuItem>
                                        </Link>
                                        <DropdownMenuItem>Delete</DropdownMenuItem>
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
                </TabsContent>
                
                <TabsContent value="master">
                  <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">Central Repository</CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Browse and use materials and services from the central repository
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingMasterItems ? (
                        <div className="space-y-4">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                              <Skeleton className="h-8 w-[200px]" />
                              <Skeleton className="h-8 w-[200px]" />
                              <Skeleton className="h-8 w-[100px]" />
                              <Skeleton className="h-8 w-[100px]" />
                            </div>
                          ))}
                        </div>
                      ) : filteredMasterItems.length === 0 ? (
                        <div className="text-center py-12">
                          <Package className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No items found</h3>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {searchTerm
                              ? "No items match your search criteria."
                              : "No items available in the central repository."}
                          </p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right">Unit Price</TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredMasterItems.map((item: MasterItem) => (
                                <TableRow key={item.id}>
                                  <TableCell className="font-medium">{item.code || "-"}</TableCell>
                                  <TableCell>{item.name}</TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800">
                                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{item.unitOfMeasure}</TableCell>
                                  <TableCell className="text-right">
                                    {new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency: "USD",
                                    }).format(Number(item.defaultPrice))}
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                                      onClick={() => {
                                        // Add to company items
                                        // Implementation needed here
                                      }}
                                    >
                                      <Plus className="h-4 w-4" />
                                      <span className="sr-only">Add to my items</span>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
}