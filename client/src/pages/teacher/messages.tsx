import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Search, 
  Send, 
  User, 
  Users, 
  Bell, 
  MessageSquare, 
  Calendar, 
  MoreVertical,
  Clock,
  Check,
  ArrowLeft,
  Phone,
  Video,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Home,
  LayoutDashboard
} from "lucide-react";
import { format } from "date-fns";
import { cn, getInitials } from "@/lib/utils";
import { Link } from "wouter";

// Define message interfaces
interface Contact {
  id: number;
  name: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unread?: number;
  status?: "online" | "offline" | "away";
  role: "student" | "parent" | "admin" | "teacher";
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  timestamp: Date;
  read: boolean;
  attachments?: {
    id: number;
    type: "image" | "file" | "audio";
    url: string;
    name: string;
  }[];
}

export default function TeacherMessages() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);

  // Fetch contacts and messages
  const { data: contacts = [], isLoading: isLoadingContacts } = useQuery<Contact[]>({
    queryKey: ["/api/messages/contacts"],
    enabled: !!user,
    placeholderData: [
      {
        id: 1,
        name: "Rahul Sharma",
        lastMessage: "Yes, I'll check the homework today",
        lastMessageTime: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        unread: 0,
        status: "online",
        role: "parent"
      },
      {
        id: 2,
        name: "Ananya Patel",
        lastMessage: "Thank you for the feedback on my performance",
        lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        unread: 1,
        status: "offline",
        role: "student"
      },
      {
        id: 3,
        name: "Shreya Gupta",
        lastMessage: "When is the next class scheduled?",
        lastMessageTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        unread: 2,
        status: "away",
        role: "parent"
      },
      {
        id: 4,
        name: "Aditya Verma",
        lastMessage: "I'll be absent for tomorrow's class",
        lastMessageTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        unread: 0,
        status: "online",
        role: "student"
      },
      {
        id: 5,
        name: "Rajesh Kumar",
        lastMessage: "Please share the practice materials",
        lastMessageTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        unread: 0,
        status: "offline",
        role: "parent"
      }
    ]
  });

  // Fetch messages for selected contact
  const { data: messages = [], isLoading: isLoadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/messages/conversation", selectedContact?.id],
    enabled: !!selectedContact,
    placeholderData: selectedContact ? [
      {
        id: 1,
        senderId: selectedContact.id,
        receiverId: user?.id || 0,
        content: "Hello, I had a question about yesterday's class.",
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        read: true
      },
      {
        id: 2,
        senderId: user?.id || 0,
        receiverId: selectedContact.id,
        content: "Hi there! Sure, what would you like to know?",
        timestamp: new Date(Date.now() - 55 * 60 * 1000), // 55 minutes ago
        read: true
      },
      {
        id: 3,
        senderId: selectedContact.id,
        receiverId: user?.id || 0,
        content: "Could you explain the music notation we covered? My child is having trouble understanding it.",
        timestamp: new Date(Date.now() - 50 * 60 * 1000), // 50 minutes ago
        read: true
      },
      {
        id: 4,
        senderId: user?.id || 0,
        receiverId: selectedContact.id,
        content: "Absolutely! The notation we covered was for reading rhythm patterns. I'll send you some practice sheets that might help.",
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        read: true
      },
      {
        id: 5,
        senderId: user?.id || 0,
        receiverId: selectedContact.id,
        content: "Here are the practice sheets we used in class.",
        timestamp: new Date(Date.now() - 44 * 60 * 1000), // 44 minutes ago
        read: true,
        attachments: [
          {
            id: 1,
            type: "file",
            url: "#",
            name: "rhythm_practice_sheet.pdf"
          }
        ]
      },
      {
        id: 6,
        senderId: selectedContact.id,
        receiverId: user?.id || 0,
        content: "Thank you so much! This is really helpful.",
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        read: true
      },
      {
        id: 7,
        senderId: selectedContact.id,
        receiverId: user?.id || 0,
        content: "One more thing - will there be a practice test before the recital?",
        timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        read: false
      }
    ] : []
  });

  // Filter contacts based on search and selected tab
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = selectedTab === "all" || 
                      (selectedTab === "unread" && (contact.unread || 0) > 0) ||
                      (selectedTab === "students" && contact.role === "student") ||
                      (selectedTab === "parents" && contact.role === "parent");
    return matchesSearch && matchesTab;
  });

  // Format timestamp
  const formatMessageTime = (timestamp: Date) => {
    const now = new Date();
    const messageDate = new Date(timestamp);
    const diffDays = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return format(messageDate, "h:mm a"); // Today: 3:45 PM
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return format(messageDate, "EEEE"); // Day of week: Monday
    } else {
      return format(messageDate, "MMM d"); // Month day: Jan 15
    }
  };

  // Handle sending a new message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;
    
    // In a real app, you would send this to the API
    // and then refresh the messages query
    console.log("Sending message:", {
      content: newMessage,
      receiverId: selectedContact.id,
      senderId: user?.id
    });
    
    setNewMessage("");
  };

  return (
    <AppShell>
      <div className="flex items-center mb-4">
        <Link href="/teacher/dashboard">
          <Button variant="ghost" size="sm" className="mr-2">
            <LayoutDashboard className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
        </Link>
      </div>
      
      <PageHeader
        title="Messages"
        description="Communicate with students, parents, and staff"
        actions={
          <Link href="/teacher/dashboard">
            <Button variant="outline" size="sm" className="gap-1">
              <LayoutDashboard className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contacts List */}
        <div className="md:col-span-1">
          <Card className="h-[calc(100vh-12rem)] shadow-md border-neutral-200">
            <CardHeader className="pb-2 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <CardTitle>Conversations</CardTitle>
                </div>
                <Button 
                  size="sm" 
                  className="bg-primary hover:bg-primary/90 text-white shadow-sm"
                  onClick={() => setShowNewMessageDialog(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  New Message
                </Button>
              </div>
              <div className="mt-2">
                <div className="relative mb-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                  <Input
                    type="text"
                    placeholder="Search conversations..."
                    className="pl-9 w-full"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Tabs
                  defaultValue="all"
                  value={selectedTab}
                  onValueChange={setSelectedTab}
                  className="w-full"
                >
                  <TabsList className="w-full">
                    <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
                    <TabsTrigger value="unread" className="flex-1">Unread</TabsTrigger>
                    <TabsTrigger value="students" className="flex-1">Students</TabsTrigger>
                    <TabsTrigger value="parents" className="flex-1">Parents</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[calc(100vh-16rem)]">
                {isLoadingContacts ? (
                  <div className="p-4 text-center text-neutral-500">
                    Loading conversations...
                  </div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-4 text-center text-neutral-500">
                    No conversations found
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={cn(
                          "p-3 cursor-pointer hover:bg-neutral-50 transition-colors",
                          selectedContact?.id === contact.id && "bg-neutral-100"
                        )}
                        onClick={() => setSelectedContact(contact)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar>
                              <AvatarFallback>
                                {getInitials(contact.name)}
                              </AvatarFallback>
                            </Avatar>
                            {contact.status === "online" && (
                              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <span className="font-medium">{contact.name}</span>
                              <span className="text-xs text-neutral-500">
                                {contact.lastMessageTime && formatMessageTime(contact.lastMessageTime)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-neutral-500 truncate">
                                {contact.lastMessage}
                              </p>
                              {(contact.unread || 0) > 0 && (
                                <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                                  {contact.unread}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Message Content */}
        <div className="md:col-span-2">
          <Card className="h-[calc(100vh-12rem)] shadow-md border-neutral-200">
            {!selectedContact ? (
              <div className="h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-b from-neutral-50 to-white">
                <div className="bg-primary/10 p-4 rounded-full mb-4">
                  <MessageSquare className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-neutral-800">Your Messages</h3>
                <p className="max-w-md text-neutral-600">
                  Connect with students and parents through secure messaging
                </p>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg">
                  <div className="bg-white p-4 rounded-lg border border-neutral-200 flex flex-col items-center text-center">
                    <div className="bg-blue-50 p-2 rounded-full mb-2">
                      <Users className="h-5 w-5 text-blue-500" />
                    </div>
                    <h4 className="font-medium mb-1">Select Contact</h4>
                    <p className="text-sm text-neutral-500">Choose from your contacts list</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-neutral-200 flex flex-col items-center text-center">
                    <div className="bg-green-50 p-2 rounded-full mb-2">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                    </div>
                    <h4 className="font-medium mb-1">New Message</h4>
                    <p className="text-sm text-neutral-500">Start a new conversation</p>
                  </div>
                </div>
                <Button 
                  className="mt-6 bg-primary hover:bg-primary/90 text-white shadow-md"
                  onClick={() => setShowNewMessageDialog(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </div>
            ) : (
              <>
                <CardHeader className="pb-2 border-b bg-gradient-to-r from-primary/10 to-primary/5">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSelectedContact(null)}
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <Avatar className="border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(selectedContact.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {selectedContact.name}
                          {selectedContact.status === "online" && (
                            <span className="inline-block h-2 w-2 rounded-full bg-green-500 ml-1"></span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs flex items-center">
                          {selectedContact.role === "student" ? "Student" : "Parent"} • 
                          <span className="ml-1 font-medium">
                            {selectedContact.status === "online" ? "Online" : 
                             selectedContact.status === "away" ? "Away" : "Offline"}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="rounded-full h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <div className="flex flex-col h-[calc(100vh-18rem)]">
                  <ScrollArea className="flex-1 p-4">
                    {isLoadingMessages ? (
                      <div className="text-center text-neutral-500">
                        Loading messages...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center text-neutral-500">
                        No messages yet. Start the conversation!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {messages.map((message) => {
                          const isOwnMessage = message.senderId === user?.id;
                          return (
                            <div 
                              key={message.id} 
                              className={cn(
                                "flex",
                                isOwnMessage ? "justify-end" : "justify-start"
                              )}
                            >
                              <div 
                                className={cn(
                                  "max-w-[80%] rounded-lg p-3",
                                  isOwnMessage ? 
                                    "bg-primary text-primary-foreground" : 
                                    "bg-neutral-100 text-neutral-900"
                                )}
                              >
                                <p className="text-sm">{message.content}</p>
                                
                                {message.attachments && message.attachments.length > 0 && (
                                  <div className="mt-2 space-y-2">
                                    {message.attachments.map(attachment => (
                                      <div 
                                        key={attachment.id}
                                        className={cn(
                                          "flex items-center gap-2 p-2 rounded",
                                          isOwnMessage ? 
                                            "bg-primary-foreground/10" : 
                                            "bg-white"
                                        )}
                                      >
                                        <FileText className="h-4 w-4" />
                                        <span className="text-xs flex-1 truncate">
                                          {attachment.name}
                                        </span>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-6 px-2"
                                        >
                                          Download
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <div 
                                  className={cn(
                                    "text-xs mt-1 flex items-center justify-end gap-1",
                                    isOwnMessage ? 
                                      "text-primary-foreground/70" : 
                                      "text-neutral-500"
                                  )}
                                >
                                  {format(new Date(message.timestamp), "h:mm a")}
                                  {isOwnMessage && (
                                    <Check 
                                      className={cn(
                                        "h-3 w-3 ml-1",
                                        message.read ? "text-green-500" : ""
                                      )}
                                    />
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </ScrollArea>
                  
                  <div className="p-3 border-t bg-neutral-50">
                    <div className="flex gap-2 items-center">
                      <div className="flex gap-1">
                        <Button variant="outline" size="icon" className="rounded-full h-9 w-9 border-neutral-300 hover:bg-primary/10">
                          <Paperclip className="h-4 w-4 text-neutral-600" />
                        </Button>
                      </div>
                      <div className="relative flex-1">
                        <Textarea
                          placeholder="Type a message..."
                          className="min-h-10 resize-none pr-10 bg-white border-neutral-300 focus-visible:ring-primary rounded-lg shadow-sm"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                        />
                        <Button 
                          size="icon" 
                          disabled={!newMessage.trim()}
                          onClick={handleSendMessage}
                          className="absolute right-2 bottom-2 h-6 w-6 rounded-full bg-primary hover:bg-primary/90 text-white"
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* New Message Dialog */}
      <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
            <DialogDescription>
              Start a new conversation with a student or parent
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">To:</label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-neutral-500" />
                <Input
                  type="text"
                  placeholder="Search students or parents..."
                  className="pl-9 w-full"
                />
              </div>
            </div>
            
            <div className="border rounded-lg">
              <div className="p-3 border-b">
                <h3 className="font-medium">Recent Contacts</h3>
              </div>
              <div className="divide-y max-h-60 overflow-y-auto">
                {contacts.slice(0, 5).map(contact => (
                  <div
                    key={contact.id}
                    className="p-3 cursor-pointer hover:bg-neutral-50 flex items-center gap-3"
                    onClick={() => {
                      setSelectedContact(contact);
                      setShowNewMessageDialog(false);
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {getInitials(contact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{contact.name}</div>
                      <div className="text-xs text-neutral-500">
                        {contact.role === "student" ? "Student" : "Parent"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewMessageDialog(false)}>
                Cancel
              </Button>
              <Button>Continue</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}