import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GripVertical, Plus, Settings } from "lucide-react";
import { DynamicTableRenderer } from "./dynamic-table-renderer";
import type { Client } from "@shared/schema";
import type { TableColumn } from "./table-customizer";
import { useTableSticky } from "@/hooks/use-table-sticky";

interface EnhancedClientsTableProps {
  clients: Client[];
  columns: TableColumn[];
  onColumnReorder: (newColumns: TableColumn[]) => void;
  onAddColumn: (columnName: string) => void;
  isSelected: (clientId: string) => boolean;
  onSelect: (clientId: string, checked: boolean) => void;
  onEdit: (client: Client) => void;
  onDelete: (clientId: string) => void;
  styleClasses: any;
}

export default function EnhancedClientsTable({
  clients,
  columns,
  onColumnReorder,
  onAddColumn,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  styleClasses
}: EnhancedClientsTableProps) {
  const [newColumnName, setNewColumnName] = useState("");
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);
  const { stickyHeaders, stickyFirstColumn, setStickyHeaders, setStickyFirstColumn } = useTableSticky();

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newColumns = Array.from(columns);
    const [reorderedColumn] = newColumns.splice(result.source.index, 1);
    newColumns.splice(result.destination.index, 0, reorderedColumn);

    onColumnReorder(newColumns);
  };

  const handleAddColumn = () => {
    if (newColumnName.trim()) {
      onAddColumn(newColumnName.trim());
      setNewColumnName("");
      setIsAddColumnOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Dialog open={isAddColumnOpen} onOpenChange={setIsAddColumnOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="w-4 h-4 ml-2" />
                הוסף עמודה
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>הוסף עמודה חדשה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="שם העמודה"
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddColumnOpen(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleAddColumn}>
                    הוסף
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={stickyHeaders}
              onChange={(e) => setStickyHeaders(e.target.checked)}
              className="w-4 h-4"
            />
            כותרות דביקות
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={stickyFirstColumn}
              onChange={(e) => setStickyFirstColumn(e.target.checked)}
              className="w-4 h-4"
            />
            עמודה ראשונה דביקה
          </label>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="relative overflow-auto max-h-[70vh] border rounded-lg">
        <Table className={styleClasses}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <TableHeader 
              className={`${stickyHeaders ? "sticky top-0 bg-white z-20 shadow-sm" : ""}`}
            >
              <Droppable droppableId="columns" direction="horizontal">
                {(provided: any) => (
                  <TableRow ref={provided.innerRef} {...provided.droppableProps}>
                    {columns.map((column, index) => (
                      <Draggable key={column.id} draggableId={column.id} index={index}>
                        {(provided: any, snapshot: any) => (
                          <TableHead
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`
                              text-right min-w-[120px] relative border-l
                              ${stickyFirstColumn && index === 0 ? "sticky right-0 bg-white z-30 shadow-r" : ""}
                              ${snapshot.isDragging ? "bg-blue-50 border-blue-200 shadow-lg" : ""}
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps} className="cursor-grab hover:text-blue-600">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                              </div>
                              <span className="font-semibold">{column.label}</span>
                            </div>
                          </TableHead>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </TableRow>
                )}
              </Droppable>
            </TableHeader>
          </DragDropContext>

          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className="hover:bg-gray-50 transition-colors">
                {columns.map((column, columnIndex) => (
                  <TableCell
                    key={column.id}
                    className={`
                      text-right border-l
                      ${stickyFirstColumn && columnIndex === 0 ? "sticky right-0 bg-white z-10" : ""}
                    `}
                  >
                    <DynamicTableRenderer
                      client={client}
                      column={column}
                      isSelected={isSelected(client.id)}
                      onSelect={onSelect}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      styleClasses={styleClasses}
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}