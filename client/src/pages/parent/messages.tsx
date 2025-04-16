import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDistanceToNow } from "date-fns";
import { 
  Search,
  Send, 
  Paperclip, 
  MoreVertical, 
  Phone, 
  Video,
  UserPlus,
  Users,
  MessagesSquare,
  ArrowLeft,
  Home
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function ParentMessages() {
  const { user } = useAuth();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(1);
  const [messageText, setMessageText] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Mock conversations data
  const conversations = [
    {
      id: 1,
      name: "John Smith",
      role: "Teacher",
      avatar: "/avatars/teacher1.png",
      lastMessage: "Riya has been doing great in her guitar lessons.",
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: "Admin Office",
      role: "Admin",
      avatar: "/avatars/admin1.png",
      lastMessage: "We've received your payment for this month's fees.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      unread: 0,
      online: true
    },
    {
      id: 3,
      name: "Maria Rodriguez",
      role: "Teacher",
      avatar: "/avatars/teacher2.png",
      lastMessage: "Can we reschedule Riya's next piano class?",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      unread: 0,
      online: false
    }
  ];

  // Mock messages data
  const messageHistory = [
    {
      id: 1,
      conversationId: 1,
      sender: "John Smith",
      content: "Hello! I wanted to update you about Riya's progress in her guitar lessons.",
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      isMe: false
    },
    {
      id: 2,
      conversationId: 1,
      sender: "Me",
      content: "Hi John, that would be great. How is she doing?",
      timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
      isMe: true
    },
    {
      id: 3,
      conversationId: 1,
      sender: "John Smith",
      content: "Riya has been doing exceptionally well. Her finger techniques have improved a lot, and she's starting to understand chord progressions.",
      timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
      isMe: false
    },
    {
      id: 4,
      conversationId: 1,
      sender: "Me",
      content: "That's wonderful to hear! She's been practicing at home as well.",
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      isMe: true
    },
    {
      id: 5,
      conversationId: 1,
      sender: "John Smith",
      content: "I can definitely see that. Her dedication is showing in her progress.",
      timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
      isMe: false
    },
    {
      id: 6,
      conversationId: 1,
      sender: "John Smith",
      content: "Riya has been doing great in her guitar lessons. I think she's ready for the upcoming recital next month.",
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
      isMe: false
    }
  ];

  // Define breadcrumbs for the page
  const breadcrumbs = [
    {
      title: "Home",
      href: "/parent/dashboard",
      icon: <Home className="h-4 w-4" />
    },
    {
      title: "Messages"
    }
  ];

  // Filter conversations based on activeTab and search query
  const filteredConversations = conversations
    .filter(conversation => {
      // Filter by search query
      if (searchQuery && !conversation.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Filter by tab
      if (activeTab === "teachers" && conversation.role !== "Teacher") {
        return false;
      }
      if (activeTab === "admin" && conversation.role !== "Admin") {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  const getConversationMessages = (conversationId: number) => {
    return messageHistory.filter(message => message.conversationId === conversationId);
  };

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation) {
      // In a real app, you'd call an API to send the message
      // For now, just clear the input
      setMessageText("");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Teacher":
        return "bg-blue-100 text-blue-800";
      case "Admin":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <AppShell>
      <PageHeader 
        title="Messages" 
        description="Communicate with teachers and school administrators"
        breadcrumbs={breadcrumbs}
      />

      <div className="mt-6">
        <Card className="border rounded-lg overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[calc(100vh-240px)] flex">
              {/* Contacts sidebar - hidden on mobile when chat is open */}
              <div className={`w-full md:w-1/3 border-r ${showMobileChat ? 'hidden md:block' : 'block'}`}>
                <div className="p-4 border-b">
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input 
                      placeholder="Search conversations..." 
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3 w-full">
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="teachers">Teachers</TabsTrigger>
                      <TabsTrigger value="admin">Admin</TabsTrigger>
                    </TabsList>
                    <TabsContent value="all"></TabsContent>
                    <TabsContent value="teachers"></TabsContent>
                    <TabsContent value="admin"></TabsContent>
                  </Tabs>
                </div>
                <div className="overflow-y-auto h-[calc(100%-72px)]">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map(conversation => (
                      <div 
                        key={conversation.id}
                        className={`p-3 border-b hover:bg-gray-50 cursor-pointer flex items-start ${selectedConversation === conversation.id ? 'bg-gray-50' : ''}`}
                        onClick={() => {
                          setSelectedConversation(conversation.id);
                          setShowMobileChat(true);
                        }}
                      >
                        <div className="relative mr-3">
                          <Avatar>
                            <AvatarFallback>{conversation.name.charAt(0)}</AvatarFallback>
                            <AvatarImage src={conversation.avatar} />
                          </Avatar>
                          {conversation.online && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-sm truncate">{conversation.name}</h4>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(conversation.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                          <Badge variant="outline" className={`text-xs my-1 ${getRoleColor(conversation.role)}`}>
                            {conversation.role}
                          </Badge>
                          <p className="text-sm text-gray-600 truncate">{conversation.lastMessage}</p>
                        </div>
                        {conversation.unread > 0 && (
                          <div className="ml-2 bg-primary text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {conversation.unread}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <MessagesSquare className="h-12 w-12 text-gray-300 mb-3" />
                      <h3 className="text-lg font-medium">No conversations found</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {searchQuery ? "Try a different search term" : "Start a new conversation"}
                      </p>
                      <Button className="mt-4" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        New Message
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Chat area - shown on mobile when a chat is selected */}
              <div className={`w-full md:w-2/3 flex flex-col ${!showMobileChat ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversation ? (
                  <>
                    <div className="p-3 border-b flex items-center justify-between">
                      <div className="flex items-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="md:hidden mr-2"
                          onClick={() => setShowMobileChat(false)}
                        >
                          <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback>
                            {conversations.find(c => c.id === selectedConversation)?.name.charAt(0)}
                          </AvatarFallback>
                          <AvatarImage 
                            src={conversations.find(c => c.id === selectedConversation)?.avatar} 
                          />
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-sm">
                            {conversations.find(c => c.id === selectedConversation)?.name}
                          </h3>
                          <div className="flex items-center">
                            <Badge variant="outline" className={`text-xs ${getRoleColor(conversations.find(c => c.id === selectedConversation)?.role || "")}`}>
                              {conversations.find(c => c.id === selectedConversation)?.role}
                            </Badge>
                            <span className={`ml-2 text-xs ${conversations.find(c => c.id === selectedConversation)?.online ? 'text-green-500' : 'text-gray-500'}`}>
                              {conversations.find(c => c.id === selectedConversation)?.online ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button variant="ghost" size="icon">
                          <Phone className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Video className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {getConversationMessages(selectedConversation).map(message => (
                        <div 
                          key={message.id} 
                          className={`flex ${message.isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${message.isMe ? 'bg-primary text-white' : 'bg-gray-100'} rounded-lg px-4 py-2`}>
                            <div className="text-sm">{message.content}</div>
                            <div className={`text-xs mt-1 ${message.isMe ? 'text-primary-foreground/70' : 'text-gray-500'}`}>
                              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="p-3 border-t">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon">
                          <Paperclip className="h-5 w-5" />
                        </Button>
                        <Input 
                          placeholder="Type your message..." 
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          className="flex-1"
                        />
                        <Button size="icon" onClick={handleSendMessage} disabled={!messageText.trim()}>
                          <Send className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <Users className="h-16 w-16 text-gray-300 mb-3" />
                    <h3 className="text-xl font-medium">Select a conversation</h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-md">
                      Choose a conversation from the left or start a new one to begin messaging
                    </p>
                    <Button className="mt-4">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Start New Conversation
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}