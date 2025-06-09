import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { LoadingButton } from "@/components/ui/loading-button";
import { CountrySelect } from "@/components/ui/country-select";
import { Helmet } from "react-helmet-async";
import { insertClientSchema } from "@shared/schema";
import { ClientFormValues } from "@/types";
import { ArrowLeft, Save } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CreateClientPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Form validation schema
  const formSchema = z.object({
    name: z.string().min(1, "Client name is required"),
    taxId: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    phone: z.string().optional(),
    notes: z.string().optional(),
  });

  // Setup form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      taxId: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "GB",
      email: "",
      phone: "",
      notes: "",
    },
  });

  // Create client
  const createClientMutation = useMutation({
    mutationFn: async (values: ClientFormValues) => {
      const response = await apiRequest("POST", "/api/clients", values);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Client created",
        description: "Your client has been created successfully.",
      });
      navigate("/clients");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Form submission handler
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    createClientMutation.mutate(values);
  };

  return (
    <>
      <Helmet>
        <title>Add Client | InvoiceFlow</title>
        <meta name="description" content="Add a new client to your InvoiceFlow account for easy invoicing." />
      </Helmet>
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex h-[calc(100vh-64px)]">
          <div className="w-64 flex-shrink-0">
            <Sidebar />
          </div>
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-3xl mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/clients")}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Create Client
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Add a new client to your business
                    </p>
                  </div>
                </div>
                <Button
                  type="submit"
                  form="client-form"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Client
                </Button>
              </div>

              <Card className="bg-white dark:bg-gray-800 shadow-lg border-none">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold">Client Information</CardTitle>
                  <CardDescription>Enter the details for your new client</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form id="client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Basic Information */}
                        <div className="space-y-4 md:col-span-2">
                          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Basic Information</h2>
                          
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Client Name <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Client or company name" 
                                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="client@example.com" 
                                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="+1 (555) 123-4567" 
                                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name="taxId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Tax ID / VAT Number</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Tax identification number" 
                                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* Address */}
                        <div className="space-y-4 md:col-span-2">
                          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Address</h2>

                          <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Street Address</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="123 Business St." 
                                    className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="City" 
                                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State / Province</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="State or province" 
                                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="postalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal / ZIP Code</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="Postal code" 
                                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                                      {...field} 
                                    />
                                  </FormControl>
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
                                  <FormControl>
                                    <CountrySelect 
                                      value={field.value || ""}
                                      onValueChange={field.onChange}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Additional Information */}
                        <div className="space-y-4 md:col-span-2">
                          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Additional Information</h2>

                          <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Add any additional notes about this client"
                                    className="resize-none bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-blue-500 dark:focus:border-blue-400"
                                    rows={4}
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4 pt-4">
                        <Button 
                          variant="outline" 
                          type="button" 
                          onClick={() => navigate("/clients")}
                          className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </Button>
                        <LoadingButton
                          type="submit"
                          loading={isLoading}
                          loadingText="Creating..."
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Create Client
                        </LoadingButton>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
