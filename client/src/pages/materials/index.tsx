import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, Package, Filter, MoreHorizontal, Search } from "lucide-react";
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
    (item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMasterItems = masterItems?.filter(
    (item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Categories for materials and services
  const categories = [
    { id: "material", name: "Materials" },
    { id: "service", name: "Services" },
    { id: "equipment", name: "Equipment" },
    { id: "labor", name: "Labor" },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Materials & Services</h1>
        <Link href="/materials/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add New
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search materials and services..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={category === null ? "default" : "outline"}
              size="sm"
              onClick={() => setCategory(null)}
            >
              All
            </Button>
            
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={category === cat.id ? "default" : "outline"}
                size="sm"
                onClick={() => setCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="company">Your Items</TabsTrigger>
          <TabsTrigger value="master">Central Repository</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Your Materials & Services</CardTitle>
              <CardDescription>
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
              ) : !filteredCompanyItems || filteredCompanyItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No items found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm
                      ? "No items match your search criteria."
                      : "Get started by adding your materials and services."}
                  </p>
                  {!searchTerm && (
                    <Link href="/materials/create">
                      <Button className="mt-4" variant="outline">
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
                      {filteredCompanyItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.code || "-"}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(item.unitPrice)}
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
          <Card>
            <CardHeader>
              <CardTitle>Central Repository</CardTitle>
              <CardDescription>
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
              ) : !filteredMasterItems || filteredMasterItems.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No items found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
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
                      {filteredMasterItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.code || "-"}</TableCell>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-right">
                            {new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(item.unitPrice)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8"
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
  );
}