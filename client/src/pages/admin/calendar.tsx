import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Filter,
  User,
  Users,
  Search,
  Home,
  X,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

export default function AdminCalendar() {
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [activeBranch, setActiveBranch] = useState<string>("all");
  const [eventFilter, setEventFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  // const { toast } = useToast();


  // Fetch branches
  const { data: branches = [], isLoading: isLoadingBranches } = useQuery<any[]>({
    queryKey: ["/api/branches"],
  });

  // Fetch teachers
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/employees');
        if (!response.ok) {
          throw new Error('Failed to fetch teachers');
        }
        const data = await response.json();
        
        // Filter and transform teachers data
        const teachersList = data
          .filter((emp: any) => emp && (emp.position === 'teacher' || emp.role === 'teacher'))
          .map((teacher: any) => ({
            employeeId: teacher.employeeId,
            fullName: `${teacher.fullName}`,
            position: teacher.position,
            role: teacher.role
          }));
        
        console.log('Processed teachers:', teachersList);
        return teachersList;
      } catch (error) {
        console.error('Error fetching teachers:', error);
        return [];
      }
    },
  });

  // Debug log for teachers data
  useEffect(() => {
    if (teachers && teachers.length > 0) {
      console.log("Teachers data:", teachers);
    }
  }, [teachers]);

  // Fetch batches
  const { data: batches = [], isLoading: isLoadingBatches } = useQuery<any[]>({
    queryKey: ["/api/batches"],
  });

  // Add "All Branches" option to the branches list
  const branchOptions = [
    { id: "all", name: "All Branches" },
    ...branches.map(branch => ({
      id: branch.id.toString(),
      name: branch.name
    }))
  ];

  // Mock event categories
  const eventCategories = [
    { id: "all", name: "All Events", color: "bg-gray-500" },
    { id: "class", name: "Regular Classes", color: "bg-blue-500" },
    { id: "exam", name: "Exams", color: "bg-red-500" },
    { id: "workshop", name: "Workshops", color: "bg-amber-500" },
    { id: "performance", name: "Performances", color: "bg-purple-500" },
    { id: "holiday", name: "Holidays", color: "bg-green-500" },
  ];

  // Mock events data
  const events = [
    {
      id: 1,
      title: "Guitar Class - Beginners",
      date: new Date(2023, 3, 10, 10, 0),
      endTime: new Date(2023, 3, 10, 11, 30),
      type: "class",
      branch: "andheri",
      teacher: "John Smith",
      students: 8,
      room: "Studio 3",
    },
    {
      id: 2,
      title: "Piano Workshop",
      date: new Date(2023, 3, 12, 15, 0),
      endTime: new Date(2023, 3, 12, 17, 0),
      type: "workshop",
      branch: "bandra",
      teacher: "Maria Rodriguez",
      students: 12,
      room: "Main Hall",
    },
    {
      id: 3,
      title: "Drum Class - Intermediate",
      date: new Date(2023, 3, 15, 18, 0),
      endTime: new Date(2023, 3, 15, 19, 30),
      type: "class",
      branch: "powai",
      teacher: "Rahul Mehta",
      students: 6,
      room: "Studio 2",
    },
    {
      id: 4,
      title: "Annual Performance",
      date: new Date(2023, 3, 20, 17, 0),
      endTime: new Date(2023, 3, 20, 20, 0),
      type: "performance",
      branch: "andheri",
      teacher: "Multiple",
      students: 30,
      room: "Auditorium",
    },
    {
      id: 5,
      title: "Theory Exam",
      date: new Date(2023, 3, 22, 10, 0),
      endTime: new Date(2023, 3, 22, 12, 0),
      type: "exam",
      branch: "thane",
      teacher: "Priya Sharma",
      students: 15,
      room: "Classroom 1",
    },
    {
      id: 6,
      title: "Diwali Holiday",
      date: new Date(2023, 3, 25, 0, 0),
      endTime: new Date(2023, 3, 25, 23, 59),
      type: "holiday",
      branch: "all",
      teacher: "",
      students: 0,
      room: "",
    },
  ];

  // Get color for event type
  const getEventColor = (type: string) => {
    const category = eventCategories.find((cat) => cat.id === type);
    return category ? category.color : "bg-gray-500";
  };

  // Filter events based on activeTab and search query
  const filteredEvents = events.filter((event) => {
    const matchesBranch = activeBranch === "all" || event.branch === activeBranch || event.branch === "all";
    const matchesType = eventFilter === "all" || event.type === eventFilter;
    const matchesSearch = !searchQuery ||
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.teacher.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesBranch && matchesType && matchesSearch;
  });

  // Generate days for the month view
  const getDaysInMonth = (year: number, month: number) => {
    const startDate = new Date(year, month, 1);
    const days = [];
    
    // Add days from previous month to fill first week
    const startDay = startDate.getDay();
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDate - i),
        isCurrentMonth: false
      });
    }
    
    // Add days from current month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    
    // Add days from next month to fill last week
    const endDay = new Date(year, month, daysInMonth).getDay();
    for (let i = 1; i < 7 - endDay; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const days = getDaysInMonth(date.getFullYear(), date.getMonth());

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day.getDate() &&
        eventDate.getMonth() === day.getMonth() &&
        eventDate.getFullYear() === day.getFullYear();
    });
  };

  // Format day as "Mon", "Tue", etc.
  const formatDayName = (day: Date) => {
    return format(day, 'EEE');
  };

  // Format time as "10:00 AM"
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  // Navigate to previous or next month
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(date);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setDate(newDate);
  };

  // Define breadcrumbs for the page
  const breadcrumbs = [
    {
      title: "Home",
      href: "/admin/dashboard",
      icon: <Home className="h-4 w-4" />
    },
    {
      title: "Calendar"
    }
  ];

  // State for the form
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("17:00");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("18:00");
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");

  const handleScheduleClass = async () => {
    if (!selectedBatch || !selectedTeacher || !selectedDate || !selectedTime || !selectedEndTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format the date and times
      const classDate = selectedDate;
      const [startHours, startMinutes] = selectedTime.split(':');
      const [endHours, endMinutes] = selectedEndTime.split(':');
      
      const startDateTime = new Date(classDate);
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));
      
      const endDateTime = new Date(classDate);
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

      // Create the class schedule
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          batchId: selectedBatch,
          teacherId: selectedTeacher,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to schedule class');
      }

      toast({
        title: "Success",
        description: "Class has been scheduled successfully.",
      });

      // Reset form and close dialog
      setSelectedBatch("");
      setSelectedTeacher("");
      setSelectedDate(new Date());
      setSelectedTime("09:00");
      setSelectedEndTime("10:00");
      setIsEventDialogOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to schedule the class. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppShell>
      <PageHeader 
        title="Calendar" 
        description="Manage classes, events, and schedules across all branches"
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <div>
            <Select value={activeBranch} onValueChange={setActiveBranch}>
              <SelectTrigger>
                <Home className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Branches</SelectLabel>
                  {isLoadingBranches ? (
                    <SelectItem value="loading" disabled>
                      Loading branches...
                    </SelectItem>
                  ) : branchOptions.map((branch) => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Event Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Event Types</SelectLabel>
                {eventCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${category.color} mr-2`}></div>
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select> */}

          {/* <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search events, teachers..." 
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1.5 h-7 w-7"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div> */}
        </div>

        <div className="flex gap-2 items-center">
          <Tabs defaultValue="month" className="w-[300px]" onValueChange={(value) => setView(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
            <TabsContent value="day"></TabsContent>
            <TabsContent value="week"></TabsContent>
            <TabsContent value="month"></TabsContent>
          </Tabs>

          <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Class
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Class</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {/* Branch Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="branch">Branch</Label>
                  <Select name="branch">
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingBranches ? (
                        <SelectItem value="loading" disabled>
                          Loading branches...
                        </SelectItem>
                      ) : branchOptions.slice(1).map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Batch Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="batch">Batch</Label>
                  <Select 
                    value={selectedBatch} 
                    onValueChange={setSelectedBatch}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingBatches ? (
                        <SelectItem value="loading" disabled>
                          Loading batches...
                        </SelectItem>
                      ) : batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id.toString()}>
                          {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Teacher Selection */}
                <div className="grid gap-2">
                  <Label htmlFor="teacher">Teacher</Label>
                  <Select 
                    value={selectedTeacher} 
                    onValueChange={setSelectedTeacher}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingTeachers ? (
                        <SelectItem value="loading" disabled>
                          Loading teachers...
                        </SelectItem>
                      ) : teachers && teachers.length > 0 ? (
                        teachers.map((teacher: any) => (
                          <SelectItem 
                            key={teacher.employeeId} 
                            value={teacher.employeeId}
                          >
                            {teacher.fullName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          No teachers available
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date and Time Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={`w-full justify-start text-left font-normal`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={(date) => {
                            console.log("Selected date:", date);
                            setSelectedDate(date || undefined);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label>Start Time</Label>
                      <Input
                        type="time"
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>End Time</Label>
                      <Input
                        type="time"
                        value={selectedEndTime}
                        onChange={(e) => setSelectedEndTime(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleScheduleClass}>
                  Schedule Class
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {view === "month" && (
            <div className="bg-white rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold mx-4">
                    {format(date, 'MMMM yyyy')}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigateMonth('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* Day names */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {days.map((day, i) => {
                  const eventsForDay = getEventsForDay(day.date);
                  const isToday = day.date.toDateString() === new Date().toDateString();
                  
                  return (
                    <div
                      key={i}
                      className={`min-h-[120px] bg-white p-2 ${
                        day.isCurrentMonth ? "" : "text-gray-400"
                      } ${isToday ? "bg-blue-50" : ""}`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-sm font-medium ${isToday ? "bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center" : ""}`}>
                          {day.date.getDate()}
                        </span>
                        {eventsForDay.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {eventsForDay.length} event{eventsForDay.length > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 overflow-y-auto max-h-[80px]">
                        {eventsForDay.slice(0, 3).map((event) => (
                          <div
                            key={event.id}
                            className={`text-xs p-1 rounded truncate ${getEventColor(event.type)} bg-opacity-20 border-l-2 ${getEventColor(event.type)}`}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="text-gray-600 flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatTime(event.date)}
                            </div>
                          </div>
                        ))}
                        {eventsForDay.length > 3 && (
                          <div className="text-xs text-blue-600 font-medium">
                            + {eventsForDay.length - 3} more events
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {view === "week" && (
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="flex border-b">
                  <div className="w-20 p-4 border-r"></div>
                  {Array.from({ length: 7 }, (_, i) => {
                    const day = new Date(date);
                    day.setDate(date.getDate() - date.getDay() + i);
                    const isToday = day.toDateString() === new Date().toDateString();
                    
                    return (
                      <div
                        key={i}
                        className={`flex-1 p-4 text-center ${isToday ? "bg-blue-50" : ""}`}
                      >
                        <div className={`font-medium ${isToday ? "text-blue-600" : ""}`}>
                          {formatDayName(day)}
                        </div>
                        <div className={`text-2xl ${isToday ? "bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto" : ""}`}>
                          {day.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="relative" style={{ height: "800px" }}>
                  {/* Time labels */}
                  <div className="absolute top-0 left-0 h-full w-20 border-r">
                    {Array.from({ length: 13 }, (_, i) => {
                      const hour = i + 9; // 9 AM to 9 PM
                      return (
                        <div key={hour} className="h-[100px] relative border-b">
                          <span className="absolute -top-2.5 left-2 text-xs text-gray-500">
                            {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Week grid */}
                  <div className="absolute top-0 left-20 right-0 h-full grid grid-cols-7 gap-px bg-gray-200">
                    {Array.from({ length: 7 }, (_, dayIndex) => {
                      const day = new Date(date);
                      day.setDate(date.getDate() - date.getDay() + dayIndex);
                      const eventsForDay = getEventsForDay(day);
                      
                      return (
                        <div key={dayIndex} className="relative bg-white">
                          {/* Hour divisions */}
                          {Array.from({ length: 13 }, (_, hourIndex) => (
                            <div key={hourIndex} className="h-[100px] border-b"></div>
                          ))}
                          
                          {/* Events */}
                          {eventsForDay.map((event) => {
                            const startHour = event.date.getHours();
                            const startMinute = event.date.getMinutes();
                            const endHour = event.endTime.getHours();
                            const endMinute = event.endTime.getMinutes();
                            
                            const topPosition = ((startHour - 9) * 100) + (startMinute / 60 * 100);
                            const height = ((endHour - startHour) * 100) + ((endMinute - startMinute) / 60 * 100);
                            
                            return (
                              <div
                                key={event.id}
                                className={`absolute left-1 right-1 rounded ${getEventColor(event.type)} bg-opacity-20 border-l-2 ${getEventColor(event.type)} p-2 overflow-hidden`}
                                style={{ top: `${topPosition}px`, height: `${height}px` }}
                              >
                                <div className="font-medium text-sm truncate">{event.title}</div>
                                <div className="text-xs text-gray-600 flex items-center">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatTime(event.date)} - {formatTime(event.endTime)}
                                </div>
                                {height > 60 && (
                                  <div className="text-xs mt-1">
                                    {event.branch !== "all" && (
                                      <div className="truncate">{branches.find(b => b.id === event.branch)?.name}</div>
                                    )}
                                    {event.teacher && (
                                      <div className="flex items-center truncate">
                                        <User className="h-3 w-3 mr-1" />
                                        {event.teacher}
                                      </div>
                                    )}
                                    {event.students > 0 && (
                                      <div className="flex items-center truncate">
                                        <Users className="h-3 w-3 mr-1" />
                                        {event.students} students
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {view === "day" && (
            <div>
              <div className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newDate = new Date(date);
                      newDate.setDate(newDate.getDate() - 1);
                      setDate(newDate);
                    }}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h2 className="text-xl font-semibold mx-4">
                    {format(date, 'EEEE, MMMM d, yyyy')}
                  </h2>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      const newDate = new Date(date);
                      newDate.setDate(newDate.getDate() + 1);
                      setDate(newDate);
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDate(new Date())}
                >
                  Today
                </Button>
              </div>
              
              <div className="relative" style={{ height: "800px" }}>
                {/* Time labels */}
                <div className="absolute top-0 left-0 h-full w-20 border-r">
                  {Array.from({ length: 13 }, (_, i) => {
                    const hour = i + 9; // 9 AM to 9 PM
                    return (
                      <div key={hour} className="h-[100px] relative border-b">
                        <span className="absolute -top-2.5 left-2 text-xs text-gray-500">
                          {hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                        </span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Day events */}
                <div className="absolute top-0 left-20 right-0 h-full bg-white">
                  {Array.from({ length: 13 }, (_, hourIndex) => (
                    <div key={hourIndex} className="h-[100px] border-b"></div>
                  ))}
                  
                  {getEventsForDay(date).map((event) => {
                    const startHour = event.date.getHours();
                    const startMinute = event.date.getMinutes();
                    const endHour = event.endTime.getHours();
                    const endMinute = event.endTime.getMinutes();
                    
                    const topPosition = ((startHour - 9) * 100) + (startMinute / 60 * 100);
                    const height = ((endHour - startHour) * 100) + ((endMinute - startMinute) / 60 * 100);
                    
                    return (
                      <div
                        key={event.id}
                        className={`absolute left-2 right-2 md:left-[15%] md:right-[15%] rounded ${getEventColor(event.type)} bg-opacity-20 border-l-2 ${getEventColor(event.type)} p-3 overflow-hidden`}
                        style={{ top: `${topPosition}px`, height: `${height}px` }}
                      >
                        <div className="font-medium text-sm md:text-base truncate">{event.title}</div>
                        <div className="text-xs md:text-sm text-gray-600 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(event.date)} - {formatTime(event.endTime)}
                        </div>
                        {height > 60 && (
                          <div className="text-xs md:text-sm mt-2 space-y-1">
                            {event.branch !== "all" && (
                              <div className="truncate">
                                <Badge variant="outline" className="mr-2">Branch</Badge>
                                {branches.find(b => b.id === event.branch)?.name}
                              </div>
                            )}
                            {event.teacher && (
                              <div className="flex items-center truncate">
                                <Badge variant="outline" className="mr-2">Teacher</Badge>
                                {event.teacher}
                              </div>
                            )}
                            {event.students > 0 && (
                              <div className="flex items-center truncate">
                                <Badge variant="outline" className="mr-2">Students</Badge>
                                {event.students} students
                              </div>
                            )}
                            {event.room && (
                              <div className="flex items-center truncate">
                                <Badge variant="outline" className="mr-2">Room</Badge>
                                {event.room}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}