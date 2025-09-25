import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Home, 
  Calendar,
  Book,
  Music2,
  Medal,
  Clock,
  CheckCircle,
  Trophy,
  UserCircle,
  School,
  MapPin,
  Phone,
  Mail,
  FileEdit
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function StudentProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  
  // Mock student data
  const student = {
    id: "STU10001",
    name: user?.fullName || "Yatheen Kumar",
    photo: "/avatars/student1.png",
    dob: "10/15/2010",
    gender: "Male",
    email: user?.email || "yatheen@gmail.com",
    phone: "9876543210",
    address: "42 Music Street, Chennai, Tamil Nadu 600001",
    school: "City Public School",
    grade: "8",
    joinDate: "June 5, 2022",
    branch: "T. Nagar Branch"
  };
  
  // Mock courses data
  const courses = [
    {
      id: 1,
      name: "Guitar Lessons",
      teacher: "John Smith",
      level: "Intermediate",
      progress: 68,
      startDate: "August 10, 2022",
      nextClass: "Wednesday, 4:00 PM",
      attendance: "92%"
    },
    {
      id: 2,
      name: "Music Theory",
      teacher: "Sarah Wilson",
      level: "Beginner",
      progress: 45,
      startDate: "September 15, 2022",
      nextClass: "Friday, 5:00 PM",
      attendance: "88%"
    }
  ];
  
  // Mock achievements data
  const achievements = [
    {
      id: 1,
      title: "First Recital",
      type: "Performance",
      date: "November 15, 2022",
      description: "Successfully performed 'Scarborough Fair' at the school concert"
    },
    {
      id: 2,
      title: "Music Theory Level 1",
      type: "Certification",
      date: "December 20, 2022",
      description: "Passed the Music Theory Level 1 examination with distinction"
    },
    {
      id: 3,
      title: "3-Month Practice Streak",
      type: "Milestone",
      date: "February 1, 2023",
      description: "Consistently practiced for at least 30 minutes daily for 3 months"
    }
  ];
  
  // Define breadcrumbs for the page
  const breadcrumbs = [
    {
      title: "Home",
      href: "/student/dashboard",
      icon: <Home className="h-4 w-4" />
    },
    {
      title: "Profile"
    }
  ];

  return (
    <AppShell>
      <PageHeader 
        title="Student Profile" 
        description="View and manage your personal information and course progress"
        breadcrumbs={breadcrumbs}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Student information card */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                <AvatarImage src={student.photo} />
              </Avatar>
              <h2 className="text-xl font-bold">{student.name}</h2>
              <Badge variant="outline" className="mt-2">
                Student ID: {student.id}
              </Badge>
              <div className="mt-2 text-sm text-gray-500">
                Joined on {student.joinDate}
              </div>
              <Button variant="outline" className="mt-6 w-full">
                <FileEdit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-start">
                <School className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">School</div>
                  <div className="text-sm text-gray-600">{student.school}, Grade {student.grade}</div>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Branch</div>
                  <div className="text-sm text-gray-600">{student.branch}</div>
                </div>
              </div>
              <div className="flex items-start">
                <Mail className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div className="text-sm text-gray-600">{student.email}</div>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                <div>
                  <div className="text-sm font-medium">Phone</div>
                  <div className="text-sm text-gray-600">{student.phone}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Main content tabs */}
        <div className="lg:col-span-3">
          <Card>
            <Tabs defaultValue="personal" value={activeTab} onValueChange={setActiveTab}>
              <CardHeader className="pb-0">
                <TabsList className="grid grid-cols-3 w-full md:w-auto">
                  <TabsTrigger value="personal">
                    <UserCircle className="h-4 w-4 mr-2" />
                    Personal Info
                  </TabsTrigger>
                  <TabsTrigger value="courses">
                    <Book className="h-4 w-4 mr-2" />
                    Courses
                  </TabsTrigger>
                  <TabsTrigger value="achievements">
                    <Trophy className="h-4 w-4 mr-2" />
                    Achievements
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              
              {/* Personal Information Tab */}
              <TabsContent value="personal">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Personal Details</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm font-medium text-gray-500">Full Name</div>
                          <div className="text-sm">{student.name}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm font-medium text-gray-500">Date of Birth</div>
                          <div className="text-sm">{student.dob}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm font-medium text-gray-500">Gender</div>
                          <div className="text-sm">{student.gender}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm font-medium text-gray-500">Email</div>
                          <div className="text-sm">{student.email}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm font-medium text-gray-500">Phone</div>
                          <div className="text-sm">{student.phone}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Address & School</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm font-medium text-gray-500">Address</div>
                          <div className="text-sm">{student.address}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm font-medium text-gray-500">School</div>
                          <div className="text-sm">{student.school}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm font-medium text-gray-500">Grade</div>
                          <div className="text-sm">{student.grade}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm font-medium text-gray-500">Branch</div>
                          <div className="text-sm">{student.branch}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-sm font-medium text-gray-500">Join Date</div>
                          <div className="text-sm">{student.joinDate}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button className="ml-auto">
                    <FileEdit className="h-4 w-4 mr-2" />
                    Update Information
                  </Button>
                </CardFooter>
              </TabsContent>
              
              {/* Courses Tab */}
              <TabsContent value="courses">
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {courses.map(course => (
                      <div key={course.id} className="bg-muted rounded-lg p-5">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                          <div className="flex items-center">
                            <div className="rounded-full p-2 bg-primary/10 mr-4">
                              <Music2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">{course.name}</h3>
                              <div className="text-sm text-gray-500 mt-1">Teacher: {course.teacher}</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="mt-2 md:mt-0">
                            Level: {course.level}
                          </Badge>
                        </div>
                        
                        <div className="mt-4">
                          <div className="flex items-center justify-between">
                            <div className="text-sm font-medium">Course Progress</div>
                            <div className="text-sm font-medium">{course.progress}%</div>
                          </div>
                          <Progress value={course.progress} className="h-2 mt-2" />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                          <div className="bg-white rounded-md p-3 border">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                              <div className="text-xs font-medium text-gray-500">Start Date</div>
                            </div>
                            <div className="mt-1 text-sm">{course.startDate}</div>
                          </div>
                          <div className="bg-white rounded-md p-3 border">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-gray-500 mr-2" />
                              <div className="text-xs font-medium text-gray-500">Next Class</div>
                            </div>
                            <div className="mt-1 text-sm">{course.nextClass}</div>
                          </div>
                          <div className="bg-white rounded-md p-3 border">
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 text-gray-500 mr-2" />
                              <div className="text-xs font-medium text-gray-500">Attendance</div>
                            </div>
                            <div className="mt-1 text-sm">{course.attendance}</div>
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end space-x-2">
                          <Button variant="outline" size="sm">
                            View Lessons
                          </Button>
                          <Button size="sm">
                            View Progress
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </TabsContent>
              
              {/* Achievements Tab */}
              <TabsContent value="achievements">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Your Achievements</h3>
                    <Badge variant="outline" className="font-medium">
                      {achievements.length} Total
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    {achievements.map(achievement => (
                      <div key={achievement.id} className="flex border rounded-lg p-4">
                        <div className="rounded-full p-3 bg-primary/10 mr-4">
                          <Medal className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <h4 className="font-semibold">{achievement.title}</h4>
                            <div className="flex items-center mt-1 md:mt-0">
                              <Badge variant="outline" className="mr-2">
                                {achievement.type}
                              </Badge>
                              <span className="text-xs text-gray-500">{achievement.date}</span>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-gray-600">{achievement.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                  <Button variant="outline" className="ml-auto">
                    <Trophy className="h-4 w-4 mr-2" />
                    View All Achievements
                  </Button>
                </CardFooter>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}