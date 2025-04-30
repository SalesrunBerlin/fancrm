
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function KanbanSkeleton() {
  const columns = [1, 2, 3];
  const items = [1, 2, 3, 4];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map(column => (
        <div 
          key={column} 
          className="flex-shrink-0 w-80 bg-muted/30 rounded-md p-2"
        >
          <Skeleton className="h-6 w-40 mx-auto mb-3" />
          
          <div className="space-y-3">
            {items.map(item => (
              <Card key={item} className="p-3">
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-3 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-end mt-2 gap-1">
                  <Skeleton className="h-6 w-6 rounded-full" />
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
