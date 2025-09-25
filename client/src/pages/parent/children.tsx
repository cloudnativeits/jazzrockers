import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Separator } from "@/components/ui/separator";
import { 
  Home, 
  User, 
  Calendar, 
  Music2, 
  BookOpen, 
  Trophy, 
  Clock, 
  Star,
  ArrowRight,
  BarChart,
  Disc3,
  Heart,
  CheckCircle,
  XCircle
} from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { FixedFooter } from "@/components/layout/footer";
import { useAuth } from "@/hooks/use-auth";

export default function ParentChildren() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  
  const { data: children = [], isLoading: isLoadingChildren } = useQuery({
    queryKey: ['/api/students-with-parents'],
    queryFn: async () => {
      const response = await fetch('/api/students-with-parents');
      if (!response.ok) {
        throw new Error('Failed to fetch children');
      }
      return response.json();
    }
  });

  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/students/course'],
    queryFn: async () => {
      const response = await fetch('/api/students/course');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      return response.json();
    }
  });

  // const { data: courseCount = [], isLoading: isLoadingCourseCount } = useQuery({
  //   queryKey: ['/api/students/course-count'],
  //   queryFn: async () => {
  //     const response = await fetch('/api/students/course-count');
  //     if (!response.ok) {
  //       throw new Error('Failed to fetch course count');
  //     }
  //     return response.json();
  //   }
  // });

  // Format the time
  const formatClassTime = (date: Date) => {
    return format(date, "EEEE, MMMM d, h:mm a");
  };

  // Get initials for avatar
  const getInitials = (firstName = '', lastName = '') => {
    const firstInitial = firstName ? firstName[0] : '';
    const lastInitial = lastName ? lastName[0] : '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  // Define breadcrumbs for the page
  const breadcrumbs = [
    {
      title: "Home",
      href: "/parent/dashboard",
      icon: <Home className="h-4 w-4" />
    },
    {
      title: "Children"
    }
  ];

  return (
    <AppShell>
      <PageHeader 
        title="My Students"
        description="Manage your children's profiles and monitor their progress"
        breadcrumbs={breadcrumbs}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {children.map((child: any) => (
          <Card key={child.studentIds} className="flex flex-col overflow-hidden">
            <CardHeader className="pb-0 pt-6">
              <div className="flex items-center">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                    {getInitials(child.studentFirstName, child.studentLastName)}
                  </AvatarFallback>
                  {child.avatarUrl && (
                    <AvatarImage
                      src={child.avatarUrl}
                      alt={`${child.studentFirstName} ${child.studentLastName}`}
                    />
                  )}
                </Avatar>
                <div>
                  <CardTitle className="text-xl">
                    {child.studentFirstName} {child.studentMiddleName} {child.studentLastName}
                  </CardTitle>
                  <CardDescription className="mt-1 font-semibold">
                    {child.studentId} • {child.studentAge} years old
                    {/* You can add course count here if needed */}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 flex-grow">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Enrolled Courses</h4>
                  <div className="space-y-2">
                    <div>
                      {(() => {
                        const matchedStudent = courses.find(
                          (entry: any) => entry.studentId === child.studentIds
                        );
                        const enrolledCourses = matchedStudent?.courses ?? [];

                        return enrolledCourses.length > 0 ? (
                          enrolledCourses.map((course: any, index: number) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-muted rounded-lg"
                            >
                              <div className="flex items-center">
                                <Music2 className="h-5 w-5 mr-2 text-primary" />
                                <div>
                                  <div className="font-medium">{course.courseName}</div>
                                  <div className="text-xs text-gray-500">{course.batchName}</div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-sm text-muted-foreground">No courses enrolled.</div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="border-t bg-muted/50 pt-4">
              <Button className="w-full" variant="outline" asChild>
                <a href={`#child-${child.studentId}`} onClick={() => setActiveTab("overview")}>
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {children.map((child: any) => (
        <div key={child.studentId} id={`child-${child.studentId}`} className="mb-10">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(child.studentFirstName, child.studentLastName)}
                    </AvatarFallback>
                    {child.avatarUrl && <AvatarImage src={child.avatarUrl} alt={child.studentFirstName} />}
                  </Avatar>
                  <CardTitle>{child.studentFirstName} {child.studentMiddleName} {child.studentLastName}'s Progress</CardTitle>
                </div>
                
                <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto md:mt-0 mt-4">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="overview">
                      <BarChart className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    {/* <TabsTrigger value="assignments">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Assignments
                    </TabsTrigger>
                    <TabsTrigger value="notes">
                      <Star className="h-4 w-4 mr-2" />
                      Teacher Notes
                    </TabsTrigger> */}
                  </TabsList>
                  <TabsContent value="overview"></TabsContent>
                  <TabsContent value="assignments"></TabsContent>
                  <TabsContent value="notes"></TabsContent>
                </Tabs>
              </div>
            </CardHeader>
            
            <CardContent>
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Attendance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          {/* <div className="text-2xl font-bold">{child.performance.attendance}%</div> */}
                          <div className="ml-auto p-2 bg-green-100 rounded-full">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Participation</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          {/* <div className="text-2xl font-bold">{child.performance.participation}%</div> */}
                          <div className="ml-auto p-2 bg-blue-100 rounded-full">
                            <Heart className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Progress</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          {/* <div className="text-2xl font-bold">{child.performance.progress}%</div> */}
                          <div className="ml-auto p-2 bg-purple-100 rounded-full">
                            <BarChart className="h-5 w-5 text-purple-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="py-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Achievements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center">
                          {/* <div className="text-2xl font-bold">{child.performance.recentAchievements}</div> */}
                          <div className="ml-auto p-2 bg-yellow-100 rounded-full">
                            <Trophy className="h-5 w-5 text-yellow-600" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3">Enrolled Courses</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* {child.courses.map((course) => (
                        <Card key={course.id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="flex items-center">
                              {course.name === "Guitar Lessons" && <Disc3 className="h-5 w-5 mr-2 text-amber-500" />}
                              {course.name === "Piano Basics" && <Music2 className="h-5 w-5 mr-2 text-blue-500" />}
                              {course.name === "Violin Lessons" && <Music2 className="h-5 w-5 mr-2 text-purple-500" />}
                              {course.name}
                            </CardTitle>
                            <CardDescription>
                              {course.level} • Taught by {course.teacher}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-500">Course Progress</span>
                                <span className="text-sm font-medium">{course.progress}%</span>
                              </div>
                              <Progress value={course.progress} className="h-2" />
                            </div>
                            
                            <div className="text-sm space-y-1">
                              <div className="font-medium">Next Class</div>
                              <div className="flex items-center text-gray-500">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatClassTime(course.nextClass)}
                              </div>
                            </div>
                            
                            {course.achievements.length > 0 && (
                              <div className="space-y-2">
                                <div className="font-medium text-sm">Recent Achievements</div>
                                <div className="flex flex-wrap gap-2">
                                  {course.achievements.map((achievement) => (
                                    <Badge key={achievement.id} variant="outline" className="bg-yellow-100 text-yellow-800 flex items-center">
                                      {achievement.icon}
                                      <span className="ml-1">{achievement.name}</span>
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="pt-2">
                              <Button variant="outline" size="sm">View Course Details</Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))} */}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === "assignments" && (
                <div className="space-y-6">
                  <div className="rounded-lg border">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-lg font-semibold">Current Assignments</h3>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">
                        {child.courses.flatMap((c: any) => c.assignments).filter((a: any) => !a.completed).length} Pending
                      </Badge>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="p-4">
                        {child.courses.flatMap((course: any) => 
                          course.assignments
                            .filter((assignment: any) => !assignment.completed)
                            .map((assignment: any) => (
                              <div key={assignment.id} className="flex items-start p-3 border-b last:border-0">
                                <div className="p-2 rounded-full bg-blue-100 mr-3">
                                  <Clock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">{assignment.name}</div>
                                      <div className="text-sm text-gray-500">
                                        {course.name} • Due {format(assignment.dueDate, 'MMM d, yyyy')}
                                      </div>
                                    </div>
                                    <Button variant="outline" size="sm">View</Button>
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                        {child.courses.flatMap((c: any) => c.assignments).filter((a: any) => !a.completed).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No pending assignments at the moment</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                  
                  <div className="rounded-lg border">
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-lg font-semibold">Completed Assignments</h3>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {child.courses.flatMap((c: any) => c.assignments).filter((a: any) => a.completed).length} Completed
                      </Badge>
                    </div>
                    <ScrollArea className="h-[200px]">
                      <div className="p-4">
                        {child.courses.flatMap((course: any) => 
                          course.assignments
                            .filter((assignment: any) => assignment.completed)
                            .map((assignment: any) => (
                              <div key={assignment.id} className="flex items-start p-3 border-b last:border-0">
                                <div className="p-2 rounded-full bg-green-100 mr-3">
                                  <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="font-medium">{assignment.name}</div>
                                      <div className="text-sm text-gray-500">
                                        {course.name} • Completed
                                      </div>
                                    </div>
                                    <Button variant="outline" size="sm">View</Button>
                                  </div>
                                </div>
                              </div>
                            ))
                        )}
                        {child.courses.flatMap((c: any) => c.assignments).filter((a: any) => a.completed).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No completed assignments yet</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
              
              {activeTab === "notes" && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Teacher Feedback & Notes</h3>
                  <div className="rounded-lg border">
                    <ScrollArea className="h-[400px]">
                      <div className="p-4 space-y-3">
                        {child.courses.map((course: any) => (
                          <div key={course.id} className="space-y-3">
                            <h4 className="font-medium flex items-center">
                              <Music2 className="h-4 w-4 mr-2" />
                              {course.name}
                            </h4>
                            
                            {course.notes.map((note: any) => (
                              <div key={note.id} className="ml-6 p-3 bg-muted rounded-lg">
                                <div className="text-sm text-gray-500 mb-1">
                                  {format(note.date, 'MMMM d, yyyy')}
                                </div>
                                <p>{note.text}</p>
                              </div>
                            ))}
                            
                            <Separator className="my-4" />
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ))}
      <FixedFooter user={user} />
    </AppShell>
  );
}