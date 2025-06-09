import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Document } from "@shared/schema";
import { 
  Plus, 
  FileText, 
  Download, 
  Trash2, 
  Search, 
  File, 
  FileImage, 
  FileSpreadsheet,
  FileType,
  Building,
  FileArchive,
  FileCode,
  FileVideo
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Footer } from "@/components/layout/footer";
import { Helmet } from "react-helmet-async";

export default function DocumentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get all documents
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ["/api/documents"],
    queryFn: () => apiRequest("GET", "/api/documents").then(res => res.json()),
  });

  // Delete document mutation
  const deleteDocument = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Document deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    },
  });

  // Filter documents based on search term and active tab
  const filteredDocuments = documents?.filter(doc => {
    const matchesSearch = 
      doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && doc.type === activeTab;
  });

  // Get file icon based on mime type
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <FileImage className="h-6 w-6 text-blue-500" />;
    } else if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.endsWith("csv")) {
      return <FileSpreadsheet className="h-6 w-6 text-green-500" />;
    } else if (mimeType.includes("pdf")) {
      return <FileType className="h-6 w-6 text-red-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Calculate statistics
  const totalDocuments = documents?.length || 0;
  const totalSize = documents?.reduce((sum, doc) => sum + doc.fileSize, 0) || 0;
  const documentTypes = documents?.reduce((types, doc) => {
    types[doc.type] = (types[doc.type] || 0) + 1;
    return types;
  }, {} as Record<string, number>) || {};

  return (
    <>
      <Helmet>
        <title>Documents | InvoiceFlow</title>
        <meta name="description" content="Manage and organize your company documents, catalogs, and files." />
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
                  Documents
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Manage and organize your company documents
                </p>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-blue-100 dark:border-blue-900">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Documents</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalDocuments}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-purple-100 dark:border-purple-900">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                        <FileArchive className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Size</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatFileSize(totalSize)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-blue-100 dark:border-blue-900">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                        <FileCode className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Catalogs</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{documentTypes.catalog || 0}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-purple-100 dark:border-purple-900">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                        <FileVideo className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Other Files</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{documentTypes.other || 0}</p>
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
                    placeholder="Search documents..."
                    className="pl-10 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                    <TabsList className="grid w-full grid-cols-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="catalog">Catalogs</TabsTrigger>
                      <TabsTrigger value="scope">Scope</TabsTrigger>
                      <TabsTrigger value="other">Other</TabsTrigger>
                    </TabsList>
                  </Tabs>

                  <Link href="/documents/upload">
                    <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                      <Plus className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Documents List */}
              <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle>Your Documents</CardTitle>
                  <CardDescription>
                    All your uploaded documents available for quotations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-10 w-10" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[150px]" />
                          </div>
                          <Skeleton className="ml-auto h-8 w-20" />
                        </div>
                      ))}
                    </div>
                  ) : !filteredDocuments || filteredDocuments.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">No documents found</h3>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        {searchTerm || activeTab !== "all"
                          ? "No documents match your search criteria."
                          : "Upload documents to use in your quotations."}
                      </p>
                      {!searchTerm && activeTab === "all" && (
                        <Link href="/documents/upload">
                          <Button 
                            className="mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Upload Document
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredDocuments.map((document) => (
                        <div 
                          key={document.id}
                          className="flex flex-col md:flex-row md:items-center gap-4 p-4 border rounded-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors"
                        >
                          <div className="flex-shrink-0">
                            {getFileIcon(document.mimeType)}
                          </div>
                          
                          <div className="flex-grow">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                              <div>
                                <h3 className="font-medium truncate text-gray-900 dark:text-gray-100">{document.name}</h3>
                                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 space-x-3">
                                  <span>{formatFileSize(document.fileSize)}</span>
                                  <span>Uploaded on {format(new Date(document.createdAt), "MMM d, yyyy")}</span>
                                </div>
                              </div>
                              
                              <Badge variant="outline" className="mt-2 md:mt-0 w-fit bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400">
                                {document.type.charAt(0).toUpperCase() + document.type.slice(1)}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 mt-2 md:mt-0">
                            <a 
                              href={`/api/documents/${document.id}/download`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button variant="ghost" size="icon" title="Download" className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/50">
                                <Download className="h-4 w-4" />
                              </Button>
                            </a>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/50" title="Delete">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the document. This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-500 hover:bg-red-600"
                                    onClick={() => deleteDocument.mutate(document.id)}
                                  >
                                    {deleteDocument.isPending ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
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