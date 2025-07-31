import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DialogClose } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Trash2, CheckSquare, Square, MessageSquare, Bell, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNotificationSystem } from '@/hooks/use-notification-system';

interface Message {
  id: string;
  type: 'notification' | 'alert' | 'chat';
  title: string;
  content: string;
  timestamp: Date;
  sender?: string;
  read: boolean;
}

const MessageManager: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<'all' | 'notification' | 'alert' | 'chat'>('all');
  const { toast } = useToast();
  const { showAlert } = useNotificationSystem();

  // טעינת הודעות מ-localStorage
  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = () => {
    const savedMessages = localStorage.getItem('systemMessages');
    if (savedMessages) {
      const parsed = JSON.parse(savedMessages);
      setMessages(parsed.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }
  };

  const saveMessages = (newMessages: Message[]) => {
    localStorage.setItem('systemMessages', JSON.stringify(newMessages));
    setMessages(newMessages);
  };

  // בדיקה אם כל ההודעות בפילטר נבחרו
  const filteredMessages = messages.filter(msg => filter === 'all' || msg.type === filter);
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
    saveMessages(remainingMessages);
    setSelectedMessages(new Set());
    
    toast({
      title: "הודעות נמחקו",
      description: `${selectedMessages.size} הודעות נמחקו בהצלחה`
    });
  };

  const handleDeleteAll = () => {
    const filteredToDelete = filteredMessages;
    const remainingMessages = messages.filter(msg => 
      filter === 'all' ? false : msg.type !== filter
    );
    
    saveMessages(remainingMessages);
    setSelectedMessages(new Set());
    
    showAlert(
      "הודעות נמחקו",
      `כל ההודעות ${getFilterName(filter)} נמחקו (${filteredToDelete.length} הודעות)`,
      "success"
    );
  };

  const getFilterName = (filterType: string) => {
    switch (filterType) {
      case 'notification': return 'התראות';
      case 'alert': return 'התריעות';
      case 'chat': return 'צ\'אט';
      default: return '';
    }
  };

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'notification': return <Bell className="w-4 h-4" />;
      case 'alert': return <MessageSquare className="w-4 h-4" />;
      case 'chat': return <Users className="w-4 h-4" />;
      default: return <MessageSquare className="w-4 h-4" />;
    }
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'notification': return 'bg-blue-100 text-blue-800';
      case 'alert': return 'bg-red-100 text-red-800';
      case 'chat': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // הוספת הודעות לדוגמה (רק בפיתוח)
  const addSampleMessages = () => {
    const sampleMessages: Message[] = [
      {
        id: '1',
        type: 'notification',
        title: 'גיבוי הושלם',
        content: 'גיבוי המערכת הושלם בהצלחה',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        type: 'alert',
        title: 'שגיאה במערכת',
        content: 'זוהתה שגיאה בחיבור למסד הנתונים',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      },
      {
        id: '3',
        type: 'chat',
        title: 'הודעה מ-מנהל',
        content: 'בדקתי את הדוח החודשי, נראה טוב',
        timestamp: new Date(Date.now() - 7200000),
        sender: 'מלי פרידמן',
        read: true
      }
    ];
    
    const existingMessages = messages;
    const newMessages = [...existingMessages, ...sampleMessages];
    saveMessages(newMessages);
    
    toast({
      title: "הודעות לדוגמה נוספו",
      description: "נוספו 3 הודעות לדוגמה לבדיקה"
    });
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>ניהול הודעות המערכת</span>
          <div className="flex gap-2">
            <Button onClick={addSampleMessages} variant="outline" size="sm">
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
        {/* פילטרים ובקרות */}
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
              variant={filter === 'notification' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('notification')}
            >
              התראות ({messages.filter(m => m.type === 'notification').length})
            </Button>
            <Button
              variant={filter === 'alert' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('alert')}
            >
              התריעות ({messages.filter(m => m.type === 'alert').length})
            </Button>
            <Button
              variant={filter === 'chat' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('chat')}
            >
              צ'אט ({messages.filter(m => m.type === 'chat').length})
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
                    <AlertDialogTitle>מחיקת הודעות נבחרות</AlertDialogTitle>
                    <AlertDialogDescription>
                      האם אתה בטוח שברצונך למחוק {selectedMessages.size} הודעות נבחרות?
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
                    <AlertDialogTitle>מחיקת כל ההודעות</AlertDialogTitle>
                    <AlertDialogDescription>
                      האם אתה בטוח שברצונך למחוק את כל ההודעות 
                      {filter !== 'all' && ` מסוג ${getFilterName(filter)}`}?
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

        {/* רשימת הודעות */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              אין הודעות להצגה
            </div>
          ) : (
            filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 ${
                  selectedMessages.has(message.id) ? 'bg-blue-50 border-blue-300' : ''
                }`}
              >
                <Checkbox
                  checked={selectedMessages.has(message.id)}
                  onCheckedChange={() => handleSelectMessage(message.id)}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getMessageIcon(message.type)}
                    <Badge className={getMessageTypeColor(message.type)}>
                      {message.type === 'notification' && 'התראה'}
                      {message.type === 'alert' && 'התריעה'}
                      {message.type === 'chat' && 'צ\'אט'}
                    </Badge>
                    <span className="font-medium">{message.title}</span>
                    {!message.read && (
                      <Badge variant="secondary" className="text-xs">
                        חדש
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-1">{message.content}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{message.timestamp.toLocaleString('he-IL')}</span>
                    {message.sender && (
                      <span>• מאת: {message.sender}</span>
                    )}
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

export default MessageManager;