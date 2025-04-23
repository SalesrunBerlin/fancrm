
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ActivitiesList } from "./ActivitiesList";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ActivityForm } from "./ActivityForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface RelatedActivitiesProps {
  entityId: string;
  entityType: 'account' | 'contact' | 'deal';
}

export function RelatedActivities({ entityId, entityType }: RelatedActivitiesProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-xl">Aktivitäten</CardTitle>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <ActivitiesList filterBy={{ type: entityType, id: entityId }} />
      </CardContent>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Aktivität</DialogTitle>
          </DialogHeader>
          <ActivityForm 
            initialValues={{
              [entityType === 'account' ? 'accountId' : 
                entityType === 'contact' ? 'contactId' : 'dealId']: entityId
            }}
            onSuccess={() => setShowCreateModal(false)}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
