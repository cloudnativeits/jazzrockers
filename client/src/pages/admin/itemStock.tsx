import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";

import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";  
import { ColumnDef } from "@tanstack/react-table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Inventory, stockItem, StockItem } from "@shared/schema";
import { formatCurrency, formatDateToDDMMYYYY } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Form Schema
const itemStockFormSchema = z.object({
  stockItemId: z.coerce.number().min(1, "Item is required"),
  stockQuantity: z.coerce.number().min(1, "Quantity must be 1 or greater"),
});

type ItemStockFormValues = z.infer<typeof itemStockFormSchema>;

// Function to update stock quantity
export async function updateStockQuantity(id: number, quantity: number, operation: 'add' | 'subtract') {
  try {
    const response = await apiRequest("GET", `/api/stock-item/${id}`);
    const stockItem = await response.json();
    
    if (!stockItem) throw new Error('Stock item not found');
    
    const newQuantity = operation === 'add' 
      ? stockItem.stockQuantity + quantity
      : stockItem.stockQuantity - quantity;
    
    if (newQuantity < 0) throw new Error('Insufficient stock quantity');
    
    await apiRequest("PUT", `/api/stock-item/${id}`, {
      ...stockItem,
      stockQuantity: newQuantity
    });
    
    return true;
  } catch (error: any) {
    console.error('Error updating stock quantity:', error);
    throw error;
  }
}

export default function AdminItemStock() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<StockItem | null>(null);
  const { toast } = useToast();

  // Fetch inventory items
  const { data: inventoryItems = [], isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  const { data: stockItems = [], isLoading: stockItemsLoading } = useQuery<StockItem[]>({
    queryKey: ["/api/stock-item"],
  });

  const form = useForm<ItemStockFormValues>({
    resolver: zodResolver(itemStockFormSchema),
    defaultValues: {
      stockItemId: 0,
      stockQuantity: 0,
    },
  });

  // Edit form
  const editForm = useForm<ItemStockFormValues>({
    resolver: zodResolver(itemStockFormSchema),
    defaultValues: {
      stockItemId: 0,
      stockQuantity: 0,
    },
  });

  const handleEditInventory = (stockItem: StockItem) => {
    setSelectedInventory(stockItem);
    editForm.reset({
      stockItemId: stockItem.stockItemId || 0,
      stockQuantity: stockItem.stockQuantity || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (stockItem: StockItem) => {
    setSelectedInventory(stockItem);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteInventory = async () => {
    if (!selectedInventory) return;
    try {
      await apiRequest("DELETE", `/api/stock-item/${selectedInventory.id}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/stock-item"] });
      setIsDeleteDialogOpen(false);
      setSelectedInventory(null);
      toast({
        title: "Success",
        description: "Stock item deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete stock item.",
        variant: "destructive",
      });
    }
  };

  const stockItemColumns: ColumnDef<StockItem>[] = [
    {
      id: "serial",
      header: "SL.No.",
      cell: ({ row }) => <div>{row.index + 1}</div>,
    },
    {
      accessorKey: "stockItemId",
      header: "Item Name",
      cell: ({ row }) => {
        const stockItemId = row.getValue("stockItemId") as number;
        const stockItem = inventoryItems.find((s: Inventory) => s.id === stockItemId);
        return stockItem ? stockItem.items : "Unknown Stock Item";
      },
    },
    {
      accessorKey: "stockQuantity",
      header: "Quantity",
      cell: ({ row }) => (
        <div>{row.getValue("stockQuantity")}</div>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: ({ row }) => (
        <div>{formatDateToDDMMYYYY(row.getValue("createdAt"))}</div>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const stockItem = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              size="sm"
              onClick={() => handleEditInventory(stockItem)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => handleDeleteClick(stockItem)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  // Submit handler for create
  const onSubmit = async (data: ItemStockFormValues) => {
    try {
    //   console.log("Submitting data:", data);
      const response = await apiRequest("POST", "/api/stock-item", data);
      console.log("Response:", response);
      await queryClient.invalidateQueries({ queryKey: ["/api/stock-item"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Stock item added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['allInventoryData'] });
    } catch (error: any) {
      console.error("Error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add inventory item.",
        variant: "destructive",
      });
    }
  };

  // Submit handler for edit
  const onEditSubmit = async (data: ItemStockFormValues) => {
    if (!selectedInventory) return;

    try {
      await apiRequest("PUT", `/api/stock-item/${selectedInventory.id}`, data);
      await queryClient.invalidateQueries({ queryKey: ["/api/stock-item"] });
      setIsEditDialogOpen(false);
      editForm.reset();
      setSelectedInventory(null);
      toast({
        title: "Success",
        description: "Stock item updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update stock item.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Item Stock"
        description="Manage item stock and their quantities."
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Stock
          </Button>
        }
      />

      {/* Stock Item Table */}
      <Tabs defaultValue="inventory">
        <TabsContent value="inventory" className="mt-6">
          <DataTable
            columns={stockItemColumns}
            data={stockItems}
            searchColumns={["stockItemId", "stockQuantity", "createdAt"]}
            searchPlaceholder="Search item stock..."
          />
        </TabsContent>
      </Tabs>

      {/* Create Stock Item Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Stock</DialogTitle>
            <DialogDescription>
              Enter the details of the new stock item.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="stockItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((stockItem) => (
                            <SelectItem key={stockItem.id} value={stockItem.id.toString()}>
                              {stockItem.items}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter quantity"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Stock</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Stock Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[450px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Stock Item</DialogTitle>
            <DialogDescription>
              Update the details of the stock item.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-8">
              <FormField
                control={editForm.control}
                name="stockItemId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((stockItem) => (
                            <SelectItem key={stockItem.id} value={stockItem.id.toString()}>
                              {stockItem.items}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="stockQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter amount"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Update Stock</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Stock Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Stock</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the item.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => handleDeleteInventory()}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
