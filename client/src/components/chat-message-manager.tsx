import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Trash2, CheckSquare, Square, MessageCircle, Search, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  sender: string;
  senderEmail: string;
  recipient: string;
  recipientEmail: string;
  content: string;
  timestamp: Date;
  read: boolean;
  type: 'sent' | 'received';
}

const ChatMessageManager: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'sent' | 'received'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // טעינת הודעות צ'אט מ-localStorage
  useEffect(() => {
    loadChatMessages();
  }, []);

  const loadChatMessages = () => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      setMessages(parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }
  };

  const saveChatMessages = (newMessages: ChatMessage[]) => {
    localStorage.setItem('chatMessages', JSON.stringify(newMessages));
    setMessages(newMessages);
  };

  // הוספת הודעות לדוגמה
  const addSampleChatMessages = () => {
    const sampleMessages: ChatMessage[] = [
      {
        id: '1',
        sender: 'מלי פרידמן',
        senderEmail: 'mali.f.arch2@gmail.com',
        recipient: 'עובד מערכת',
        recipientEmail: 'jj1212t@gmail.com',
        content: 'בדקתי את הדוח החודשי, נראה מעולה. כל הנתונים תקינים.',
        timestamp: new Date(),
        read: true,
        type: 'sent'
      },
      {
        id: '2',
        sender: 'עובד מערכת',
        senderEmail: 'jj1212t@gmail.com',
        recipient: 'מלי פרידמן',
        recipientEmail: 'mali.f.arch2@gmail.com',
        content: 'תודה! האם יש עדכונים לגבי הפרויקט החדש?',
        timestamp: new Date(Date.now() - 1800000),
        read: false,
        type: 'received'
      },
      {
        id: '3',
        sender: 'מלי פרידמן',
        senderEmail: 'mali.f.arch2@gmail.com',
        recipient: 'עובד מערכת',
        recipientEmail: 'jj1212t@gmail.com',
        content: 'הפרויקט החדש מתקדם לפי לוח הזמנים. נשלח עדכון מפורט בסוף השבוע.',
        timestamp: new Date(Date.now() - 3600000),
        read: true,
        type: 'sent'
      }
    ];
    
    const existingMessages = messages;
    const newMessages = [...existingMessages, ...sampleMessages];
    saveChatMessages(newMessages);
    
    toast({
      title: "הודעות צ'אט נוספו",
      description: "נוספו 3 הודעות צ'אט לדוגמה"
    });
  };

  // סינון הודעות
  const filteredMessages = messages.filter(msg => {
    const matchesFilter = filter === 'all' || msg.type === filter;
    const matchesSearch = searchTerm === '' || 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.recipient.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // בחירת כל ההודעות
  const isAllSelected = filteredMessages.length > 0 && 
    filteredMessages.every(msg => selectedMessages.has(msg.id));

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedMessages(new Set());
    } else {
      const newSelected = new Set(selectedMessages);
      filteredMessages.forEach(msg => newSelected.add(msg.id));
      setSelectedMessages(newSelected);
    }
  };

  const handleSelectMessage = (messageId: string) => {
    const newSelected = new Set(selectedMessages);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedMessages(newSelected);
  };

  const handleDeleteSelected = () => {
    const remainingMessages = messages.filter(msg => !selectedMessages.has(msg.id));
    saveChatMessages(remainingMessages);
    setSelectedMessages(new Set());
    
    toast({
      title: "הודעות צ'אט נמחקו",
      description: `${selectedMessages.size} הודעות נמחקו בהצלחה`
    });
  };

  const handleDeleteAll = () => {
    const filteredToDelete = filteredMessages;
    const remainingMessages = messages.filter(msg => 
      filter === 'all' ? false : msg.type !== filter
    );
    
    saveChatMessages(remainingMessages);
    setSelectedMessages(new Set());
    
    toast({
      title: "הודעות צ'אט נמחקו",
      description: `כל ההודעות ${getFilterName(filter)} נמחקו (${filteredToDelete.length} הודעות)`
    });
  };

  const getFilterName = (filterType: string) => {
    switch (filterType) {
      case 'sent': return 'שנשלחו';
      case 'received': return 'שהתקבלו';
      default: return '';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            ניהול הודעות צ'אט
          </span>
          <div className="flex gap-2">
            <Button onClick={addSampleChatMessages} variant="outline" size="sm">
              הוסף הודעות לדוגמה
            </Button>
            <DialogClose asChild>
              <Button variant="ghost" size="sm">
                ✕ סגור
              </Button>
            </DialogClose>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* חיפוש ופילטרים */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute right-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="חפש הודעות..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-8"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('all')}
              >
                הכל ({messages.length})
              </Button>
              <Button
                variant={filter === 'sent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('sent')}
              >
                נשלחו ({messages.filter(m => m.type === 'sent').length})
              </Button>
              <Button
                variant={filter === 'received' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter('received')}
              >
                התקבלו ({messages.filter(m => m.type === 'received').length})
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={filteredMessages.length === 0}
              >
                {isAllSelected ? <CheckSquare className="w-4 h-4 ml-1" /> : <Square className="w-4 h-4 ml-1" />}
                {isAllSelected ? 'בטל הכל' : 'בחר הכל'}
              </Button>
              
              {selectedMessages.size > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 ml-1" />
                      מחק נבחרות ({selectedMessages.size})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>מחיקת הודעות צ'אט נבחרות</AlertDialogTitle>
                      <AlertDialogDescription>
                        האם אתה בטוח שברצונך למחוק {selectedMessages.size} הודעות צ'אט נבחרות?
                        פעולה זו לא ניתנת לביטול.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteSelected}>
                        מחק
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              
              {filteredMessages.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 ml-1" />
                      מחק הכל
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>מחיקת כל הודעות הצ'אט</AlertDialogTitle>
                      <AlertDialogDescription>
                        האם אתה בטוח שברצונך למחוק את כל הודעות הצ'אט 
                        {filter !== 'all' && ` ${getFilterName(filter)}`}?
                        פעולה זו לא ניתנת לביטול ({filteredMessages.length} הודעות).
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAll}>
                        מחק הכל
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </div>

        {/* רשימת הודעות צ'אט */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'לא נמצאו הודעות התואמות לחיפוש' : 'אין הודעות צ\'אט להצגה'}
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 ${
                  selectedMessages.has(message.id) ? 'bg-blue-50 border-blue-300' : ''
                } ${message.type === 'sent' ? 'bg-green-50' : 'bg-blue-50'}`}
              >
                <Checkbox
                  checked={selectedMessages.has(message.id)}
                  onCheckedChange={() => handleSelectMessage(message.id)}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4" />
                    <Badge className={message.type === 'sent' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}>
                      {message.type === 'sent' ? 'נשלח' : 'התקבל'}
                    </Badge>
                    <span className="font-medium">{message.sender}</span>
                    <span className="text-sm text-gray-500">→ {message.recipient}</span>
                    {!message.read && (
                      <Badge variant="secondary" className="text-xs">
                        חדש
                      </Badge>
                    )}
                  </div>
                  
                  <div className="bg-white p-2 rounded border mb-2">
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{message.timestamp.toLocaleString('he-IL')}</span>
                    <span>• {message.senderEmail}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatMessageManager;