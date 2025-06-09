import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";
import { UpgradeBanner } from "@/components/subscription/upgrade-banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingButton } from "@/components/ui/loading-button";
import { DataTable } from "@/components/ui/data-table";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet-async";
import { 
  Settings as SettingsIcon, 
  Building, 
  User, 
  CreditCard, 
  Plus, 
  Edit, 
  Trash, 
  Check,
  Save,
  FileText,
  Shield,
  Clock
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CountrySelect } from "@/components/ui/country-select";
import { CompanyProfileFormValues } from "@/types";
import { CompanyProfile } from "@shared/schema";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCompanyProfile, setSelectedCompanyProfile] = useState<number | null>(null);
  const [showCompanyProfileForm, setShowCompanyProfileForm] = useState(false);
  const [companyProfileToDelete, setCompanyProfileToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch company profiles
  const { data: companyProfiles = [], isLoading: isLoadingProfiles } = useQuery<CompanyProfile[]>({
    queryKey: ["/api/company-profiles"],
  });

  // Company profile form schema
  const companyProfileSchema = z.object({
    name: z.string().min(1, "Company name is required"),
    taxId: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email("Invalid email address").optional().or(z.literal("")),
    website: z.string().optional(),
    bankName: z.string().optional(),
    bankAccountName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankRoutingNumber: z.string().optional(),
    bankSwiftBic: z.string().optional(),
    bankIban: z.string().optional(),
    isDefault: z.boolean().optional(),
  });

  // Setup form for company profile
  const companyProfileForm = useForm<z.infer<typeof companyProfileSchema>>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: "",
      taxId: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
      country: "GB",
      phone: "",
      email: "",
      website: "",
      bankName: "",
      bankAccountName: "",
      bankAccountNumber: "",
      bankRoutingNumber: "",
      bankSwiftBic: "",
      bankIban: "",
      isDefault: false,
    },
  });

  // Create or update company profile
  const companyProfileMutation = useMutation({
    mutationFn: async (values: CompanyProfileFormValues) => {
      const method = selectedCompanyProfile ? "PUT" : "POST";
      const url = selectedCompanyProfile
        ? `/api/company-profiles/${selectedCompanyProfile}`
        : "/api/company-profiles";

      const response = await apiRequest(method, url, values);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-profiles"] });
      toast({
        title: selectedCompanyProfile ? "Company profile updated" : "Company profile created",
        description: selectedCompanyProfile
          ? "Your company profile has been updated successfully."
          : "Your company profile has been created successfully.",
      });
      setShowCompanyProfileForm(false);
      setSelectedCompanyProfile(null);
    },
    onError: (error) => {
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

  // Delete company profile
  const deleteCompanyProfileMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/company-profiles/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/company-profiles"] });
      toast({
        title: "Company profile deleted",
        description: "The company profile has been deleted successfully.",
      });
      setCompanyProfileToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Could not delete the company profile. It may be used in existing invoices.",
        variant: "destructive",
      });
    },
  });

  // Handle creating or editing a company profile
  const handleCompanyProfileAction = (id?: number) => {
    if (id) {
      // Edit mode - find the profile and set form values
      const profile = companyProfiles.find((p: CompanyProfile) => p.id === id);
      if (profile) {
        companyProfileForm.reset({
          name: profile.name,
          taxId: profile.taxId || "",
          address: profile.address || "",
          city: profile.city || "",
          state: profile.state || "",
          postalCode: profile.postalCode || "",
          country: profile.country || "GB",
          phone: profile.phone || "",
          email: profile.email || "",
          website: profile.website || "",
          bankName: profile.bankName || "",
          bankAccountName: profile.bankAccountName || "",
          bankAccountNumber: profile.bankAccountNumber || "",
          bankRoutingNumber: profile.bankRoutingNumber || "",
          bankSwiftBic: profile.bankSwiftBic || "",
          bankIban: profile.bankIban || "",
          isDefault: profile.isDefault || false,
        });
        setSelectedCompanyProfile(id);
      }
    } else {
      // Create mode - reset the form
      companyProfileForm.reset({
        name: "",
        taxId: "",
        address: "",
        city: "",
        state: "",
        postalCode: "",
        country: "GB",
        phone: "",
        email: "",
        website: "",
        bankName: "",
        bankAccountName: "",
        bankAccountNumber: "",
        bankRoutingNumber: "",
        bankSwiftBic: "",
        bankIban: "",
        isDefault: (companyProfiles as CompanyProfile[]).length === 0,
      });
      setSelectedCompanyProfile(null);
    }
    setShowCompanyProfileForm(true);
  };

  // Submit company profile form
  const onSubmitCompanyProfile = async (values: z.infer<typeof companyProfileSchema>) => {
    setIsLoading(true);
    companyProfileMutation.mutate(values);
  };

  return (
    <>
      <Helmet>
        <title>Settings | InvoiceFlow</title>
        <meta name="description" content="Manage your InvoiceFlow account settings, company profiles, and subscription details." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex flex-1">
          <Sidebar className="w-64" />
          <main className="flex-1 p-8 ml-64">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Settings
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Manage your account, company profiles, and preferences
                </p>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Profiles</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                          {companyProfiles.length}
                        </h3>
                      </div>
                      <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                        <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Default Profile</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                          {companyProfiles.filter((p: CompanyProfile) => p.isDefault).length}
                        </h3>
                      </div>
                      <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center">
                        <Check className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Account Type</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                          {user?.planId === "free" ? "Free" : "Pro"}
                        </h3>
                      </div>
                      <div className="h-12 w-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center">
                        <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Subscription</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                          {user?.subscriptionExpiresAt ? "Active" : "N/A"}
                        </h3>
                      </div>
                      <div className="h-12 w-12 bg-orange-100 dark:bg-orange-900/50 rounded-full flex items-center justify-center">
                        <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-none">
                <Tabs defaultValue="companyProfiles" className="p-6">
                  <TabsList className="mb-6 bg-gray-100 dark:bg-gray-700/50">
                    <TabsTrigger value="companyProfiles" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                      <Building className="h-4 w-4 mr-2" />
                      Company Profiles
                    </TabsTrigger>
                    <TabsTrigger value="account" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                      <User className="h-4 w-4 mr-2" />
                      Account
                    </TabsTrigger>
                    <TabsTrigger value="subscription" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscription
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Company Profiles Tab */}
                  <TabsContent value="companyProfiles">
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Your Company Profiles</h2>
                        <Button onClick={() => handleCompanyProfileAction()}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Company Profile
                        </Button>
                      </div>
                      
                      {isLoadingProfiles ? (
                        <div className="flex justify-center p-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : companyProfiles.length === 0 ? (
                        <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                          <CardContent className="pt-6 pb-6 text-center">
                            <Building className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No company profiles</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              Get started by creating a new company profile. This information will appear on your invoices.
                            </p>
                            <Button 
                              onClick={() => handleCompanyProfileAction()} 
                              className="mt-4"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create Company Profile
                            </Button>
                          </CardContent>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {(companyProfiles as CompanyProfile[]).map((profile: CompanyProfile) => (
                            <Card key={profile.id} className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                              <CardContent className="pt-6 flex justify-between items-center">
                                <div className="flex items-start">
                                  <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                                    <Building className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                                  </div>
                                  <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                      {profile.name}
                                      {profile.isDefault && (
                                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-400">
                                          <Check className="h-3 w-3 mr-1" />
                                          Default
                                        </span>
                                      )}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      {profile.address && (
                                        <span className="block">
                                          {profile.address}
                                          {(profile.city || profile.state || profile.postalCode) && ', '}
                                          {profile.city}{profile.city && profile.state && ', '}{profile.state}{' '}
                                          {profile.postalCode}
                                        </span>
                                      )}
                                      {profile.taxId && <span className="block">Tax ID: {profile.taxId}</span>}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCompanyProfileAction(profile.id)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => setCompanyProfileToDelete(profile.id)}
                                    disabled={profile.isDefault ?? false}
                                  >
                                    <Trash className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  {/* Account Tab */}
                  <TabsContent value="account">
                    <div className="space-y-6">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Your Account</h2>
                      
                      <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                        <CardHeader>
                          <CardTitle className="text-gray-900 dark:text-gray-100">Personal Information</CardTitle>
                          <CardDescription className="text-gray-500 dark:text-gray-400">
                            Update your account information
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                              <Input value={user?.fullName || ""} readOnly className="bg-gray-50 dark:bg-gray-700/50" />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                              <Input value={user?.email || ""} readOnly className="bg-gray-50 dark:bg-gray-700/50" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                        <CardHeader>
                          <CardTitle className="text-gray-900 dark:text-gray-100">Password</CardTitle>
                          <CardDescription className="text-gray-500 dark:text-gray-400">
                            Change your password
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Password changes are currently not supported in this version.
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                  
                  {/* Subscription Tab */}
                  <TabsContent value="subscription">
                    <div className="space-y-6">
                      <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Your Subscription</h2>
                      
                      <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                        <CardHeader>
                          <CardTitle className="text-gray-900 dark:text-gray-100">Current Plan</CardTitle>
                          <CardDescription className="text-gray-500 dark:text-gray-400">
                            Details about your current subscription
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center">
                                <CreditCard className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                              </div>
                              <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                  {user?.planId === "free" ? "Free Plan" : 
                                   user?.planId === "monthly" ? "Professional (Monthly)" :
                                   user?.planId === "yearly" ? "Professional (Yearly)" : 
                                   user?.planId === "per-invoice" ? "Pay as you go" : "Unknown Plan"}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {user?.invoiceQuota === -1 ? (
                                    "Unlimited invoices"
                                  ) : (
                                    <>
                                      {user?.invoicesUsed || 0} / {user?.invoiceQuota || 10} invoices used
                                      {user?.subscriptionExpiresAt && (
                                        <> · Expires on {new Date(user.subscriptionExpiresAt).toLocaleDateString()}</>
                                      )}
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {user?.planId !== "free" && (
                        <Card className="bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-200 border-none">
                          <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-gray-100">Billing History</CardTitle>
                            <CardDescription className="text-gray-500 dark:text-gray-400">
                              Your recent billing transactions
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Billing history is not available in this version.
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
        <Footer />
      </div>

      {/* Company Profile Form Dialog */}
      <Dialog open={showCompanyProfileForm} onOpenChange={setShowCompanyProfileForm}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedCompanyProfile ? "Edit Company Profile" : "Create Company Profile"}
            </DialogTitle>
            <DialogDescription>
              {selectedCompanyProfile
                ? "Update your company information that will appear on invoices."
                : "Add your company information that will appear on invoices."}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...companyProfileForm}>
            <form onSubmit={companyProfileForm.handleSubmit(onSubmitCompanyProfile)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <FormField
                    control={companyProfileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input placeholder="Your company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={companyProfileForm.control}
                  name="taxId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax ID / VAT Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Tax identification number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyProfileForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="company@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyProfileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyProfileForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://www.example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={companyProfileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Street address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={companyProfileForm.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="City" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyProfileForm.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State / Province</FormLabel>
                      <FormControl>
                        <Input placeholder="State or province" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyProfileForm.control}
                  name="postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Postal / ZIP Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Postal code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyProfileForm.control}
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

                <div className="md:col-span-2">
                  <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-2">Bank Details</h3>
                </div>

                <FormField
                  control={companyProfileForm.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Bank name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyProfileForm.control}
                  name="bankAccountName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Account holder name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyProfileForm.control}
                  name="bankAccountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Account number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyProfileForm.control}
                  name="bankRoutingNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Routing Number / Sort Code</FormLabel>
                      <FormControl>
                        <Input placeholder="Routing number or sort code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyProfileForm.control}
                  name="bankSwiftBic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SWIFT / BIC</FormLabel>
                      <FormControl>
                        <Input placeholder="SWIFT or BIC code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={companyProfileForm.control}
                  name="bankIban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IBAN</FormLabel>
                      <FormControl>
                        <Input placeholder="International Bank Account Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormField
                    control={companyProfileForm.control}
                    name="isDefault"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Set as default company profile
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowCompanyProfileForm(false)}>
                  Cancel
                </Button>
                <LoadingButton 
                  type="submit" 
                  loading={isLoading}
                  loadingText={selectedCompanyProfile ? "Updating..." : "Creating..."}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {selectedCompanyProfile ? "Update Profile" : "Create Profile"}
                </LoadingButton>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Company Profile Dialog */}
      <Dialog open={companyProfileToDelete !== null} onOpenChange={() => setCompanyProfileToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company Profile</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this company profile? This action cannot be undone.
              Note that you cannot delete a company profile that is used in existing invoices.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompanyProfileToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (companyProfileToDelete) {
                  deleteCompanyProfileMutation.mutate(companyProfileToDelete);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <UpgradeBanner />
    </>
  );
}
