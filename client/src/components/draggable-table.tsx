import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { GripVertical, Plus } from "lucide-react";
import type { Client } from "@shared/schema";
import type { TableColumn } from "./table-customizer";

interface DraggableTableProps {
  clients: Client[];
  columns: TableColumn[];
  onColumnReorder: (newColumns: TableColumn[]) => void;
  onAddColumn: (columnName: string) => void;
  stickyHeaders: boolean;
  stickyFirstColumn: boolean;
  renderCell: (client: Client, column: TableColumn, index: number) => React.ReactNode;
}

export default function DraggableTable({
  clients,
  columns,
  onColumnReorder,
  onAddColumn,
  stickyHeaders,
  stickyFirstColumn,
  renderCell
}: DraggableTableProps) {
  const [newColumnName, setNewColumnName] = useState("");
  const [isAddColumnOpen, setIsAddColumnOpen] = useState(false);

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
    <div className="relative">
      {/* Add Column Button */}
      <div className="mb-4 flex justify-end">
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

      {/* Draggable Table */}
      <div className="overflow-auto max-h-[600px] relative">
        <Table>
          <DragDropContext onDragEnd={handleDragEnd}>
            <TableHeader className={stickyHeaders ? "sticky top-0 bg-white z-10 shadow-sm" : ""}>
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
                              text-right min-w-[120px] relative
                              ${stickyFirstColumn && index === 0 ? "sticky right-0 bg-white z-20" : ""}
                              ${snapshot.isDragging ? "bg-blue-50 border-blue-200" : ""}
                            `}
                          >
                            <div className="flex items-center gap-2">
                              <div {...provided.dragHandleProps} className="cursor-grab">
                                <GripVertical className="w-4 h-4 text-gray-400" />
                              </div>
                              <span>{column.label}</span>
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
            {clients.map((client, clientIndex) => (
              <TableRow key={client.id}>
                {columns.map((column, columnIndex) => (
                  <TableCell
                    key={column.id}
                    className={`
                      text-right
                      ${stickyFirstColumn && columnIndex === 0 ? "sticky right-0 bg-white z-10" : ""}
                    `}
                  >
                    {renderCell(client, column, clientIndex)}
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