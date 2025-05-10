import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChevronLeft, Save, Plus, FileUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

// Form schema
const quotationFormSchema = z.object({
  quoteNumber: z.string().min(1, "Quote number is required"),
  quoteDate: z.date(),
  validUntil: z.date().optional(),
  clientId: z.number(),
  companyProfileId: z.number(),
  country: z.string(),
  currency: z.string(),
  templateId: z.string(),
  status: z.string(),
  terms: z.string().optional(),
  notes: z.string().optional(),
  discount: z.string().optional(),
});

type QuotationFormValues = z.infer<typeof quotationFormSchema>;

export default function CreateQuotationPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("general");
  
  // Get company profiles
  const { data: companyProfiles, isLoading: loadingProfiles } = useQuery({
    queryKey: ["/api/company-profiles"],
  });
  
  // Get clients
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ["/api/clients"],
  });
  
  // Get invoice templates
  const { data: templates, isLoading: loadingTemplates } = useQuery({
    queryKey: ["/api/invoice-templates"],
    queryFn: () => apiRequest("GET", "/api/invoice-templates?includesPremium=true&type=quotation"),
  });
  
  // Form
  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationFormSchema),
    defaultValues: {
      quoteNumber: `QT-${Date.now().toString().slice(-6)}`,
      quoteDate: new Date(),
      status: "draft",
      country: "US",
      currency: "USD",
      templateId: "basic-template",
    },
  });
  
  // Create quotation mutation
  const createQuotation = useMutation({
    mutationFn: async (values: QuotationFormValues) => {
      return apiRequest("POST", "/api/quotations", values);
    },
    onSuccess: async (response) => {
      const data = await response.json();
      toast({
        title: "Success",
        description: "Quotation created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotations"] });
      navigate(`/quotations/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create quotation",
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(values: QuotationFormValues) {
    createQuotation.mutate(values);
  }
  
  const isLoading = loadingProfiles || loadingClients || loadingTemplates;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/quotations">
            <Button variant="ghost" className="mr-4">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Create Quotation</h1>
        </div>
        <Button disabled={createQuotation.isPending} onClick={form.handleSubmit(onSubmit)}>
          {createQuotation.isPending ? (
            <div className="flex items-center">
              <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
              Saving...
            </div>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Quotation
            </>
          )}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="general">General Information</TabsTrigger>
            <TabsTrigger value="materials">Materials & Services</TabsTrigger>
            <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <TabsContent value="general" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Quotation Details</CardTitle>
                    <CardDescription>
                      Enter the basic information for your quotation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="quoteNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quotation Number</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                                <SelectItem value="expired">Expired</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="quoteDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Quotation Date</FormLabel>
                            <DatePicker
                              date={field.value}
                              setDate={field.onChange}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="validUntil"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Valid Until</FormLabel>
                            <DatePicker
                              date={field.value}
                              setDate={field.onChange}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Client & Company Information</CardTitle>
                    <CardDescription>
                      Select the client and your company profile for this quotation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Client</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select client" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clients?.map((client) => (
                                  <SelectItem key={client.id} value={client.id.toString()}>
                                    {client.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="companyProfileId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Profile</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select company profile" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {companyProfiles?.map((profile) => (
                                  <SelectItem key={profile.id} value={profile.id.toString()}>
                                    {profile.companyName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="US">United States</SelectItem>
                                <SelectItem value="CA">Canada</SelectItem>
                                <SelectItem value="GB">United Kingdom</SelectItem>
                                <SelectItem value="AU">Australia</SelectItem>
                                {/* Add more countries as needed */}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD ($)</SelectItem>
                                <SelectItem value="EUR">EUR (€)</SelectItem>
                                <SelectItem value="GBP">GBP (£)</SelectItem>
                                <SelectItem value="CAD">CAD ($)</SelectItem>
                                <SelectItem value="AUD">AUD ($)</SelectItem>
                                {/* Add more currencies as needed */}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Additional Information</CardTitle>
                    <CardDescription>
                      Add notes and select a template for your quotation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={form.control}
                        name="templateId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quotation Template</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select template" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {templates?.map((template) => (
                                  <SelectItem key={template.id} value={template.id}>
                                    {template.name} {template.isPremium && "(Premium)"}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="discount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount (%)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormDescription>
                              Enter a percentage discount to apply to the entire quotation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea rows={4} {...field} />
                            </FormControl>
                            <FormDescription>
                              Add any additional notes that will appear on the quotation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="materials" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Materials & Services</CardTitle>
                    <CardDescription>
                      Add materials and services to your quotation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Items</h3>
                        <div className="flex space-x-2">
                          <Button variant="outline" type="button">
                            <FileUp className="mr-2 h-4 w-4" />
                            Import from Excel
                          </Button>
                          <Button type="button">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Item
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-8 text-center border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">
                          No items added yet. Click "Add Item" to begin or import from Excel.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="terms" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Terms & Conditions</CardTitle>
                    <CardDescription>
                      Add terms and conditions to your quotation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Terms & Conditions</FormLabel>
                            <FormControl>
                              <Textarea rows={8} {...field} />
                            </FormControl>
                            <FormDescription>
                              Enter the terms and conditions that apply to this quotation
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="mt-6">
                        <h3 className="text-md font-medium mb-2">Available Templates</h3>
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" type="button" className="justify-start">
                            Standard Terms
                          </Button>
                          <Button variant="outline" type="button" className="justify-start">
                            Custom Payment Terms
                          </Button>
                          <Button variant="outline" type="button" className="justify-start">
                            Consulting Terms
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="documents" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Documents</CardTitle>
                    <CardDescription>
                      Attach supporting documents to your quotation
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Attachments</h3>
                        <Button type="button">
                          <Plus className="mr-2 h-4 w-4" />
                          Add Document
                        </Button>
                      </div>
                      
                      <div className="p-8 text-center border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">
                          No documents attached yet. Click "Add Document" to upload files.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </form>
          </Form>
        </Tabs>
      )}
    </div>
  );
}