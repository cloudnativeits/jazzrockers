import { useQuery } from "@tanstack/react-query";
import { ChartCard } from "@/components/ui/chart-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, MapPin } from "lucide-react";
import { format } from "date-fns";

interface TodaysClassesProps {
  className?: string;
}

interface ClassInfo {
  batchName: string;
  courseCategory: string;
  startTime: string;
  endTime: string;
  location: string;
  teacherName: string;
  studentCount: number;
}

export function TodaysClasses({ className }: TodaysClassesProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/dashboard/today-classes"],
  });

  if (isLoading) {
    return (
      <ChartCard 
        title="Today's Classes" 
        actions={
          <Button variant="link" size="sm">View All</Button>
        }
        className={className}
      >
        <div className="animate-pulse space-y-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="p-4 border border-neutral-200 rounded-md">
              <div className="flex justify-between items-start mb-2">
                <div className="h-5 w-40 bg-neutral-200 rounded"></div>
                <div className="h-5 w-16 bg-neutral-200 rounded"></div>
              </div>
              <div className="flex justify-between my-2">
                <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                <div className="h-4 w-20 bg-neutral-200 rounded"></div>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex items-center">
                  <div className="h-6 w-6 bg-neutral-200 rounded-full mr-2"></div>
                  <div className="h-4 w-24 bg-neutral-200 rounded"></div>
                </div>
                <div className="h-4 w-16 bg-neutral-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </ChartCard>
    );
  }

  if (error) {
    return (
      <ChartCard 
        title="Today's Classes" 
        actions={
          <Button variant="link" size="sm">View All</Button>
        }
        className={className}
      >
        <div className="p-4 text-red-500">
          Error loading today's classes: {error.message}
        </div>
      </ChartCard>
    );
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'music':
        return category === 'music' ? "bg-blue-100 text-blue-800" : "bg-blue-100 text-blue-800";
      case 'dance':
        return "bg-orange-100 text-orange-800";
      case 'art':
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return format(date, 'h:mm a');
  };

  const getTeacherInitials = (name: string): string => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <ChartCard 
      title="Today's Classes" 
      actions={
        <Button variant="link" size="sm">View All</Button>
      }
      className={className}
    >
      <div className="space-y-4">
        {data && data.map((classInfo: ClassInfo, index: number) => (
          <div key={index} className="p-4 border border-neutral-200 rounded-md hover:border-neutral-300 transition-colors">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-neutral-900">{classInfo.batchName}</h4>
              <Badge 
                variant="outline"
                className={getCategoryBadgeColor(classInfo.courseCategory)}
              >
                {classInfo.courseCategory}
              </Badge>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <div className="text-neutral-600">
                <Clock className="h-4 w-4 inline mr-1" />
                {formatTime(classInfo.startTime)} - {formatTime(classInfo.endTime)}
              </div>
              <div className="text-neutral-600">
                <MapPin className="h-4 w-4 inline mr-1" />
                {classInfo.location}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-6 w-6 rounded-full bg-neutral-200 mr-2">
                  <AvatarFallback className="text-neutral-600 text-xs">
                    {getTeacherInitials(classInfo.teacherName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-neutral-700">{classInfo.teacherName}</span>
              </div>
              <span className="text-xs text-neutral-500">{classInfo.studentCount} students</span>
            </div>
          </div>
        ))}
      </div>
    </ChartCard>
  );
}
