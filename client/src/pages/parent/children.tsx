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

export default function ParentChildren() {
  const [activeTab, setActiveTab] = useState("overview");
  
  // Mock data
  const children = [
    {
      id: 1,
      name: "Riya Sharma",
      age: 12,
      avatarUrl: "",
      courses: [
        {
          id: 1,
          name: "Guitar Lessons",
          level: "Intermediate",
          teacher: "John Smith",
          progress: 75,
          nextClass: new Date(2023, 9, 12, 16, 0),
          achievements: [
            { id: 1, name: "Chord Mastery", date: new Date(2023, 8, 15), icon: <Music2 className="h-4 w-4" /> },
            { id: 2, name: "First Recital", date: new Date(2023, 7, 22), icon: <Trophy className="h-4 w-4" /> }
          ],
          assignments: [
            { id: 1, name: "Practice G Major Scale", dueDate: new Date(2023, 9, 15), completed: true },
            { id: 2, name: "Master 'Wonderful Tonight'", dueDate: new Date(2023, 9, 20), completed: false }
          ],
          notes: [
            { id: 1, date: new Date(2023, 9, 5), text: "Riya has made excellent progress with chord transitions." },
            { id: 2, date: new Date(2023, 9, 2), text: "Working on fingerpicking technique for the upcoming recital." }
          ]
        }
      ],
      performance: {
        attendance: 92,
        participation: 85,
        progress: 78,
        recentAchievements: 2
      }
    },
    {
      id: 2,
      name: "Arjun Sharma",
      age: 10,
      avatarUrl: "",
      courses: [
        {
          id: 2,
          name: "Piano Basics",
          level: "Beginner",
          teacher: "Maria Rodriguez",
          progress: 65,
          nextClass: new Date(2023, 9, 13, 17, 0),
          achievements: [
            { id: 3, name: "Note Reading", date: new Date(2023, 8, 10), icon: <BookOpen className="h-4 w-4" /> }
          ],
          assignments: [
            { id: 3, name: "Practice C Major Scale", dueDate: new Date(2023, 9, 14), completed: true },
            { id: 4, name: "Learn 'Twinkle Twinkle'", dueDate: new Date(2023, 9, 21), completed: false }
          ],
          notes: [
            { id: 3, date: new Date(2023, 9, 6), text: "Arjun is showing great progress with basic note reading." },
            { id: 4, date: new Date(2023, 9, 3), text: "Needs to work on proper hand positioning." }
          ]
        },
        {
          id: 3,
          name: "Violin Lessons",
          level: "Beginner",
          teacher: "Sarah Wilson",
          progress: 40,
          nextClass: new Date(2023, 9, 14, 16, 0),
          achievements: [],
          assignments: [
            { id: 5, name: "Bow Control Exercise", dueDate: new Date(2023, 9, 16), completed: false }
          ],
          notes: [
            { id: 5, date: new Date(2023, 9, 7), text: "Arjun has started learning basic bow control." }
          ]
        }
      ],
      performance: {
        attendance: 96,
        participation: 80,
        progress: 62,
        recentAchievements: 1
      }
    }
  ];

  // Format the time
  const formatClassTime = (date: Date) => {
    return format(date, "EEEE, MMMM d, h:mm a");
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('');
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
        title="My Children"
        description="Manage your children's profiles and monitor their progress"
        breadcrumbs={breadcrumbs}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {children.map((child) => (
          <Card key={child.id} className="flex flex-col overflow-hidden">
            <CardHeader className="pb-0 pt-6">
              <div className="flex items-center">
                <Avatar className="h-16 w-16 mr-4">
                  <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                    {getInitials(child.name)}
                  </AvatarFallback>
                  {child.avatarUrl && <AvatarImage src={child.avatarUrl} alt={child.name} />}
                </Avatar>
                <div>
                  <CardTitle className="text-xl">{child.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {child.age} years old • {child.courses.length} {child.courses.length === 1 ? 'course' : 'courses'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4 flex-grow">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Attendance</span>
                    <div className="flex items-center mt-1">
                      <Progress value={child.performance.attendance} className="h-2 flex-grow" />
                      <span className="ml-2 text-sm font-medium">{child.performance.attendance}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-gray-500">Overall Progress</span>
                    <div className="flex items-center mt-1">
                      <Progress value={child.performance.progress} className="h-2 flex-grow" />
                      <span className="ml-2 text-sm font-medium">{child.performance.progress}%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Enrolled Courses</h4>
                  <div className="space-y-2">
                    {child.courses.map((course) => (
                      <div key={course.id} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                        <div className="flex items-center">
                          <Music2 className="h-5 w-5 mr-2 text-primary" />
                          <div>
                            <div className="font-medium">{course.name}</div>
                            <div className="text-xs text-gray-500">
                              {course.level} • {course.teacher}
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-primary/10">
                          {course.progress}% Complete
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {child.courses.some(course => course.achievements.length > 0) && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Recent Achievements</h4>
                    <div className="flex flex-wrap gap-2">
                      {child.courses.flatMap(course => 
                        course.achievements.slice(0, 2).map(achievement => (
                          <Badge key={achievement.id} variant="outline" className="bg-yellow-100 text-yellow-800 flex items-center">
                            <Trophy className="h-3 w-3 mr-1" />
                            {achievement.name}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t bg-muted/50 pt-4">
              <Button className="w-full" variant="outline" asChild>
                <a href={`#child-${child.id}`} onClick={() => setActiveTab("overview")}>
                  View Details
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {children.map((child) => (
        <div key={child.id} id={`child-${child.id}`} className="mb-10">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-4">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getInitials(child.name)}
                    </AvatarFallback>
                    {child.avatarUrl && <AvatarImage src={child.avatarUrl} alt={child.name} />}
                  </Avatar>
                  <CardTitle>{child.name}'s Progress</CardTitle>
                </div>
                
                <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto md:mt-0 mt-4">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">
                      <BarChart className="h-4 w-4 mr-2" />
                      Overview
                    </TabsTrigger>
                    <TabsTrigger value="assignments">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Assignments
                    </TabsTrigger>
                    <TabsTrigger value="notes">
                      <Star className="h-4 w-4 mr-2" />
                      Teacher Notes
                    </TabsTrigger>
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
                          <div className="text-2xl font-bold">{child.performance.attendance}%</div>
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
                          <div className="text-2xl font-bold">{child.performance.participation}%</div>
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
                          <div className="text-2xl font-bold">{child.performance.progress}%</div>
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
                          <div className="text-2xl font-bold">{child.performance.recentAchievements}</div>
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
                      {child.courses.map((course) => (
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
                      ))}
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
                        {child.courses.flatMap(c => c.assignments).filter(a => !a.completed).length} Pending
                      </Badge>
                    </div>
                    <ScrollArea className="h-[300px]">
                      <div className="p-4">
                        {child.courses.flatMap(course => 
                          course.assignments
                            .filter(assignment => !assignment.completed)
                            .map(assignment => (
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
                        {child.courses.flatMap(c => c.assignments).filter(a => !a.completed).length === 0 && (
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
                        {child.courses.flatMap(c => c.assignments).filter(a => a.completed).length} Completed
                      </Badge>
                    </div>
                    <ScrollArea className="h-[200px]">
                      <div className="p-4">
                        {child.courses.flatMap(course => 
                          course.assignments
                            .filter(assignment => assignment.completed)
                            .map(assignment => (
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
                        {child.courses.flatMap(c => c.assignments).filter(a => a.completed).length === 0 && (
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
                        {child.courses.map(course => (
                          <div key={course.id} className="space-y-3">
                            <h4 className="font-medium flex items-center">
                              <Music2 className="h-4 w-4 mr-2" />
                              {course.name}
                            </h4>
                            
                            {course.notes.map(note => (
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
    </AppShell>
  );
}