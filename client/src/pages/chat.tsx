import { useState, useRef, useEffect } from "react";
import { MessageCircle, Send, Phone, Video, Paperclip, Smile, MoreVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
  type: 'text' | 'image' | 'file';
}

interface ChatRoom {
  id: number;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isOnline: boolean;
  avatar: string;
}

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<number>(1);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatRooms: ChatRoom[] = [
    {
      id: 1,
      name: "צוות ניהול",
      lastMessage: "הפגישה מחר בשעה 10:00",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      unreadCount: 2,
      isOnline: true,
      avatar: "👥"
    },
    {
      id: 2,
      name: "יוסי כהן",
      lastMessage: "תודה על העדכון",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      unreadCount: 0,
      isOnline: true,
      avatar: "👤"
    },
    {
      id: 3,
      name: "שרה לוי",
      lastMessage: "אשמח לקבל הצעת מחיר",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unreadCount: 1,
      isOnline: false,
      avatar: "👩"
    },
    {
      id: 4,
      name: "תמיכה טכנית",
      lastMessage: "הבעיה נפתרה",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      unreadCount: 0,
      isOnline: true,
      avatar: "🛠️"
    }
  ];

  const messages: Message[] = [
    {
      id: 1,
      sender: "דני מנהל",
      content: "שלום לכולם, יש לנו פגישה חשובה מחר",
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
      isOwn: false,
      type: 'text'
    },
    {
      id: 2,
      sender: "אני",
      content: "בזמן מה הפגישה?",
      timestamp: new Date(Date.now() - 50 * 60 * 1000),
      isOwn: true,
      type: 'text'
    },
    {
      id: 3,
      sender: "דני מנהל",
      content: "בשעה 10:00 בבוקר בחדר הישיבות",
      timestamp: new Date(Date.now() - 40 * 60 * 1000),
      isOwn: false,
      type: 'text'
    },
    {
      id: 4,
      sender: "מיכל",
      content: "אני אהיה שם 👍",
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      isOwn: false,
      type: 'text'
    },
    {
      id: 5,
      sender: "אני",
      content: "נראה לי טוב, אני גם אגיע",
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      isOwn: true,
      type: 'text'
    }
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (message.trim()) {
      // כאן יהיה הלוגיקה לשליחת הודעה
      
      setMessage("");
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatLastMessageTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes}ד'`;
    } else if (hours < 24) {
      return `${hours}ש'`;
    } else {
      return `${days}י'`;
    }
  };

  const selectedChatRoom = chatRooms.find(room => room.id === selectedChat);

  return (
    <div className="h-[calc(100vh-2rem)] max-w-7xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-6">
        <MessageCircle className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">צ'אט</h1>
        <Badge variant="secondary" className="h-6">
          {chatRooms.reduce((sum, room) => sum + room.unreadCount, 0)} הודעות חדשות
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-[calc(100vh-8rem)]">
        {/* רשימת צ'אטים */}
        <Card className="col-span-1 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">שיחות</h2>
          </div>
          <div className="overflow-y-auto h-full">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                onClick={() => setSelectedChat(room.id)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedChat === room.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                      {room.avatar}
                    </div>
                    {room.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-900 truncate">{room.name}</p>
                      <span className="text-xs text-gray-500">{formatLastMessageTime(room.timestamp)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 truncate">{room.lastMessage}</p>
                      {room.unreadCount > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                          {room.unreadCount}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* אזור הצ'אט */}
        <Card className="col-span-3 flex flex-col overflow-hidden">
          {selectedChatRoom && (
            <>
              {/* כותרת הצ'אט */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                      {selectedChatRoom.avatar}
                    </div>
                    {selectedChatRoom.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{selectedChatRoom.name}</h3>
                    <p className="text-sm text-gray-500">
                      {selectedChatRoom.isOnline ? "מקוון עכשיו" : "לא מקוון"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Phone className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Video className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* הודעות */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.isOwn
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {!msg.isOwn && (
                        <p className="text-xs font-medium mb-1 opacity-75">{msg.sender}</p>
                      )}
                      <p className="text-sm">{msg.content}</p>
                      <p className={`text-xs mt-1 ${
                        msg.isOwn ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* שדה הזנת הודעה */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="הקלד הודעה..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="pr-12"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute left-2 top-1/2 transform -translate-y-1/2"
                    >
                      <Smile className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                    className="px-4"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}