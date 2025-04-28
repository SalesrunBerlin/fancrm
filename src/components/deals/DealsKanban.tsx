
import { DealType } from "@/types";
import { DealCard } from "./DealCard";
import { Card } from "@/components/ui/card";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useDeals } from "@/hooks/useDeals";
import { useToast } from "@/hooks/use-toast";
import { useDealStatuses, DealStatus } from "@/hooks/useDealStatuses";

interface DealsKanbanProps {
  deals: DealType[];
  isLoading: boolean;
  groupByField: "status";
  onDealClick: (id: string) => void;
}

export function DealsKanban({ deals, isLoading, groupByField, onDealClick }: DealsKanbanProps) {
  const { updateDeal } = useDeals();
  const { toast } = useToast();
  const { dealStatuses, isLoading: isLoadingStatuses } = useDealStatuses();

  if (isLoading || isLoadingStatuses) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty" />
      </div>
    );
  }

  // Create an object with all possible statuses initialized with empty arrays
  const emptyGroupedDeals = (dealStatuses || [])
    .sort((a: DealStatus, b: DealStatus) => a.order_position - b.order_position)
    .reduce((acc, status: DealStatus) => {
      acc[status.name] = [];
      return acc;
    }, {} as Record<string, DealType[]>);

  // Fill in the deals where they exist
  const groupedDeals = deals.reduce((acc, deal) => {
    const key = deal[groupByField];
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(deal);
    return acc;
  }, { ...emptyGroupedDeals });

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId } = result;

    // Drop outside a valid area
    if (!destination) return;

    // Drop in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the deal we're moving
    const dealToUpdate = deals.find(d => d.id === draggableId);
    if (!dealToUpdate) {
      console.error("Deal not found:", draggableId);
      return;
    }

    try {
      // Log what we're trying to update
      console.log("Updating deal:", {
        ...dealToUpdate,
        status: destination.droppableId
      });
      
      // Update the deal with the new status
      await updateDeal.mutateAsync({
        ...dealToUpdate,
        status: destination.droppableId
      });

      toast({
        title: "Status aktualisiert",
        description: `Deal wurde nach ${destination.droppableId} verschoben`,
      });
    } catch (error) {
      console.error('Error updating deal status:', error);
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive"
      });
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
        {dealStatuses && dealStatuses
          .sort((a: DealStatus, b: DealStatus) => a.order_position - b.order_position)
          .map((statusObj: DealStatus) => (
            <Droppable key={statusObj.name} droppableId={statusObj.name}>
              {(provided) => (
                <Card 
                  className="p-3"
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                >
                  <div className="font-semibold mb-2 flex justify-between items-center text-sm">
                    <span>{statusObj.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(groupedDeals[statusObj.name] || []).length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(groupedDeals[statusObj.name] || []).map((deal, index) => (
                      <Draggable 
                        key={deal.id} 
                        draggableId={deal.id} 
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={snapshot.isDragging ? "opacity-50" : ""}
                          >
                            <DealCard 
                              deal={deal} 
                              onClick={onDealClick}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                </Card>
              )}
            </Droppable>
          ))}
      </div>
    </DragDropContext>
  );
}
