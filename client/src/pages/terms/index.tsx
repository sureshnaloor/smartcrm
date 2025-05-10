import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Plus, FileText, MoreHorizontal, Search } from "lucide-react";
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

export default function TermsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("company");
  const [category, setCategory] = useState<string | null>(null);

  // Get company terms
  const { data: companyTerms, isLoading: loadingCompanyTerms } = useQuery({
    queryKey: ["/api/terms/company", category],
    queryFn: () => 
      apiRequest(
        "GET", 
        category ? `/api/terms/company?category=${category}` : "/api/terms/company"
      ).then(res => res.json()),
  });

  // Get master terms
  const { data: masterTerms, isLoading: loadingMasterTerms } = useQuery({
    queryKey: ["/api/terms/master", category],
    queryFn: () => 
      apiRequest(
        "GET", 
        category ? `/api/terms/master?category=${category}` : "/api/terms/master"
      ).then(res => res.json()),
  });

  // Filter terms based on search term
  const filteredCompanyTerms = companyTerms?.filter(
    (term) => term.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              term.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredMasterTerms = masterTerms?.filter(
    (term) => term.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              term.content?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Categories for terms
  const categories = [
    { id: "general", name: "General" },
    { id: "payment", name: "Payment" },
    { id: "delivery", name: "Delivery" },
    { id: "warranty", name: "Warranty" },
    { id: "legal", name: "Legal" },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Terms & Conditions</h1>
        <Link href="/terms/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search terms & conditions..."
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
          <TabsTrigger value="company">Your Terms</TabsTrigger>
          <TabsTrigger value="master">Standard Templates</TabsTrigger>
        </TabsList>
        
        <TabsContent value="company">
          <Card>
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
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No terms found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm
                      ? "No terms match your search criteria."
                      : "Get started by creating your terms and conditions."}
                  </p>
                  {!searchTerm && (
                    <Link href="/terms/create">
                      <Button className="mt-4" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Term
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredCompanyTerms.map((term) => (
                    <Card key={term.id} className="overflow-hidden">
                      <div className="flex justify-between items-start p-6">
                        <div>
                          <h3 className="text-lg font-medium">{term.title}</h3>
                          <div className="flex items-center mt-1 space-x-2">
                            <Badge variant="outline">
                              {term.category.charAt(0).toUpperCase() + term.category.slice(1)}
                            </Badge>
                            {term.isDefault && (
                              <Badge variant="secondary">Default</Badge>
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
                          <DropdownMenuContent align="end">
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
                        <div className="text-sm text-muted-foreground line-clamp-3 mb-2">
                          {term.content}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
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
          <Card>
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
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No templates found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {searchTerm
                      ? "No templates match your search criteria."
                      : "No standard templates available."}
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredMasterTerms.map((term) => (
                    <Card key={term.id} className="overflow-hidden">
                      <div className="flex justify-between items-start p-6">
                        <div>
                          <h3 className="text-lg font-medium">{term.title}</h3>
                          <Badge variant="outline" className="mt-1">
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
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Use Template
                        </Button>
                      </div>
                      <div className="px-6 pb-6">
                        <div className="text-sm text-muted-foreground line-clamp-3 mb-2">
                          {term.content}
                        </div>
                        <Button variant="ghost" size="sm" asChild>
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
  );
}