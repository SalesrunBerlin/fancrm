
import { Activity } from "@/lib/types/database";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ActivitiesList } from "./ActivitiesList";

interface RelatedActivitiesProps {
  entityId: string;
  entityType: 'account' | 'contact' | 'deal';
}

export function RelatedActivities({ entityId, entityType }: RelatedActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Aktivitäten</CardTitle>
      </CardHeader>
      <CardContent>
        <ActivitiesList filterBy={{ type: entityType, id: entityId }} />
      </CardContent>
    </Card>
  );
}
