import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  BookOpen,
  CalendarDays,
  Music,
  UserCheck,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { getInitials } from "@/lib/utils";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);

  // Hardcoded active classes
  const activeClasses = [
    {
      id: 1,
      batch: "Guitar",
      time: "05:00 PM - 06:00 PM",
      room: "103",
      students: 12,
      status: "ongoing"
    },
    // {
    //   id: 2,
    //   batch: "Music Theory - Batch MT01",
    //   time: "2:00 PM - 3:30 PM",
    //   room: "Room 102",
    //   students: 12,
    //   status: "upcoming"
    // },
    // {
    //   id: 3,
    //   batch: "Guitar Advanced - Batch G03",
    //   time: "4:00 PM - 5:30 PM",
    //   room: "Studio 2",
    //   students: 6,
    //   status: "upcoming"
    // }
  ];

  const { data: batches = [] } = useQuery({
    queryKey: ["/api/batches/teacher", user?.id],
    enabled: !!user,
  });

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/enrollments/batch", selectedBatch],
    enabled: !!selectedBatch,
  });

  // Weekly schedule data (mock data for demonstration)
  const weeklySchedule = [
    {
      day: "Monday",
      classes: [
        { time: "10:00 AM - 11:30 AM", batch: "Piano Basics - Batch P01", room: "Room 103", students: 12 },
        { time: "3:00 PM - 4:30 PM", batch: "Guitar Advanced - Batch G03", room: "Room 105", students: 8 }
      ]
    },
    {
      day: "Tuesday",
      classes: [
        { time: "11:00 AM - 12:30 PM", batch: "Piano Intermediate - Batch P02", room: "Room 103", students: 10 },
        { time: "4:00 PM - 5:30 PM", batch: "Drums Beginner - Batch D01", room: "Room 107", students: 6 }
      ]
    },
    {
      day: "Wednesday",
      classes: [
        { time: "10:00 AM - 11:30 AM", batch: "Piano Basics - Batch P01", room: "Room 103", students: 12 },
        { time: "2:00 PM - 3:30 PM", batch: "Piano Advanced - Batch P03", room: "Room 103", students: 7 }
      ]
    },
    {
      day: "Thursday",
      classes: [
        { time: "11:00 AM - 12:30 PM", batch: "Piano Intermediate - Batch P02", room: "Room 103", students: 10 },
        { time: "4:00 PM - 5:30 PM", batch: "Drums Beginner - Batch D01", room: "Room 107", students: 6 }
      ]
    },
    {
      day: "Friday",
      classes: [
        { time: "10:00 AM - 11:30 AM", batch: "Piano Basics - Batch P01", room: "Room 103", students: 12 },
        { time: "3:00 PM - 4:30 PM", batch: "Guitar Advanced - Batch G03", room: "Room 105", students: 8 }
      ]
    },
    {
      day: "Saturday",
      classes: [
        { time: "10:00 AM - 12:00 PM", batch: "Piano Workshop", room: "Hall 1", students: 15 },
        { time: "2:00 PM - 3:30 PM", batch: "Piano Advanced - Batch P03", room: "Room 103", students: 7 }
      ]
    },
    {
      day: "Sunday",
      classes: []
    }
  ];

  // Recent attendance data (mock data for demonstration)
  const recentAttendance = [
    { 
      date: "2023-07-21", 
      batch: "Piano Basics - Batch P01", 
      total: 12, 
      present: 10, 
      absent: 1, 
      late: 1 
    },
    { 
      date: "2023-07-20", 
      batch: "Piano Intermediate - Batch P02", 
      total: 10, 
      present: 9, 
      absent: 0, 
      late: 1 
    },
    { 
      date: "2023-07-19", 
      batch: "Piano Basics - Batch P01", 
      total: 12, 
      present: 11, 
      absent: 1, 
      late: 0 
    },
    { 
      date: "2023-07-18", 
      batch: "Piano Intermediate - Batch P02", 
      total: 10, 
      present: 8, 
      absent: 2, 
      late: 0 
    },
    { 
      date: "2023-07-17", 
      batch: "Piano Basics - Batch P01", 
      total: 12, 
      present: 10, 
      absent: 0, 
      late: 2 
    }
  ];

  // Filter today's schedule based on current day
  let todaySchedule: any[] = [];
  try {
    const todayDay = format(new Date(), "EEEE");
    todaySchedule = weeklySchedule.find(day => day.day === todayDay)?.classes || [];
  } catch (error) {
    console.error("Error formatting date:", error);
  }

  return (
    <AppShell>
      <div className="container py-6">
        <PageHeader 
          heading="Teacher Dashboard" 
          subheading="Welcome back! Here's an overview of your classes."
        />

        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">My Batches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{batches.length}</div>
              <p className="text-xs text-muted-foreground">Active batches</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Today's Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{1}</div>
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {12}
              </div>
              <p className="text-xs text-muted-foreground">Across all batches</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-4">Active Classes</h2>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeClasses.length}</div>
              <p className="text-xs text-muted-foreground">Classes scheduled for today</p>
              <div className="mt-4 space-y-3">
                {activeClasses.map((class_) => (
                  <div key={class_.id} className="flex items-start space-x-3 text-sm">
                    <div className={`w-2 h-2 mt-1.5 rounded-full ${
                      class_.status === "ongoing" ? "bg-green-500" : "bg-blue-500"
                    }`} />
                    <div>
                      <div className="font-medium">{class_.batch}</div>
                      <div className="text-muted-foreground">
                        <span className="inline-flex items-center">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {class_.time}
                        </span>
                        <span className="inline-flex items-center ml-3">
                          <MapPin className="w-3.5 h-3.5 mr-1" />
                          {class_.room}
                        </span>
                        <span className="inline-flex items-center ml-3">
                          <Users className="w-3.5 h-3.5 mr-1" />
                          {class_.students} students
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}