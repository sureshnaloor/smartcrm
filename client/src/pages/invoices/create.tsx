import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Invoice, InvoiceItem, CompanyProfile } from "../../../../shared/schema";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoiceItemTable } from "@/components/invoice/invoice-item-table";
import { InvoiceSummary } from "@/components/invoice/invoice-summary";
import { InvoiceTemplateSelector } from "@/components/invoice/invoice-template-selector";
import { ExcelImportModal } from "@/components/invoice/excel-import-modal";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, Eye, Save, FileSpreadsheet, File } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSubscription } from "@/hooks/use-subscription";

export default function CreateInvoicePage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { subscriptionStatus } = useSubscription();
  const [currentStep, setCurrentStep] = useState(1);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Check if user has reached their invoice quota
  const hasReachedQuota = 
    subscriptionStatus && 
    subscriptionStatus.invoiceQuota !== -1 && 
    subscriptionStatus.invoicesUsed >= subscriptionStatus.invoiceQuota;

  // Fetch created invoice
  const { data: invoice } = useQuery<Invoice>({
    queryKey: [`/api/invoices/${invoiceId}`],
    enabled: !!invoiceId,
  });

  // Fetch invoice items
  const { data: invoiceItems = [] } = useQuery<InvoiceItem[]>({
    queryKey: [`/api/invoices/${invoiceId}/items`],
    enabled: !!invoiceId,
  });

  // Get company profile
  const { data: companyProfile } = useQuery<CompanyProfile>({
    queryKey: ["/api/company-profiles", invoice?.companyProfileId],
    enabled: !!invoice?.companyProfileId,
  });

  const handleSaveInvoice = (id: number) => {
    setInvoiceId(id);
    setCurrentStep(2);
  };

  const handleInvoiceItemsChange = () => {
    if (invoiceId) {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
    }
  };

  const handleGeneratePdf = async () => {
    if (!invoiceId) return;
    try {
      setIsGeneratingPdf(true);
      window.open(`/api/invoices/${invoiceId}/pdf`, "_blank");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleTemplateChange = async (templateId: string) => {
    if (!invoiceId) return;
    try {
      await apiRequest("PUT", `/api/invoices/${invoiceId}`, { templateId });
      toast({
        title: "Template updated",
        description: "Invoice template has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update template",
        variant: "destructive",
      });
    }
  };

  const handleCompleteInvoice = () => {
    toast({
      title: "Invoice created",
      description: "Your invoice has been created successfully.",
    });
    navigate("/invoices");
  };

  if (hasReachedQuota) {
    return (
      <>
        <Helmet>
          <title>Create Invoice | InvoiceFlow</title>
        </Helmet>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
          <Header />
          <div className="flex-1 flex h-[calc(100vh-64px)]">
            <div className="w-64 flex-shrink-0">
              <Sidebar />
            </div>
            <main className="flex-1 p-8 overflow-y-auto">
              <div className="max-w-7xl mx-auto">
                <div className="text-center py-12">
                  <div className="mx-auto h-24 w-24 rounded-full bg-yellow-100 flex items-center justify-center">
                    <FileSpreadsheet className="h-12 w-12 text-yellow-600" />
                  </div>
                  <h2 className="mt-4 text-lg font-medium text-gray-900">Invoice Quota Reached</h2>
                  <p className="mt-2 text-gray-500">
                    You have reached your invoice quota for this billing period.
                    Upgrade your plan to create more invoices.
                  </p>
                  <div className="mt-6">
                    {/* UpgradeBanner minimal */}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Invoice | InvoiceFlow</title>
        <meta name="description" content="Create a new professional invoice with customizable templates and international tax support." />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <div className="flex h-[calc(100vh-64px)]">
          <div className="w-64 flex-shrink-0">
            <Sidebar />
          </div>
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
              {/* Header Section */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/invoices")}
                    className="hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Create Invoice
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                      Create a new invoice for your client
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => setPreviewMode(!previewMode)}
                    className="flex items-center"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    {previewMode ? "Edit Mode" : "Preview Mode"}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleCompleteInvoice}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Invoice
                  </Button>
                </div>
              </div>
              {/* Form and Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form */}
                <div className={`${previewMode ? 'hidden lg:block' : ''}`}>
                  <div className="bg-white dark:bg-gray-800 shadow-lg border-none rounded-lg p-6">
                    {currentStep === 1 && (
                      <InvoiceForm onSave={handleSaveInvoice} />
                    )}
                    {currentStep === 2 && invoiceId && invoice && (
                      <div className="space-y-8">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Invoice Items</h2>
                        <InvoiceItemTable 
                          invoiceId={invoiceId} 
                          items={invoiceItems}
                          currency={invoice.currency}
                          onItemsChange={handleInvoiceItemsChange}
                        />
                        <InvoiceSummary 
                          invoice={invoice}
                          items={invoiceItems} 
                          companyProfile={companyProfile}
                          currency={invoice.currency}
                        />
                        <InvoiceTemplateSelector 
                          selectedTemplate={invoice.templateId || "classic"}
                          onTemplateChange={handleTemplateChange}
                        />
                        <div className="flex justify-center pt-4">
                          <Button
                            onClick={handleCompleteInvoice}
                            disabled={invoiceItems.length === 0}
                          >
                            Complete Invoice
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Preview */}
                <div className={`${!previewMode ? 'hidden lg:block' : ''}`}>
                  <div className="bg-white dark:bg-gray-800 shadow-lg border-none rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-2">Preview</h2>
                    <p className="text-gray-500 mb-4">See how your invoice will look</p>
                    <div className="aspect-[1/1.414] bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 flex items-center justify-center">
                      <div className="text-center text-gray-500 dark:text-gray-400">
                        Preview will be available when you start filling the form
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
      {/* Excel Import Modal */}
      {invoiceId && (
        <ExcelImportModal 
          invoiceId={invoiceId}
          open={showExcelImportModal}
          onClose={() => setShowExcelImportModal(false)}
        />
      )}
    </>
  );
}
