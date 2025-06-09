import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, FileText, MoreHorizontal, Search, Scale, Gavel, Shield, Clock, FileCheck } from "lucide-react";
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
import { CompanyTerm } from "@shared/schema";
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
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { Helmet } from "react-helmet-async";

interface Category {
  id: string;
  name: string;
}

export default function TermsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("company");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get company terms
  const { data: companyTerms, isLoading: loadingCompanyTerms } = useQuery({
    queryKey: ["/api/terms/company", selectedCategory],
    queryFn: () => 
      apiRequest(
        "GET", 
        selectedCategory ? `/api/terms/company?category=${selectedCategory}` : "/api/terms/company"
      ).then(res => res.json()),
  });

  // Get master terms
  const { data: masterTerms, isLoading: loadingMasterTerms } = useQuery({
    queryKey: ["/api/terms/master", selectedCategory],
    queryFn: () => 
      apiRequest(
        "GET", 
        selectedCategory ? `/api/terms/master?category=${selectedCategory}` : "/api/terms/master"
      ).then(res => res.json()),
  });

  // Filter terms based on search term
  const filteredCompanyTerms = companyTerms?.filter(
    (term: CompanyTerm) => term.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              term.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMasterTerms = masterTerms?.filter(
    (term: CompanyTerm) => term.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              term.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Categories for terms
  const categoryOptions: Category[] = [
    { id: "general", name: "General" },
    { id: "payment", name: "Payment" },
    { id: "delivery", name: "Delivery" },
    { id: "warranty", name: "Warranty" },
    { id: "legal", name: "Legal" },
  ];

  // Calculate statistics
  const totalTerms = companyTerms?.length || 0;
  const defaultTerms = companyTerms?.filter((term: CompanyTerm) => term.isDefault).length || 0;
  const categoryCounts = companyTerms?.reduce((counts: Record<string, number>, term: CompanyTerm) => {
    counts[term.category] = (counts[term.category] || 0) + 1;
    return counts;
  }, {}) || {};

  return (
    <>
      <Helmet>
        <title>Terms & Conditions | InvoiceFlow</title>
        <meta name="description" content="Manage your terms and conditions, legal documents, and warranty information." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar className="w-64" />
          <main className="flex-1 p-8 ml-64">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Header Section */}
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Terms & Conditions
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage your company's terms and conditions templates
                </p>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-blue-100 dark:border-blue-900">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                        <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Terms</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalTerms}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-purple-100 dark:border-purple-900">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                        <FileCheck className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Default Terms</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{defaultTerms}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-blue-100 dark:border-blue-900">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                        <Gavel className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Legal Terms</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{categoryCounts.legal || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-purple-100 dark:border-purple-900">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                        <Shield className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Warranty Terms</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{categoryCounts.warranty || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Search and Actions */}
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search terms & conditions..."
                    className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant={selectedCategory === null ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(null)}
                      className={selectedCategory === null ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" : "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"}
                    >
                      All
                    </Button>
                    
                    {categoryOptions.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={selectedCategory === cat.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(cat.id)}
                        className={selectedCategory === cat.id ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white" : "bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm"}
                      >
                        {cat.name}
                      </Button>
                    ))}
                  </div>

                  <Link href="/terms/create">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Create New
                    </Button>
                  </Link>
                </div>
              </div>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                  <TabsTrigger value="company">Your Terms</TabsTrigger>
                  <TabsTrigger value="master">Standard Templates</TabsTrigger>
                </TabsList>
                
                <TabsContent value="company">
                  <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle>Your Terms & Conditions</CardTitle>
                      <CardDescription>
                        Manage your company's terms and conditions templates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingCompanyTerms ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                              <Skeleton className="h-8 w-[300px]" />
                              <Skeleton className="h-8 w-[100px]" />
                              <Skeleton className="h-8 w-[100px]" />
                            </div>
                          ))}
                        </div>
                      ) : !filteredCompanyTerms || filteredCompanyTerms.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No terms found</h3>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {searchTerm
                              ? "No terms match your search criteria."
                              : "Get started by creating your terms and conditions."}
                          </p>
                          {!searchTerm && (
                            <Link href="/terms/create">
                              <Button 
                                className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                              >
                                <Plus className="mr-2 h-4 w-4" />
                                Create New Term
                              </Button>
                            </Link>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {filteredCompanyTerms.map((term: CompanyTerm) => (
                            <Card key={term.id} className="overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                              <div className="flex justify-between items-start p-6">
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{term.title}</h3>
                                  <div className="flex items-center mt-1 space-x-2">
                                    <Badge variant="outline" className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                                      {term.category.charAt(0).toUpperCase() + term.category.slice(1)}
                                    </Badge>
                                    {term.isDefault && (
                                      <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                                        Default
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                      <span className="sr-only">Open menu</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <Link href={`/terms/${term.id}/edit`}>
                                      <DropdownMenuItem>Edit</DropdownMenuItem>
                                    </Link>
                                    <DropdownMenuItem>
                                      {term.isDefault ? "Remove Default" : "Set as Default"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <div className="px-6 pb-6">
                                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-2">
                                  {term.content}
                                </div>
                                <Button variant="ghost" size="sm" asChild className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50">
                                  <Link href={`/terms/${term.id}`}>View full text</Link>
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="master">
                  <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle>Standard Templates</CardTitle>
                      <CardDescription>
                        Browse and use standard terms and conditions templates
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {loadingMasterTerms ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="flex items-center space-x-4">
                              <Skeleton className="h-8 w-[300px]" />
                              <Skeleton className="h-8 w-[100px]" />
                              <Skeleton className="h-8 w-[100px]" />
                            </div>
                          ))}
                        </div>
                      ) : !filteredMasterTerms || filteredMasterTerms.length === 0 ? (
                        <div className="text-center py-12">
                          <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
                          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No templates found</h3>
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {searchTerm
                              ? "No templates match your search criteria."
                              : "No standard templates available."}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {filteredMasterTerms.map((term: CompanyTerm) => (
                            <Card key={term.id} className="overflow-hidden bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                              <div className="flex justify-between items-start p-6">
                                <div>
                                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{term.title}</h3>
                                  <Badge variant="outline" className="mt-1 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400">
                                    {term.category.charAt(0).toUpperCase() + term.category.slice(1)}
                                  </Badge>
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Copy to company terms
                                    // Implementation needed here
                                  }}
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Use Template
                                </Button>
                              </div>
                              <div className="px-6 pb-6">
                                <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-2">
                                  {term.content}
                                </div>
                                <Button variant="ghost" size="sm" asChild className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50">
                                  <Link href={`/terms/master/${term.id}`}>View full text</Link>
                                </Button>
                              </div>
                            </Card>
                          ))}
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