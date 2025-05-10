import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FileInput } from "@/components/ui/file-input";
import { LoadingButton } from "@/components/ui/loading-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileSpreadsheet, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExcelImportModalProps {
  invoiceId: number;
  open: boolean;
  onClose: () => void;
}

export function ExcelImportModal({ invoiceId, open, onClose }: ExcelImportModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/invoices/${invoiceId}/import-excel`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to import items");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      toast({
        title: "Import successful",
        description: "Invoice items have been imported successfully.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message || "There was an error importing your data.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUploading(false);
      setFile(null);
    },
  });

  const handleImport = () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an Excel file to import.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    importMutation.mutate(formData);
  };

  const downloadTemplate = () => {
    window.open("/api/download-template-excel", "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 mb-4">
            <FileSpreadsheet className="h-6 w-6 text-primary-600" />
          </div>
          <DialogTitle>Import Items from Excel</DialogTitle>
          <DialogDescription>
            Upload an Excel file with your invoice items. The file should contain columns for
            Description, Quantity, Price, and Discount.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <FileInput
            accept=".xlsx,.xls,.csv"
            maxSize={5 * 1024 * 1024} // 5MB
            onChange={setFile}
            buttonText="Choose file"
            helperText="XLSX, XLS or CSV (max. 5MB)"
          />

          <div className="flex justify-center">
            <Button 
              variant="link" 
              className="text-sm text-primary-600"
              onClick={downloadTemplate}
            >
              <Download className="h-4 w-4 mr-1" />
              Download template Excel file
            </Button>
          </div>
        </div>

        <DialogFooter className="flex space-x-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Cancel
          </Button>
          <LoadingButton
            type="button"
            loading={isUploading}
            loadingText="Importing..."
            onClick={handleImport}
            disabled={!file}
          >
            Import
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
