
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ActivitiesList } from "./ActivitiesList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ActivityForm } from "./ActivityForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useActivities } from "@/hooks/useActivities";

interface RelatedActivitiesProps {
  entityId: string;
  entityType: 'account' | 'contact' | 'deal';
}

export function RelatedActivities({ entityId, entityType }: RelatedActivitiesProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const { activities: allActivities, fetchActivities } = useActivities();
  const [entityActivities, setEntityActivities] = useState<any[]>([]);

  const handleActivityCreated = () => {
    setShowCreateModal(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ActivitiesList 
          filterBy={{ type: entityType, id: entityId }}
          key={refreshKey}
          showAddButton={false}
        />
      </CardContent>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Aktivität</DialogTitle>
          </DialogHeader>
          <ActivityForm 
            onSuccess={handleActivityCreated}
            initialValues={{
              [entityType === 'account' ? 'accountId' : 
                entityType === 'contact' ? 'contactId' : 'dealId']: entityId
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
