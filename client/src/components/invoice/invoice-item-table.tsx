import { useState } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { InvoiceItem} from "@shared/schema";
import { InvoiceItemFormValues } from "@/types";
import { formatCurrency, getCurrencyByCode } from "@/lib/utils";

interface InvoiceItemTableProps {
  invoiceId: number;
  items: InvoiceItem[];
  currency: string;
  readOnly?: boolean;
  onItemsChange?: () => void;
}

export function InvoiceItemTable({ 
  invoiceId, 
  items, 
  currency = "USD", 
  readOnly = false,
  onItemsChange
}: InvoiceItemTableProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newItem, setNewItem] = useState<InvoiceItemFormValues>({
    description: "",
    quantity: 1,
    unitPrice: 0,
    discount: 0
  });

  const currencySymbol = getCurrencyByCode(currency)?.symbol || "$";

  // Add new item
  const addItemMutation = useMutation({
    mutationFn: async (item: InvoiceItemFormValues) => {
      const response = await apiRequest("POST", `/api/invoices/${invoiceId}/items`, item);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      setNewItem({
        description: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0
      });
      toast({
        title: "Item added",
        description: "Invoice item has been added successfully."
      });
      if (onItemsChange) onItemsChange();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add item",
        variant: "destructive"
      });
    }
  });

  // Update item
  const updateItemMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<InvoiceItemFormValues> }) => {
      const response = await apiRequest("PUT", `/api/invoices/${invoiceId}/items/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      if (onItemsChange) onItemsChange();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive"
      });
    }
  });

  // Delete item
  const deleteItemMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/invoices/${invoiceId}/items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}/items`] });
      queryClient.invalidateQueries({ queryKey: [`/api/invoices/${invoiceId}`] });
      toast({
        title: "Item deleted",
        description: "Invoice item has been deleted successfully."
      });
      if (onItemsChange) onItemsChange();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive"
      });
    }
  });

  const handleAddItem = () => {
    if (!newItem.description || !newItem.quantity || !newItem.unitPrice) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    addItemMutation.mutate(newItem);
  };

  const handleUpdateItem = (id: number, field: string, value: string | number) => {
    if (readOnly) return;
    
    const data = { [field]: value };
    updateItemMutation.mutate({ id, data });
  };

  const handleDeleteItem = (id: number) => {
    if (readOnly) return;
    
    deleteItemMutation.mutate(id);
  };

  return (
    <div>
      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-100">
              <TableRow>
                <TableHead>Item Description</TableHead>
                <TableHead className="w-24">Quantity</TableHead>
                <TableHead className="w-32">Unit Price</TableHead>
                <TableHead className="w-24">Discount %</TableHead>
                <TableHead className="w-32">Total</TableHead>
                {!readOnly && <TableHead className="w-20 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={readOnly ? 5 : 6} className="h-24 text-center text-muted-foreground">
                    No items added to this invoice yet
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {readOnly ? (
                        item.description
                      ) : (
                        <Input
                          type="text"
                          value={item.description}
                          onChange={(e) => handleUpdateItem(item.id, "description", e.target.value)}
                          className="border-0 bg-transparent focus:ring-0"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        item.quantity
                      ) : (
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, "quantity", e.target.value)}
                          className="w-20 border-0 bg-transparent focus:ring-0 text-right"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        formatCurrency(item.unitPrice, currency)
                      ) : (
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-1">{currencySymbol}</span>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(item.id, "unitPrice", e.target.value)}
                            className="w-24 border-0 bg-transparent focus:ring-0 text-right"
                          />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {readOnly ? (
                        `${item.discount || 0}%`
                      ) : (
                        <div className="flex items-center">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={item.discount || 0}
                            onChange={(e) => handleUpdateItem(item.id, "discount", e.target.value)}
                            className="w-16 border-0 bg-transparent focus:ring-0 text-right"
                          />
                          <span className="text-gray-500 ml-1">%</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-gray-900 mono">
                        {formatCurrency(item.amount, currency)}
                      </div>
                    </TableCell>
                    {!readOnly && (
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}

              {!readOnly && (
                <TableRow>
                  <TableCell>
                    <Input
                      type="text"
                      placeholder="Enter item description"
                      value={newItem.description}
                      onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                      className="border-0 bg-transparent focus:ring-0"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      placeholder="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) || 0 })}
                      className="w-20 border-0 bg-transparent focus:ring-0 text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">{currencySymbol}</span>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={newItem.unitPrice === 0 ? "" : newItem.unitPrice}
                        onChange={(e) => setNewItem({ ...newItem, unitPrice: parseFloat(e.target.value) || 0 })}
                        className="w-24 border-0 bg-transparent focus:ring-0 text-right"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={newItem.discount === 0 ? "" : newItem.discount}
                        onChange={(e) => setNewItem({ ...newItem, discount: parseFloat(e.target.value) || 0 })}
                        className="w-16 border-0 bg-transparent focus:ring-0 text-right"
                      />
                      <span className="text-gray-500 ml-1">%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-medium text-gray-500 mono">
                      {formatCurrency(
                        (parseFloat(String(newItem.quantity)) || 0) * 
                        (parseFloat(String(newItem.unitPrice)) || 0) * 
                        (1 - (parseFloat(String(newItem.discount)) || 0) / 100),
                        currency
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleAddItem}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
