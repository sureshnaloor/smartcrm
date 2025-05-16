import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Invoice, InvoiceItem, CompanyProfile } from "../../../../shared/schema";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Sidebar } from "@/components/layout/sidebar";
import { InvoiceForm } from "@/components/invoice/invoice-form";
import { InvoiceItemTable } from "@/components/invoice/invoice-item-table";
import { InvoiceSummary } from "@/components/invoice/invoice-summary";
import { InvoiceTemplateSelector } from "@/components/invoice/invoice-template-selector";
import { ExcelImportModal } from "@/components/invoice/excel-import-modal";
import { UpgradeBanner } from "@/components/subscription/upgrade-banner";
import { Button } from "@/components/ui/button";
import { Helmet } from "react-helmet-async";
import { FileSpreadsheet, FilePlus2, File } from "lucide-react";
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
        
        <div className="min-h-screen flex flex-col">
          <Header />
          <div className="flex-1 flex">
            <Sidebar className="w-64" />
            <main className="flex-1 md:ml-64 p-6">
              <div className="max-w-7xl mx-auto">
                <div className="text-center py-12">
                  <div className="mx-auto h-24 w-24 rounded-full bg-yellow-100 flex items-center justify-center">
                    <FilePlus2 className="h-12 w-12 text-yellow-600" />
                  </div>
                  <h2 className="mt-4 text-lg font-medium text-gray-900">Invoice Quota Reached</h2>
                  <p className="mt-2 text-gray-500">
                    You have reached your invoice quota for this billing period.
                    Upgrade your plan to create more invoices.
                  </p>
                  <div className="mt-6">
                    <UpgradeBanner minimal />
                  </div>
                </div>
              </div>
            </main>
          </div>
          <Footer />
        </div>
        
        <UpgradeBanner />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Create Invoice | InvoiceFlow</title>
        <meta name="description" content="Create a new professional invoice with customizable templates and international tax support." />
      </Helmet>
      
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex">
          <Sidebar className="w-64" />
          <main className="flex-1 md:ml-64 p-6">
            <div className="max-w-7xl mx-auto">
              <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-semibold text-gray-900">Create New Invoice</h1>
                </div>
                <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
                  {currentStep > 1 && (
                    <>
                      <Button
                        variant="outline"
                        disabled={isGeneratingPdf}
                        onClick={() => setShowExcelImportModal(true)}
                      >
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Import Excel
                      </Button>
                      <Button 
                        variant="default"
                        disabled={isGeneratingPdf || invoiceItems.length === 0}
                        onClick={handleGeneratePdf}
                      >
                        <File className="mr-2 h-4 w-4" />
                        {isGeneratingPdf ? "Generating..." : "Generate PDF"}
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="p-6">
                  {currentStep === 1 && (
                    <InvoiceForm 
                      onSave={handleSaveInvoice}
                    />
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
            </div>
          </main>
        </div>
        <Footer />
      </div>
      
      {invoiceId && (
        <ExcelImportModal 
          invoiceId={invoiceId}
          open={showExcelImportModal}
          onClose={() => setShowExcelImportModal(false)}
        />
      )}
      
      <UpgradeBanner />
    </>
  );
}
