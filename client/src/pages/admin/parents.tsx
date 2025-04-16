import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PlusCircle, UserPlus, Eye, Edit, Trash2, Users, MailIcon, PhoneIcon, MapPinIcon, CalendarIcon } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { User, Student } from "@shared/schema";
import { getInitials } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AdminParents() {
  const [activeTab, setActiveTab] = useState("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<User | null>(null);
  const { toast } = useToast();

  // Fetch all users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users"],
  });

  // Filter only parent users
  const parents = users.filter((user: User) => user.role === "parent");

  // Fetch students to see children of parents
  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/students"],
  });

  // Handle view parent details
  const handleViewParent = (parent: User) => {
    setSelectedParent(parent);
    setIsViewDialogOpen(true);
  };

  // Get children for a parent
  const getChildrenForParent = (parentId: number): Student[] => {
    return students.filter((student: Student) => student.parentId === parentId);
  };

  // Filter parents based on active tab
  const filteredParents = parents;

  // Parent table columns
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "id",
      header: "ID",
    },
    {
      accessorKey: "fullName",
      header: "Name",
      cell: ({ row }) => {
        const parent = row.original;
        
        return (
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-2">
              <AvatarFallback>
                {getInitials(parent.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{parent.fullName}</div>
              <div className="text-xs text-muted-foreground">{parent.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "children",
      header: "Children",
      cell: ({ row }) => {
        const parent = row.original;
        const children = getChildrenForParent(parent.id);
        
        return (
          <div className="flex items-center">
            <Badge variant="outline">{children.length} children</Badge>
          </div>
        );
      },
    },
    {
      accessorKey: "branch",
      header: "Branch",
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) => {
        const phone = row.original.phone || "Not provided";
        return <span>{phone}</span>;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const parent = row.original;
        
        return (
          <div className="flex space-x-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => handleViewParent(parent)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <AppShell>
      <PageHeader 
        title="Parents" 
        description="Manage parents of students enrolled at Jazzrockers."
        actions={
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Parent
          </Button>
        }
      />
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Parents</TabsTrigger>
          <TabsTrigger value="active">With Active Students</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-6">
          <DataTable 
            columns={columns} 
            data={filteredParents} 
            searchColumn="fullName"
            searchPlaceholder="Search parents..."
          />
        </TabsContent>
      </Tabs>
      
      {/* View Parent Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Parent Details</DialogTitle>
            <DialogDescription>
              View comprehensive information about the parent.
            </DialogDescription>
          </DialogHeader>
          
          {selectedParent && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="flex items-center">
                  <Avatar className="h-14 w-14 mr-4">
                    <AvatarFallback className="text-lg">
                      {getInitials(selectedParent.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">
                      {selectedParent.fullName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Parent · ID: {selectedParent.id}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-3">Contact Information</h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MailIcon className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium">Email</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedParent.email || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <PhoneIcon className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium">Phone</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedParent.phone || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <MapPinIcon className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium">Address</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedParent.address || "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-semibold mb-3">Branch</h4>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MapPinIcon className="h-4 w-4 text-muted-foreground mt-0.5 mr-2" />
                        <div>
                          <p className="text-sm font-medium">Registered Branch</p>
                          <p className="text-sm text-muted-foreground">{selectedParent.branch || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Children Section */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold">Children</h4>
                    <Button variant="outline" size="sm">
                      <PlusCircle className="h-3.5 w-3.5 mr-1" />
                      Add Child
                    </Button>
                  </div>
                  
                  {getChildrenForParent(selectedParent.id).length > 0 ? (
                    <div className="space-y-3">
                      {getChildrenForParent(selectedParent.id).map((child, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-md">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-2">
                              <AvatarFallback>
                                {getInitials(`${child.firstName} ${child.lastName}`)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{child.firstName} {child.lastName}</div>
                              <div className="text-xs text-muted-foreground">ID: {child.studentId}</div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                      <Users className="h-10 w-10 mb-2 opacity-20" />
                      <p className="text-sm">No children registered</p>
                      <p className="text-xs">Add children using the button above</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="flex justify-end space-x-3 mt-4">
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Details
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Create Parent Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Parent</DialogTitle>
            <DialogDescription>
              Fill in the details to add a new parent to Jazzrockers.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="Enter full name" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter email address" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="Enter phone number" />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Enter address" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select branch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Branch">Main Branch</SelectItem>
                    <SelectItem value="North Campus">North Campus</SelectItem>
                    <SelectItem value="South Campus">South Campus</SelectItem>
                    <SelectItem value="East Campus">East Campus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Create a password" />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button type="submit">Add Parent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}