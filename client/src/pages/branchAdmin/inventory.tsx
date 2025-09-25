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
import { Inventory } from "@shared/schema";
import { formatCurrency, formatDateToDDMMYYYY } from "@/lib/utils";

// Form Schema
const inventoryFormSchema = z.object({
  items: z.string().min(1, "Item name is required"),
  amount: z.coerce.number().min(0, "Amount must be 0 or greater"),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

export default function BranchAdminInventory() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<Inventory | null>(null);
  const { toast } = useToast();

  // Fetch inventory items
  const { data: inventoryItems = [], isLoading } = useQuery<Inventory[]>({
    queryKey: ["/api/inventory"],
  });

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      items: "",
      amount: 0,
    },
  });

  // Edit form
  const editForm = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      items: "",
      amount: 0,
    },
  });

  const handleEditInventory = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    editForm.reset({
      items: inventory.items || "",
      amount: inventory.amount || 0,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (inventory: Inventory) => {
    setSelectedInventory(inventory);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteInventory = async () => {
    if (!selectedInventory) return;
    try {
      await apiRequest("DELETE", `/api/inventory/${selectedInventory.id}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsDeleteDialogOpen(false);
      setSelectedInventory(null);
      toast({
        title: "Success",
        description: "Inventory item deleted successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete inventory item.",
        variant: "destructive",
      });
    }
  };

  const inventoryColumns: ColumnDef<Inventory>[] = [
    {
      id: "serial",
      header: "SL.No.",
      cell: ({ row }) => <div>{row.index + 1}</div>,
    },
    {
      accessorKey: "items",
      header: "Item Name",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => (
        <div>{formatCurrency(row.getValue("amount"))}</div>
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
        const inventory = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              className="bg-blue-500 hover:bg-blue-600 text-white"
              size="sm"
              onClick={() => handleEditInventory(inventory)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={() => handleDeleteClick(inventory)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  // Submit handler for create
  const onSubmit = async (data: InventoryFormValues) => {
    try {
    //   console.log("Submitting data:", data);
      const response = await apiRequest("POST", "/api/inventory", data);
      console.log("Response:", response);
      await queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Inventory item added successfully.",
      });
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
  const onEditSubmit = async (data: InventoryFormValues) => {
    if (!selectedInventory) return;

    try {
      await apiRequest("PUT", `/api/inventory/${selectedInventory.id}`, data);
      await queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setIsEditDialogOpen(false);
      editForm.reset();
      setSelectedInventory(null);
      toast({
        title: "Success",
        description: "Inventory item updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update inventory item.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="Inventory"
        description="Manage inventory items and their quantities."
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        }
      />

      {/* Inventory Table */}
      <Tabs defaultValue="inventory">
        <TabsContent value="inventory" className="mt-6">
          <DataTable
            columns={inventoryColumns}
            data={inventoryItems}
            searchColumns={["items", "amount", "createdAt"]}
            searchPlaceholder="Search inventory..."
          />
        </TabsContent>
      </Tabs>

      {/* Create Inventory Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Item</DialogTitle>
            <DialogDescription>
              Enter the details of the new inventory item.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="items"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
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
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Item</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Inventory Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the details of the inventory item.
            </DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-8">
              <FormField
                control={editForm.control}
                name="items"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter item name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
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
                <Button type="submit">Update Item</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Inventory Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
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
