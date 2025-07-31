import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Plus, Settings, Eye, EyeOff, Trash2, Edit, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import type { Client, TimeEntry } from '@shared/schema';
import TimeInsightsTooltip from "./time-insights-tooltip";
import EnhancedNotificationSystem from "./enhanced-notification-system";

interface Column {
  id: string;
  label: string;
  visible: boolean;
  type: 'text' | 'email' | 'phone' | 'status' | 'date' | 'custom';
}

interface ModernTableProps {
  clients: Client[];
  selectedClients: string[];
  onSelectClient: (clientId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  onEditClient: (client: Client) => void;
  onDeleteClient: (clientId: string) => void;
  onAddClient?: () => void;
  onUpdateClient?: (clientId: string, field: string, value: string) => void;
}

const DEFAULT_COLUMNS: Column[] = [
  { id: 'name', label: 'שם לקוח', visible: true, type: 'text' },
  { id: 'email', label: 'אימייל', visible: true, type: 'email' },
  { id: 'phone', label: 'טלפון', visible: true, type: 'phone' },
  { id: 'company', label: 'חברה', visible: false, type: 'text' },
  { id: 'workHours', label: 'שעות עבודה', visible: true, type: 'custom' },
  { id: 'sessionCount', label: 'מס\' סשנים', visible: true, type: 'custom' },
  { id: 'lastActivity', label: 'פעילות אחרונה', visible: true, type: 'custom' },
  { id: 'status', label: 'סטטוס', visible: true, type: 'status' },
  { id: 'createdAt', label: 'תאריך יצירה', visible: true, type: 'date' },
];

export function ModernTable({ 
  clients, 
  selectedClients, 
  onSelectClient, 
  onSelectAll,
  onEditClient,
  onDeleteClient,
  onAddClient,
  onUpdateClient
}: ModernTableProps) {
  const [columns, setColumns] = useState<Column[]>(DEFAULT_COLUMNS);
  const [isColumnDialogOpen, setIsColumnDialogOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [editingCell, setEditingCell] = useState<{clientId: string, field: string} | null>(null);
  const [editValue, setEditValue] = useState('');
  const { toast } = useToast();

  // Fetch time entries for work hours calculation
  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries"],
  });

  // Helper functions for time calculations
  const getClientWorkHours = (clientId: string) => {
    if (!timeEntries) return 0;
    const clientEntries = timeEntries.filter(entry => entry.clientId === clientId);
    return clientEntries.reduce((total, entry) => total + (entry.duration ?? 0), 0);
  };

  const getClientSessionCount = (clientId: string) => {
    if (!timeEntries) return 0;
    return timeEntries.filter(entry => entry.clientId === clientId && (entry.duration ?? 0) > 0).length;
  };

