import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { LoadingButton } from "@/components/ui/loading-button";
import { CountrySelect } from "@/components/ui/country-select";
import { CurrencySelect } from "@/components/ui/currency-select";
import { CalendarIcon, Save } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn, formatDate, generateInvoiceNumber } from "@/lib/utils";
import { InvoiceFormValues } from "@/types";
import { CompanyProfile, Client, insertInvoiceSchema } from "@shared/schema";

interface InvoiceFormProps {
  onSave: (id: number) => void;
  initialData?: InvoiceFormValues & { id?: number };
}

export function InvoiceForm({ onSave, initialData }: InvoiceFormProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  // Form validation schema
  const formSchema = z.object({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    invoiceDate: z.date({
      required_error: "Invoice date is required",
    }),
    dueDate: z.date().optional(),
    clientId: z.number({
      required_error: "Client is required",
    }),
    companyProfileId: z.number({
      required_error: "Company profile is required",
    }),
    country: z.string().min(1, "Country is required"),
    currency: z.string().min(1, "Currency is required"),
    templateId: z.string().default("classic"),
    discount: z.string().optional(),
    notes: z.string().optional(),
    terms: z.string().optional(),
    status: z.string().default("draft"),
  });

  type FormValues = z.infer<typeof formSchema>;

  // Setup form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      invoiceDate: initialData.invoiceDate instanceof Date ? initialData.invoiceDate : new Date(initialData.invoiceDate),
      dueDate: initialData.dueDate ? new Date(initialData.dueDate) : undefined,
      discount: initialData.discount?.toString(),
      templateId: initialData.templateId || "classic",
      status: initialData.status || "draft",
    } : {
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: new Date(),
      country: "GB",
      currency: "GBP",
      templateId: "classic",
      status: "draft",
    },
  });

  // Fetch clients
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch company profiles
  const { data: companyProfiles = [] } = useQuery<CompanyProfile[]>({
    queryKey: ["/api/company-profiles"],
  });

  // Create or update invoice
  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const method = initialData?.id ? "PUT" : "POST";
      const url = initialData?.id
        ? `/api/invoices/${initialData.id}`
        : "/api/invoices";

      const response = await apiRequest(method, url, {
        ...values,
        invoiceDate: values.invoiceDate.toISOString(),
        dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
      });

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: initialData ? "Invoice updated" : "Invoice created",
        description: initialData
          ? "Your invoice has been updated successfully."
          : "Your invoice has been created successfully.",
      });
      onSave(initialData?.id || 0);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsLoading(false);
    },
  });

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    mutation.mutate(values);
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Information */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Your Company</h2>
                <FormField
                  control={form.control}
                  name="companyProfileId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Profile</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a company profile" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companyProfiles.map((profile) => (
                            <SelectItem key={profile.id} value={profile.id.toString()}>
                              {profile.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select one of your company profiles or{" "}
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto"
                          onClick={() => navigate("/settings")}
                        >
                          create a new one
                        </Button>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Invoice Details</h2>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="invoiceNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice #</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="invoiceDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Invoice Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  formatDate(field.value)
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  formatDate(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
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
                            value={field.value}
                            onValueChange={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <FormControl>
                        <CurrencySelect
                          value={field.value}
                          onValueChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Client Information */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-lg font-medium text-gray-900">Client Information</h2>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => navigate("/clients/create")}
                  >
                    Add New Client
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a client" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
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
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-3">Additional Information</h2>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Additional notes for the client"
                            className="resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="terms"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payment Terms</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Payment terms and conditions"
                            className="resize-none"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" type="button" onClick={() => navigate("/invoices")}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              loading={isLoading}
              loadingText="Saving..."
            >
              <Save className="mr-2 h-4 w-4" />
              Save Invoice
            </LoadingButton>
          </div>
        </form>
      </Form>
    </div>
  );
}
