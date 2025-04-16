import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Clock, ChevronLeft, ChevronRight, Home, Search, X } from "lucide-react";
import { format, isSameDay } from "date-fns";
import { useAuth } from "@/hooks/use-auth";

export default function ParentCalendar() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<"day" | "week" | "month">("month");
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [eventType, setEventType] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data
  const students = [
    { id: "all", name: "All Children" },
    { id: "1", name: "Riya Sharma" },
    { id: "2", name: "Arjun Sharma" }
  ];

  // Mock event categories
  const eventCategories = [
    { id: "all", name: "All Events", color: "bg-gray-500" },
    { id: "class", name: "Regular Classes", color: "bg-blue-500" },
    { id: "exam", name: "Exams", color: "bg-red-500" },
    { id: "performance", name: "Performances", color: "bg-purple-500" },
    { id: "holiday", name: "Holidays", color: "bg-green-500" }
  ];

  // Mock events data
  const events = [
    {
      id: 1,
      title: "Guitar Class",
      date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 15, 0),
      endTime: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 16, 30),
      type: "class",
      location: "Studio 3",
      teacher: "John Smith",
      student: "1", // Riya
      description: "Regular weekly guitar class"
    },
    {
      id: 2,
      title: "Piano Exam",
      date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 3, 10, 0),
      endTime: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 3, 12, 0),
      type: "exam",
      location: "Auditorium",
      teacher: "Maria Rodriguez",
      student: "2", // Arjun
      description: "End of term examination"
    },
    {
      id: 3,
      title: "Annual Recital",
      date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 7, 18, 0),
      endTime: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 7, 20, 0),
      type: "performance",
      location: "Main Hall",
      teacher: "Multiple",
      student: "all", // All children
      description: "Year-end performance showcase"
    },
    {
      id: 4,
      title: "Diwali Holiday",
      date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 14, 0, 0),
      endTime: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 14, 23, 59),
      type: "holiday",
      location: "All Branches",
      teacher: "",
      student: "all",
      description: "School closed for Diwali"
    },
    {
      id: 5,
      title: "Violin Lesson",
      date: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2, 16, 0),
      endTime: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2, 17, 0),
      type: "class",
      location: "Studio 2",
      teacher: "Sarah Wilson",
      student: "2", // Arjun
      description: "Regular weekly violin lesson"
    }
  ];

  // Get color for event type
  const getEventColor = (type: string) => {
    const category = eventCategories.find(cat => cat.id === type);
    return category ? category.color : "bg-gray-500";
  };

  // Filter events based on selected student and event type
  const filteredEvents = events.filter(event => {
    const matchesStudent = selectedStudent === "all" || event.student === "all" || event.student === selectedStudent;
    const matchesType = eventType === "all" || event.type === eventType;
    const matchesSearch = !searchQuery || 
                         event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStudent && matchesType && matchesSearch;
  });

  // Get days for month view
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
    return filteredEvents.filter(event => 
      isSameDay(new Date(event.date), day)
    );
  };

  // Format time as "10:00 AM"
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  // Format day as "Mon", "Tue", etc.
  const formatDayName = (day: Date) => {
    return format(day, 'EEE');
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
      href: "/parent/dashboard",
      icon: <Home className="h-4 w-4" />
    },
    {
      title: "Calendar"
    }
  ];

  return (
    <AppShell>
      <PageHeader 
        title="Calendar"
        description={`View ${selectedStudent === "all" ? "all children's" : students.find(s => s.id === selectedStudent)?.name + "'s"} classes and events`}
        breadcrumbs={breadcrumbs}
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex flex-col sm:flex-row gap-4">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={eventType} onValueChange={setEventType}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Event type" />
            </SelectTrigger>
            <SelectContent>
              {eventCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${category.color} mr-2`}></div>
                    {category.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search events..." 
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
          </div>
        </div>

        <div className="flex-shrink-0">
          <Tabs defaultValue="month" className="w-[230px]" onValueChange={(value) => setView(value as "day" | "week" | "month")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
            </TabsList>
            <TabsContent value="day"></TabsContent>
            <TabsContent value="week"></TabsContent>
            <TabsContent value="month"></TabsContent>
          </Tabs>
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDate(new Date())}
                >
                  Today
                </Button>
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
                            {eventsForDay.length} {eventsForDay.length === 1 ? 'event' : 'events'}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="space-y-1 overflow-y-auto max-h-[80px]">
                        {eventsForDay.slice(0, 3).map((event) => {
                          // Find the student name
                          const studentName = event.student === "all" 
                            ? "All Children" 
                            : students.find(s => s.id === event.student)?.name.split(' ')[0] || '';
                          
                          return (
                            <div
                              key={event.id}
                              className={`text-xs p-1 rounded truncate ${getEventColor(event.type)} bg-opacity-20 border-l-2 ${getEventColor(event.type)}`}
                            >
                              <div className="font-medium truncate">{event.title}</div>
                              <div className="text-gray-600 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTime(event.date)}
                                {studentName !== "All Children" && (
                                  <span className="ml-1">• {studentName}</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {eventsForDay.length > 3 && (
                          <div className="text-xs text-blue-600 font-medium">
                            + {eventsForDay.length - 3} more
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
                            
                            const studentName = event.student === "all" 
                              ? "All Children" 
                              : students.find(s => s.id === event.student)?.name.split(' ')[0] || '';
                            
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
                                    {studentName !== "All Children" && (
                                      <div className="truncate">{studentName}</div>
                                    )}
                                    {event.location && (
                                      <div className="truncate">{event.location}</div>
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
                    
                    const studentName = event.student === "all" 
                      ? "All Children" 
                      : students.find(s => s.id === event.student)?.name.split(' ')[0] || '';
                    
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
                            {studentName !== "All Children" && (
                              <div className="flex items-center truncate">
                                <Badge variant="outline" className="mr-2">Student</Badge>
                                {studentName}
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center truncate">
                                <Badge variant="outline" className="mr-2">Location</Badge>
                                {event.location}
                              </div>
                            )}
                            {event.teacher && (
                              <div className="flex items-center truncate">
                                <Badge variant="outline" className="mr-2">Teacher</Badge>
                                {event.teacher}
                              </div>
                            )}
                            {event.description && (
                              <div className="flex items-start mt-1">
                                <Badge variant="outline" className="mr-2 mt-0.5">Notes</Badge>
                                <span className="flex-1">{event.description}</span>
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