  const getClientLastActivity = (clientId: string) => {
    if (!timeEntries) return null;
    const clientEntries = timeEntries
      .filter(entry => entry.clientId === clientId && entry.endTime)
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime());
    return clientEntries.length > 0 ? clientEntries[0].endTime : null;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes} דק'`;
    } else {
      return `0 דק'`;
    }
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('he-IL', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  // Load columns from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('modern-table-columns');
    if (saved) {
      try {
        const savedColumns = JSON.parse(saved);
        const mergedColumns = DEFAULT_COLUMNS.map(defaultCol => {
          const savedCol = savedColumns.find((col: Column) => col.id === defaultCol.id);
          return savedCol || defaultCol;
        });
        const customColumns = savedColumns.filter((col: Column) => 
          !DEFAULT_COLUMNS.find(defaultCol => defaultCol.id === col.id)
        );
        setColumns([...mergedColumns, ...customColumns]);
      } catch (error) {
        
      }
    }
  }, []);

  // Save columns to localStorage
  useEffect(() => {
    localStorage.setItem('modern-table-columns', JSON.stringify(columns));
  }, [columns]);

  const visibleColumns = columns.filter(col => col.visible);
  const allSelected = clients.length > 0 && selectedClients.length === clients.length;

  const addCustomColumn = () => {
    if (!newColumnName.trim()) return;
    
    const newColumn: Column = {
      id: `custom_${Date.now()}`,
      label: newColumnName.trim(),
      visible: true,
      type: 'text'
    };
    
    setColumns(prev => [...prev, newColumn]);
    setNewColumnName('');
    
    
    toast({
      title: "עמודה נוספה",
      description: `עמודה "${newColumn.label}" נוספה בהצלחה`,
    });
  };

  const toggleColumnVisibility = (columnId: string) => {
    setColumns(prev => prev.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    ));
    
  };

  const removeColumn = (columnId: string) => {
    if (DEFAULT_COLUMNS.find(col => col.id === columnId)) {
      toggleColumnVisibility(columnId);
    } else {
      setColumns(prev => prev.filter(col => col.id !== columnId));
      
    }
  };

  const handleCellClick = (client: Client, field: string) => {
    if (field === 'status' || field === 'createdAt') return;
    
    setEditingCell({ clientId: client.id, field });
    const currentValue = getCellRawValue(client, field);
    setEditValue(currentValue);
  };

  const handleCellSave = () => {
    if (!editingCell || !onUpdateClient) return;
    
    onUpdateClient(editingCell.clientId, editingCell.field, editValue);
    setEditingCell(null);
    setEditValue('');
    
    toast({
      title: "עודכן בהצלחה",
      description: "השדה עודכן במערכת",
    });
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const getCellRawValue = (client: Client, columnId: string): string => {
    switch (columnId) {
      case 'name': return client.name;
      case 'email': return client.email || '';
      case 'phone': return client.phone || '';
      case 'company': return client.company || '';
      case 'workHours': return formatDuration(getClientWorkHours(client.id));
      case 'sessionCount': return getClientSessionCount(client.id).toString();
      case 'lastActivity': {
        const lastActivity = getClientLastActivity(client.id);
        return lastActivity ? formatDate(lastActivity) : 'אין פעילות';
      }
      case 'status': return client.status;
      case 'createdAt': return client.createdAt ? new Date(client.createdAt).toLocaleDateString('he-IL') : '';
      default: return '';
    }
  };

  const getCellValue = (client: Client, columnId: string) => {
    const isEditing = editingCell?.clientId === client.id && editingCell?.field === columnId;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') handleCellSave();
              if (e.key === 'Escape') handleCellCancel();
            }}
            onBlur={handleCellSave}
            autoFocus
            className="h-8 text-sm"
          />
        </div>
      );
    }
    
    const rawValue = getCellRawValue(client, columnId);
    const isClickable = !['status', 'createdAt', 'workHours', 'sessionCount', 'lastActivity'].includes(columnId);
    
    switch (columnId) {
      case 'name': 
        return (
          <span 
            onClick={() => handleCellClick(client, columnId)}
            className={`${isClickable ? 'cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-transparent hover:border-blue-200' : ''} font-medium`}
            title="לחץ לעריכה"
          >
            {rawValue || '-'}
          </span>
        );
      case 'email':
      case 'phone':
      case 'company':
        return (
          <span 
            onClick={() => handleCellClick(client, columnId)}
            className={`${isClickable ? 'cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-transparent hover:border-blue-200' : ''}`}
            title="לחץ לעריכה"
          >
            {rawValue || '-'}
          </span>
        );
      case 'workHours':
        return (
          <div className="flex items-center gap-1">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {rawValue}
            </Badge>
            {rawValue !== '0 דק\'' && <TimeInsightsTooltip clientId={client.id} />}
          </div>
        );
      case 'sessionCount':
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            {rawValue} סשנים
          </Badge>
        );
      case 'lastActivity':
        return (
          <span className="text-sm text-gray-600">
            {rawValue}
          </span>
        );
      case 'status': 
        return (
          <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
            {client.status === 'active' ? 'פעיל' : 'לא פעיל'}
          </Badge>
        );
      case 'createdAt': 
        return rawValue || '-';
      default:
        return (
          <span 
            onClick={() => handleCellClick(client, columnId)}
            className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded border-2 border-transparent hover:border-blue-200"
            title="לחץ לעריכה"
          >
            -
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            מציג {visibleColumns.length} עמודות מתוך {columns.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {onAddClient && (
            <Button onClick={onAddClient} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
              <UserPlus className="w-4 h-4 ml-2" />
              הוסף שורה
            </Button>
          )}
          
          <Button 
            onClick={() => {
              setNewColumnName('');
              setIsColumnDialogOpen(true);
            }}
            variant="outline" 
            size="sm"
            className="bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <Plus className="w-4 h-4 ml-2" />
            עמודה חדשה
          </Button>
          
          <Dialog open={isColumnDialogOpen} onOpenChange={setIsColumnDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 ml-2" />
                נהל עמודות
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>ניהול עמודות טבלה</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Add Column */}
                <div className="border-b pb-4">
                  <h3 className="font-medium mb-3">הוסף עמודה חדשה</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="שם העמודה החדשה..."
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addCustomColumn()}
                    />
                    <Button onClick={addCustomColumn} disabled={!newColumnName.trim()}>
                      <Plus className="w-4 h-4 ml-2" />
                      הוסף
                    </Button>
                  </div>
                </div>

                {/* Existing Columns */}
                <div>
                  <h3 className="font-medium mb-3">עמודות קיימות</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {columns.map(column => (
                      <div key={column.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{column.label}</span>
                          {!DEFAULT_COLUMNS.find(col => col.id === column.id) && (
                            <Badge variant="outline" className="text-xs">מותאם אישית</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleColumnVisibility(column.id)}
                            className={column.visible ? "text-green-600" : "text-gray-400"}
                          >
                            {column.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                          </Button>
                          {!DEFAULT_COLUMNS.find(col => col.id === column.id) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeColumn(column.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 min-w-12 resize-none">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={onSelectAll}
                />
              </TableHead>
              {visibleColumns.map((column, index) => (
                <TableHead 
                  key={column.id} 
                  className="text-right relative group min-w-24 border-r border-gray-200 resize-x"
                  style={{ minWidth: '120px', maxWidth: '300px', resize: 'horizontal', overflow: 'auto' }}
                >
                  <div className="flex items-center justify-between pr-2">
                    <span className="truncate">{column.label}</span>
                    <div className="w-1 h-4 bg-gray-300 cursor-col-resize hover:bg-blue-500 transition-colors"></div>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-center w-24 min-w-24">פעולות</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client, rowIndex) => (
              <TableRow 
                key={client.id}
                className="group hover:bg-gray-50 resize-y min-h-12"
                style={{ minHeight: '48px' }}
              >
                <TableCell className="border-r border-gray-100">
                  <Checkbox
                    checked={selectedClients.includes(client.id)}
                    onCheckedChange={(checked) => onSelectClient(client.id, checked as boolean)}
                  />
                </TableCell>
                {visibleColumns.map((column, colIndex) => (
                  <TableCell 
                    key={column.id} 
                    className="text-right border-r border-gray-100 hover:bg-blue-50 transition-colors"
                    style={{ minWidth: '120px', maxWidth: '300px', resize: 'horizontal', overflow: 'auto' }}
                  >
                    <div className="w-full min-h-8 flex items-center p-1">
                      {getCellValue(client, column.id)}
                    </div>
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                    <EnhancedNotificationSystem 
                      clientId={client.id} 
                      clientName={client.name} 
                      context="client" 
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditClient(client)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteClient(client.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Debug Info */}
      <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <span>📊 סה"כ לקוחות: {clients.length} | נבחרו: {selectedClients.length}</span>
            <span className="text-blue-600">💡 לחץ על כל תא בטבלה לעריכה ישירה</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-green-600">🔄 שינויים נשמרים אוטומטית במסד הנתונים</span>
            <span className="text-purple-600">↔️ גרור את קצות העמודות לשינוי גודל</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-orange-600">⏰ סה"כ רשומות זמן: {timeEntries.length}</span>
            <span className="text-indigo-600">👁️ עמודות גלויות: {visibleColumns.length}/{columns.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}