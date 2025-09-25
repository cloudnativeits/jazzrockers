import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Music, 
  Users, 
  MapPin, 
  BookOpen, 
  Search,
  ChevronRight,
  Pencil,
  FileText
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { cn, getInitials } from "@/lib/utils";

export default function TeacherBatches() {
  const { user } = useAuth();
  const [selectedBatch, setSelectedBatch] = useState<any>(null);
  const [isBatchDetailsOpen, setIsBatchDetailsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch batches for the teacher
  const { data: batches = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/batches/teacher"],
    enabled: !!user,
  });

  const filteredBatches = batches.filter((batch: any) => 
    batch.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    batch.courseName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewBatch = (batch: any) => {
    setSelectedBatch(batch);
    setIsBatchDetailsOpen(true);
  };

  return (
    <AppShell>
      <PageHeader
        title="My Batches"
        description="View and manage your assigned classes and student groups"
      />

      <div className="grid grid-cols-1 gap-6">
        {/* Search and Filter Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                  type="text"
                  placeholder="Search batches..."
                  className="pl-9 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Batch Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-10">
              Loading your batches...
            </div>
          ) : filteredBatches.length === 0 ? (
            <div className="col-span-full text-center py-10 text-neutral-500">
              No batches found
            </div>
          ) : (
            filteredBatches.map((batch: any) => (
              <Card key={batch.id} className="overflow-hidden">
                <div 
                  className={cn(
                    "h-2 w-full",
                    batch.category === "music" && "bg-blue-500",
                    batch.category === "dance" && "bg-purple-500",
                    batch.category === "art" && "bg-orange-500",
                    !batch.category && "bg-primary"
                  )}
                ></div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{batch.name}</CardTitle>
                      <CardDescription>{batch.courseName}</CardDescription>
                    </div>
                    <Badge 
                      variant={batch.status === "active" ? "default" : "outline"}
                      className={batch.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                    >
                      {batch.status || "Active"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{batch.time || `${batch.startTime} - ${batch.endTime}`}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{batch.days || "Mon, Wed, Fri"}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{batch.branch || "Main Branch"}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>{batch.studentCount || "12"} students enrolled</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-end">
                  <Button 
                    variant="outline"
                    onClick={() => handleViewBatch(batch)}
                  >
                    View Details
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Batch Details Dialog */}
      <Dialog open={isBatchDetailsOpen} onOpenChange={setIsBatchDetailsOpen}>
        <DialogContent className="sm:max-w-[700px] overflow-y-auto max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Batch Details</DialogTitle>
            <DialogDescription>
              {selectedBatch?.name} - {selectedBatch?.courseName}
            </DialogDescription>
          </DialogHeader>

          {selectedBatch && (
            <div className="mt-4">
              <Tabs defaultValue="details">
                <TabsList className="w-full">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="students">Students</TabsTrigger>
                  {/* <TabsTrigger value="attendance">Attendance</TabsTrigger> */}
                  {/* <TabsTrigger value="syllabus">Syllabus</TabsTrigger> */}
                </TabsList>

                <TabsContent value="details" className="mt-4">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{selectedBatch.name}</h3>
                      <Badge 
                        variant={selectedBatch.status === "active" ? "default" : "outline"}
                        className={selectedBatch.status === "active" ? "bg-green-500 hover:bg-green-600" : ""}
                      >
                        {selectedBatch.status || "Active"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Schedule Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Time: {selectedBatch.time || `${selectedBatch.startTime} - ${selectedBatch.endTime}`}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Days: {selectedBatch.days || "Mon, Wed, Fri"}</span>
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Location: {selectedBatch.branch || "Main Branch"}</span>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Course Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                          <div className="flex items-center">
                            <BookOpen className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Course: {selectedBatch.courseName}</span>
                          </div>
                          <div className="flex items-center">
                            <Music className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Type: {selectedBatch.category || "Music"}</span>
                          </div>
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span>Students: {selectedBatch.studentCount || "12"} enrolled</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* <div className="flex justify-end space-x-2">
                      <Button variant="outline">
                        <Pencil className="mr-2 h-4 w-4" />
                        Add Notes
                      </Button>
                      <Button>
                        <FileText className="mr-2 h-4 w-4" />
                        Attendance Sheet
                      </Button>
                    </div> */}
                  </div>
                </TabsContent>

                <TabsContent value="students" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Students</h3>
                      <div className="text-sm text-neutral-500">
                        {selectedBatch.studentCount || "12"} students enrolled
                      </div>
                      <div className="text-sm text-neutral-500">Attendance for this month</div>
                    </div>

                    <div className="grid grid-cols-1 gap-2">
                      {Array.from({ length: selectedBatch.studentCount || 12 }).map((_, index) => (
                        <div key={index} className="border rounded-md p-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback>
                                {String.fromCharCode(65 + index % 26)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">Student {index + 1}</div>
                              <div className="text-xs text-neutral-500">ID: STU{(1000 + index).toString()}</div>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Badge variant="outline">
                              {index % 2 === 0 ? "95%" : "85%"} attendance
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="attendance" className="mt-4">
                  <div className="text-center py-8 text-neutral-500">
                    Attendance records for this batch will be displayed here
                  </div>
                </TabsContent>

                <TabsContent value="syllabus" className="mt-4">
                  <div className="text-center py-8 text-neutral-500">
                    Syllabus and lesson plan details will be displayed here
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}