import { ChangePasswordForm } from "@/components/change-password-form";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CalendarClock, Building, Phone, Mail, User } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  return (
    <div className="container py-10 pl-20">
      <h1 className="text-3xl font-bold mb-6 pl-10">My Profile</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="flex flex-col items-center">
              <Avatar className="h-24 w-24 mb-4">
                {user.profilePicture ? (
                  <AvatarImage src={user.profilePicture} alt={user.fullName} />
                ) : null}
                <AvatarFallback className="text-xl">{getInitials(user.fullName)}</AvatarFallback>
              </Avatar>
              <CardTitle className="text-xl text-center">{user.fullName}</CardTitle>
              <div className="text-sm text-muted-foreground capitalize">{user.role}</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span>{user.username}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <span>{user.address}</span>
                  </div>
                )}
                {user.branch && (
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-muted-foreground" />
                    <span>Branch: {user.branch}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-2">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}