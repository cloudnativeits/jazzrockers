import { useEffect } from "react";
import { PageHeader } from "@/components/ui/page-header";
import { PageBreadcrumb } from "@/components/ui/page-breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Book, Calendar, Clock, Users, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";

export default function StudentCourses() {
  const { toast } = useToast();

  // Get student courses
  const { 
    data: courses,
    error: coursesError,
    isLoading: coursesLoading
  } = useQuery<any[]>({
    queryKey: ["student-courses"],
    queryFn: async () => {
      const response = await fetch("/api/student/courses");
      if (!response.ok) throw new Error("Failed to fetch courses");
      return response.json();
    },
    retry: false,
  });

  // Show any errors
  useEffect(() => {
    if (coursesError) {
      toast({
        title: "Error loading courses",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  }, [coursesError, toast]);

  return (
    <AppShell>
      <div className="flex flex-col min-h-screen">
        <PageHeader 
          title="My Courses" 
          description="View all your enrolled courses"
          breadcrumbs={[
            { title: "Dashboard", href: "/student/dashboard", icon: <Book className="h-4 w-4]" /> },
            { title: "My Courses", icon: <BookOpen className="h-4 w-4" /> }
          ]}
        />
        
        <div className="flex-1 space-y-4 p-6 pt-2">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coursesLoading ? (
              Array(3).fill(0).map((_, index) => (
                <Card key={index} className="overflow-hidden">
                  <Skeleton className="h-44 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4 mb-2" />
                    <Skeleton className="h-8 w-full mt-4" />
                  </CardContent>
                </Card>
              ))
            ) : courses && courses.length > 0 ? (
              courses.map((course, index) => (
                <Card key={index} className="overflow-hidden">
                  <div className="h-44 bg-primary/10 relative flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-primary/60" />
                    {course.category && (
                      <Badge className="absolute top-3 right-3">
                        {course.category || "Music"}
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <CardTitle>{course.name || "Guitar Fundamentals"}</CardTitle>
                    <div className="text-sm text-muted-foreground">
                      Teacher: {course.teacherName || "John Doe"}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm">
                        <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{course.schedule || "Mon, Wed - 4:30 PM to 6:00 PM"}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{course.duration || "12 weeks"} • {course.progress || "Week 5"}</span>
                      </div>
                    </div>
                    {/* <Button className="w-full">View Details</Button> */}
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center h-60 text-center">
                <Book className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses enrolled</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  You are not enrolled in any courses yet
                </p>
                <Button>Browse Available Courses</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}