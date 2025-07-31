import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  MessageCircle, 
  Video, 
  Phone, 
  Send, 
  X, 
  Minimize2,
  Maximize2,
  Users,
  Settings
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'video-call' | 'voice-call';
  read: boolean;
}

interface ChatSystemProps {
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
  isMinimized: boolean;
}

export default function ChatSystem({ currentUserId, isOpen, onClose, onToggleMinimize, isMinimized }: ChatSystemProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users for chat
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  // Fetch messages for selected user
  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/messages", selectedUser?.id],
    enabled: !!selectedUser,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData: { receiverId: string; content: string; type: string }) =>
      apiRequest("/api/messages", "POST", messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      setMessageText("");
    },
  });

  // Start video call mutation
  const startVideoCallMutation = useMutation({
    mutationFn: (callData: { receiverId: string; type: 'video' | 'voice' }) =>
      apiRequest("/api/video-calls", "POST", callData),
    onSuccess: () => {
      setIsVideoCallActive(true);
      startVideoCall();
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!messageText.trim() || !selectedUser) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedUser.id,
      content: messageText,
      type: 'text'
    });
  };

  const startVideoCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      toast({
        title: "שיחת וידאו התחילה",
        description: `שיחת וידאו עם ${selectedUser?.username}`,
      });
    } catch (error) {
      toast({
        title: "שגיאה בשיחת וידאו",
        description: "לא ניתן להפעיל מצלמה ומיקרופון",
        variant: "destructive",
      });
    }
  };

  const endVideoCall = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsVideoCallActive(false);
  };

  const initiateVideoCall = () => {
    if (!selectedUser) return;
    
    startVideoCallMutation.mutate({
      receiverId: selectedUser.id,
      type: 'video'
    });
  };

  if (!isOpen) return null;

  return (
    <Card className={`fixed z-50 shadow-2xl border-0 bg-white ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    } transition-all duration-300`}
    style={{ 
      bottom: '20px', 
      right: '20px',
    }}>
      <CardHeader className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          צ'אט עובדים
          {messages.filter(m => !m.read && m.receiverId === currentUserId).length > 0 && (
            <Badge className="bg-red-500 text-white">
              {messages.filter(m => !m.read && m.receiverId === currentUserId).length}
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleMinimize}
            className="text-white hover:bg-white/20"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-0 h-full flex">
          {/* Users List */}
          <div className="w-1/3 border-l border-gray-200 bg-gray-50">
            <div className="p-3 border-b border-gray-200">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4" />
                עובדים פעילים
              </h3>
            </div>
            <ScrollArea className="h-[480px]">
              {users.filter(u => u.id !== currentUserId).map((user) => (
                <div
                  key={user.id}
                  className={`p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 ${
                    selectedUser?.id === user.id ? 'bg-blue-100' : ''
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{user.username}</p>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-500">פעיל</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-3 border-b border-gray-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {selectedUser.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{selectedUser.username}</p>
                      <p className="text-xs text-green-600">פעיל עכשיו</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={initiateVideoCall}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Video className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-600 hover:bg-green-50"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Video Call Area */}
                {isVideoCallActive && (
                  <div className="relative bg-black h-48">
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={endVideoCall}
                      >
                        סיים שיחה
                      </Button>
                    </div>
                  </div>
                )}

                {/* Messages */}
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.senderId === currentUserId ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.senderId === currentUserId
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString('he-IL')}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-3 border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="הקלד הודעה..."
                      className="flex-1"
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!messageText.trim() || sendMessageMutation.isPending}
                      className="bg-blue-500 hover:bg-blue-600"
                      size="sm"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>בחר עובד כדי להתחיל צ'אט</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}