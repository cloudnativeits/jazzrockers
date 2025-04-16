import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  MapPin,
  Music
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isSameDay, isToday } from "date-fns";
import { cn } from "@/lib/utils";

// Event interface
interface Event {
  id: number;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  batchId: number;
  batchName: string;
  courseName: string;
  branch: string;
  studentCount: number;
  type: "class" | "exam" | "concert" | "meeting";
}

export default function TeacherCalendar() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");

  // Fetch classes (batches) for the teacher
  const { data: batches = [] } = useQuery<any[]>({
    queryKey: ["/api/batches/teacher"],
    enabled: !!user,
  });

  // Sample events data (this would come from your API)
  const [events, setEvents] = useState<Event[]>([]);

  // Initialize events based on batches
  useEffect(() => {
    if (batches.length) {
      const generatedEvents: Event[] = [];
      
      // Generate regular class events for each batch
      batches.forEach((batch: any) => {
        // Assuming batch contains schedule information like days of week
        const days = batch.schedule?.days || ["Monday", "Wednesday", "Friday"];
        const dayMap: Record<string, number> = {
          "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, 
          "Thursday": 4, "Friday": 5, "Saturday": 6
        };
        
        const today = new Date();
        const startDate = startOfMonth(subMonths(today, 1)); // Previous month
        const endDate = endOfMonth(addMonths(today, 1)); // Next month
        
        // Generate events for each day in the range
        eachDayOfInterval({ start: startDate, end: endDate }).forEach(date => {
          // Check if this date's day of week matches batch schedule
          if (days.includes(Object.keys(dayMap).find(key => dayMap[key] === getDay(date)))) {
            generatedEvents.push({
              id: Math.floor(Math.random() * 10000),
              title: `${batch.name} Class`,
              date,
              startTime: batch.startTime || "15:00",
              endTime: batch.endTime || "16:30",
              batchId: batch.id,
              batchName: batch.name,
              courseName: batch.courseName || "Music Course",
              branch: batch.branch || "Main Branch",
              studentCount: batch.studentCount || 12,
              type: "class"
            });
          }
        });
      });
      
      // Add a few extra events
      generatedEvents.push({
        id: Math.floor(Math.random() * 10000),
        title: "End of Term Concert",
        date: addMonths(new Date(), 1),
        startTime: "18:00",
        endTime: "20:00",
        batchId: -1,
        batchName: "All Batches",
        courseName: "All Courses",
        branch: "Main Branch",
        studentCount: 50,
        type: "concert"
      });
      
      setEvents(generatedEvents);
    }
  }, [batches]);

  const handlePreviousMonth = () => {
    setCurrentMonth(prevMonth => subMonths(prevMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prevMonth => addMonths(prevMonth, 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  };

  // Get days in the month view
  const daysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    // Get the day of the week for the first day (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfWeek = getDay(start);
    
    // Add days from the previous month to fill the first row
    const previousMonthDays = [];
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      previousMonthDays.push(subMonths(start, 1));
    }
    
    return [...previousMonthDays, ...days];
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(new Date(event.date), date));
  };

  // Format time for display
  const formatTime = (time: string) => {
    return time;
    // You could format this better if needed
  };

  return (
    <AppShell>
      <PageHeader
        title="Calendar"
        description="View and manage your schedule and upcoming events"
      />

      <div className="grid grid-cols-1 gap-6">
        {/* Calendar Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-xl font-semibold">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Select value={viewMode} onValueChange={(value: "month" | "week" | "day") => setViewMode(value)}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="day">Day</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar View */}
        <Card>
          <CardContent className="p-4">
            {viewMode === "month" && (
              <div className="grid grid-cols-7 gap-2">
                {/* Day of Week Headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center py-2 font-medium text-sm">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {daysInMonth().map((day, i) => {
                  const dayEvents = getEventsForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentDay = isToday(day);
                  
                  return (
                    <div
                      key={i}
                      className={cn(
                        "h-28 border border-border rounded-md p-1 overflow-hidden",
                        !isCurrentMonth && "opacity-40 bg-neutral-50",
                        isSelected && "border-primary border-2",
                        isCurrentDay && "bg-primary/5"
                      )}
                      onClick={() => handleDateClick(day)}
                    >
                      <div className="text-right">
                        <span 
                          className={cn(
                            "inline-block rounded-full w-6 h-6 text-xs flex items-center justify-center",
                            isCurrentDay && "bg-primary text-white"
                          )}
                        >
                          {format(day, "d")}
                        </span>
                      </div>
                      <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-20px)]">
                        {dayEvents.map((event) => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs px-1 py-0.5 rounded truncate cursor-pointer",
                              event.type === "class" && "bg-blue-100 text-blue-800",
                              event.type === "exam" && "bg-orange-100 text-orange-800",
                              event.type === "concert" && "bg-purple-100 text-purple-800",
                              event.type === "meeting" && "bg-green-100 text-green-800"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEventClick(event);
                            }}
                          >
                            {formatTime(event.startTime)} - {event.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {viewMode === "week" && (
              <div className="text-center py-10 text-muted-foreground">
                Week view will be implemented here
              </div>
            )}
            
            {viewMode === "day" && (
              <div className="text-center py-10 text-muted-foreground">
                Day view will be implemented here
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Schedule for {format(selectedDate, "MMMM d, yyyy")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getEventsForDate(selectedDate).length === 0 ? (
              <div className="text-center py-10 text-neutral-500">
                No events scheduled for this day
              </div>
            ) : (
              <div className="space-y-4">
                {getEventsForDate(selectedDate).map((event) => (
                  <div 
                    key={event.id} 
                    className="border rounded-md p-4 hover:bg-neutral-50 cursor-pointer"
                    onClick={() => handleEventClick(event)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{event.title}</h3>
                        <div className="text-sm text-neutral-500">
                          {event.startTime} - {event.endTime}
                        </div>
                      </div>
                      <Badge 
                        className={cn(
                          event.type === "class" && "bg-blue-100 text-blue-800 hover:bg-blue-200",
                          event.type === "exam" && "bg-orange-100 text-orange-800 hover:bg-orange-200",
                          event.type === "concert" && "bg-purple-100 text-purple-800 hover:bg-purple-200",
                          event.type === "meeting" && "bg-green-100 text-green-800 hover:bg-green-200"
                        )}
                      >
                        {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {event.batchName && (
                        <div className="flex items-center text-xs text-neutral-500">
                          <Music className="h-3 w-3 mr-1" />
                          {event.batchName}
                        </div>
                      )}
                      {event.branch && (
                        <div className="flex items-center text-xs text-neutral-500">
                          <MapPin className="h-3 w-3 mr-1" />
                          {event.branch}
                        </div>
                      )}
                      {event.studentCount > 0 && (
                        <div className="flex items-center text-xs text-neutral-500">
                          <Users className="h-3 w-3 mr-1" />
                          {event.studentCount} students
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Event Details Dialog */}
      <Dialog open={isEventDialogOpen} onOpenChange={setIsEventDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Event details and information
            </DialogDescription>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-primary" />
                  <span>{format(new Date(selectedEvent.date), "MMMM d, yyyy")}</span>
                </div>
                <Badge 
                  className={cn(
                    selectedEvent.type === "class" && "bg-blue-100 text-blue-800",
                    selectedEvent.type === "exam" && "bg-orange-100 text-orange-800",
                    selectedEvent.type === "concert" && "bg-purple-100 text-purple-800",
                    selectedEvent.type === "meeting" && "bg-green-100 text-green-800"
                  )}
                >
                  {selectedEvent.type.charAt(0).toUpperCase() + selectedEvent.type.slice(1)}
                </Badge>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                <span>{selectedEvent.startTime} - {selectedEvent.endTime}</span>
              </div>
              
              <div className="flex items-center">
                <Music className="h-4 w-4 mr-2 text-primary" />
                <span>{selectedEvent.courseName} ({selectedEvent.batchName})</span>
              </div>
              
              <div className="flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-primary" />
                <span>{selectedEvent.branch}</span>
              </div>
              
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-2 text-primary" />
                <span>{selectedEvent.studentCount} students</span>
              </div>
              
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Students</h4>
                {/* This would be populated from your API */}
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Avatar key={i} className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {String.fromCharCode(65 + i)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {selectedEvent.studentCount > 5 && (
                    <div className="h-8 w-8 rounded-full bg-neutral-100 text-xs flex items-center justify-center">
                      +{selectedEvent.studentCount - 5}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline">View Batch</Button>
                <Button>Take Attendance</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}