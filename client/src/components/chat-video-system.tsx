import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  Users,
  X,
  Minimize2,
  Maximize2,
  Settings,
  Camera,
  CameraOff,
  Volume2,
  UserPlus,
  Mail,
  Plus
} from "lucide-react";

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'text' | 'system' | 'file';
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'busy' | 'away';
}

export default function ChatVideoSystem() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'video'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      userId: 'system',
      userName: 'מערכת',
      message: 'ברוכים הבאים לצ\'אט הקבוצתי!',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      type: 'system'
    },
    {
      id: '2',
      userId: 'user1',
      userName: 'יוסי כהן',
      message: 'שלום לכולם, מוכן להתחיל את הפגישה',
      timestamp: new Date(Date.now() - 25 * 60 * 1000),
      type: 'text'
    },
    {
      id: '3',
      userId: 'user2',
      userName: 'שרה לוי',
      message: 'היי יוסי! אני כאן גם',
      timestamp: new Date(Date.now() - 20 * 60 * 1000),
      type: 'text'
    }
  ]);

  const [users, setUsers] = useState<User[]>([
    { id: 'user1', name: 'יוסי כהן', status: 'online' },
    { id: 'user2', name: 'שרה לוי', status: 'online' },
    { id: 'user3', name: 'דני אברהם', status: 'away' },
    { id: 'user4', name: 'מיכל רוזן', status: 'busy' },
    { id: 'user5', name: 'אבי מנדל', status: 'offline' }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(2);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: 'current-user',
      userName: 'אני',
      message: newMessage.trim(),
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // סימולציה של תגובה אוטומטית
    setTimeout(() => {
      const responses = [
        'מעולה! תודה על העדכון',
        'קיבלתי, נטפל בזה',
        'בסדר, נמשיך בהתאם',
        'תודה, זה עוזר מאוד'
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const autoMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        userId: 'user1',
        userName: 'יוסי כהן',
        message: randomResponse,
        timestamp: new Date(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, autoMessage]);
    }, 1000 + Math.random() * 2000);
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
      
      setIsVideoCall(true);
      setActiveTab('video');
      
      toast({
        title: "שיחת וידאו התחילה",
        description: "השיחה התחילה בהצלחה",
      });
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן להתחיל שיחת וידאו. בדוק הרשאות המצלמה והמיקרופון",
        variant: "destructive",
      });
    }
  };

  const endVideoCall = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    setIsVideoCall(false);
    setActiveTab('chat');
    
    toast({
      title: "שיחת וידאו הסתיימה",
      description: "השיחה הסתיימה",
    });
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
    }
  };

  const addUserByEmail = () => {
    if (!newUserEmail.trim() || !newUserEmail.includes('@')) {
      toast({
        title: "שגיאה",
        description: "אנא הזן כתובת מייל תקינה",
        variant: "destructive",
      });
      return;
    }

    const userName = newUserEmail.split('@')[0];
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: userName,
      status: 'offline'
    };

    setUsers(prev => [...prev, newUser]);
    setNewUserEmail('');
    setShowAddUser(false);

    // שליחת הזמנה (סימולציה)
    toast({
      title: "הזמנה נשלחה",
      description: `הזמנה לצ'אט נשלחה ל-${newUserEmail}`,
    });

    // סימולציה של חיבור המשתמש לאחר כמה שניות
    setTimeout(() => {
      setUsers(prev => 
        prev.map(u => 
          u.id === newUser.id 
            ? { ...u, status: 'online' as const }
            : u
        )
      );
      
      const joinMessage: ChatMessage = {
        id: Date.now().toString(),
        userId: 'system',
        userName: 'מערכת',
        message: `${userName} הצטרף לצ'אט`,
        timestamp: new Date(),
        type: 'system'
      };
      
      setMessages(prev => [...prev, joinMessage]);
    }, 3000);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'busy': return 'bg-red-500';
      case 'away': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status: User['status']) => {
    switch (status) {
      case 'online': return 'מחובר';
      case 'busy': return 'עסוק';
      case 'away': return 'רחוק';
      default: return 'לא מחובר';
    }
  };

  // הוספת הודעות חדשות כל 45 שניות (לדמו)
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.6) { // 40% סיכוי להודעה חדשה
        const randomUsers = users.filter(u => u.status === 'online');
        if (randomUsers.length > 0) {
          const randomUser = randomUsers[Math.floor(Math.random() * randomUsers.length)];
          const randomMessages = [
            'יש עדכון חדש בפרויקט',
            'אני אכין את הדוח לישיבה הבאה',
            'האם כולם רואים את המסמך?',
            'בואו נקבע פגישה השבוע',
            'סיימתי את המשימה שלי'
          ];
          
          const newMsg: ChatMessage = {
            id: Date.now().toString(),
            userId: randomUser.id,
            userName: randomUser.name,
            message: randomMessages[Math.floor(Math.random() * randomMessages.length)],
            timestamp: new Date(),
            type: 'text'
          };
          
          setMessages(prev => [...prev, newMsg]);
          setUnreadCount(prev => prev + 1);
        }
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [users]);

  // איפוס מונה הודעות לא נקראו כשפותחים את הצ'אט
  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      setUnreadCount(0);
    }
  }, [isOpen, activeTab]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={`relative rounded-full shadow-lg ${
            isVideoCall 
              ? 'bg-green-100 hover:bg-green-200 border-green-300' 
              : unreadCount > 0
              ? 'bg-blue-100 hover:bg-blue-200 border-blue-300'
              : 'bg-white hover:bg-gray-50'
          }`}
          title="צ'אט ווידאו"
        >
          {isVideoCall ? (
            <Video className="w-4 h-4 text-green-600" />
          ) : (
            <MessageSquare className="w-4 h-4" />
          )}
          
          {unreadCount > 0 && !isVideoCall && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      
      <DialogContent className={`max-w-6xl ${isMinimized ? 'max-h-16' : 'max-h-[90vh]'} overflow-hidden`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isVideoCall ? (
                <Video className="w-5 h-5 text-green-600" />
              ) : (
                <MessageSquare className="w-5 h-5" />
              )}
              {isVideoCall ? 'שיחת וידאו פעילה' : 'צ\'אט קבוצתי'}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMinimized(!isMinimized)}
                title={isMinimized ? 'הגדל' : 'מזער'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
            </div>
          </DialogTitle>
          <DialogDescription>
            מערכת צ'אט ווידאו לתקשורת עם הצוות והלקוחות
          </DialogDescription>
        </DialogHeader>

        {!isMinimized && (
          <>
            {/* Tab Navigation */}
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 border-b-2 font-medium text-sm ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <MessageSquare className="w-4 h-4 inline ml-2" />
                צ'אט
                {unreadCount > 0 && activeTab !== 'chat' && (
                  <Badge variant="destructive" className="mr-2 text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </button>
              <button
                onClick={() => setActiveTab('video')}
                className={`px-4 py-2 border-b-2 font-medium text-sm ${
                  activeTab === 'video'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Video className="w-4 h-4 inline ml-2" />
                וידאו
                {isVideoCall && (
                  <Badge variant="default" className="mr-2 text-xs bg-green-500">
                    פעיל
                  </Badge>
                )}
              </button>
            </div>

            <div className="flex h-[500px]">
              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                {activeTab === 'chat' && (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.userId === 'current-user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] p-3 rounded-lg ${
                              message.type === 'system'
                                ? 'bg-gray-200 text-gray-600 text-center text-sm'
                                : message.userId === 'current-user'
                                ? 'bg-blue-500 text-white'
                                : 'bg-white border'
                            }`}
                          >
                            {message.type !== 'system' && message.userId !== 'current-user' && (
                              <div className="text-xs font-medium text-gray-600 mb-1">
                                {message.userName}
                              </div>
                            )}
                            <div className="text-sm">{message.message}</div>
                            <div className={`text-xs mt-1 ${
                              message.userId === 'current-user' ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {formatTimestamp(message.timestamp)}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t bg-white">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="הקלד הודעה..."
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          className="flex-1"
                        />
                        <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'video' && (
                  <div className="flex-1 flex flex-col">
                    {/* Video Area */}
                    <div className="flex-1 bg-black rounded-lg relative overflow-hidden">
                      {isVideoCall ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          muted
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-white">
                          <div className="text-center">
                            <CameraOff className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                            <h3 className="text-lg font-medium mb-2">אין שיחת וידאו פעילה</h3>
                            <p className="text-gray-400 mb-4">התחל שיחת וידאו כדי לראות את המשתתפים</p>
                            <Button onClick={startVideoCall} className="bg-green-600 hover:bg-green-700">
                              <Video className="w-4 h-4 ml-2" />
                              התחל שיחת וידאו
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Video Controls */}
                      {isVideoCall && (
                        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
                          <Button
                            size="sm"
                            variant={isMuted ? "destructive" : "secondary"}
                            onClick={toggleMute}
                            className="rounded-full"
                          >
                            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant={!isVideoEnabled ? "destructive" : "secondary"}
                            onClick={toggleVideo}
                            className="rounded-full"
                          >
                            {isVideoEnabled ? <Camera className="w-4 h-4" /> : <CameraOff className="w-4 h-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={endVideoCall}
                            className="rounded-full"
                          >
                            <PhoneOff className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Users Sidebar */}
              <div className="w-80 border-r bg-gray-50">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      משתתפים ({users.filter(u => u.status === 'online').length})
                    </h3>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddUser(true)}
                      title="הוסף משתמש"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Add User Form */}
                  {showAddUser && (
                    <div className="mb-4 p-3 bg-white rounded-lg border">
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        הזמן משתמש חדש
                      </h4>
                      <div className="flex gap-2">
                        <Input
                          placeholder="הזן כתובת מייל..."
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          className="text-sm"
                          onKeyPress={(e) => e.key === 'Enter' && addUserByEmail()}
                        />
                        <Button size="sm" onClick={addUserByEmail}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => setShowAddUser(false)}
                        className="mt-2 text-xs"
                      >
                        ביטול
                      </Button>
                    </div>
                  )}
                  
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-white transition-colors">
                        <div className="relative">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {user.name.charAt(0)}
                          </div>
                          <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(user.status)} rounded-full border-2 border-white`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{user.name}</div>
                          <div className="text-xs text-gray-500">{getStatusText(user.status)}</div>
                        </div>
                        {user.status === 'online' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="p-1" title="התחל וידאו">
                              <Video className="w-3 h-3" />
                            </Button>
                            <Button size="sm" variant="ghost" className="p-1" title="שלח הודעה פרטית">
                              <MessageSquare className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" onClick={startVideoCall} disabled={isVideoCall}>
                        <Video className="w-4 h-4 ml-1" />
                        התחל וידאו
                      </Button>
                      <Button size="sm" variant="outline" disabled>
                        <Settings className="w-4 h-4 ml-1" />
                        הגדרות
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}