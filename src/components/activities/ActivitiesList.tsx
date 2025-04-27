
import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ActivityItem } from "@/components/activities/ActivityItem";
import { ActivityForm } from "@/components/activities/ActivityForm";
import { useActivities } from "@/hooks/useActivities";
import { useNavigate } from "react-router-dom";
import { Activity } from "@/lib/types/database";

interface ActivitiesListProps {
  activities?: Activity[];
  title?: string;
  showAddButton?: boolean;
  entityId?: string;
  entityType?: 'contact' | 'account' | 'deal';
  onActivityCreated?: () => void;
  filterBy?: { type: 'contact' | 'account' | 'deal'; id: string };
}

export function ActivitiesList({ 
  activities = [], 
  title = "Activities", 
  showAddButton = true,
  entityId,
  entityType,
  onActivityCreated,
  filterBy
}: ActivitiesListProps) {
  const [showActivityForm, setShowActivityForm] = useState(false);
  const { createActivity, fetchActivities } = useActivities();
  const navigate = useNavigate();
  const [loadedActivities, setLoadedActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(filterBy !== undefined);

  // If filterBy is provided, fetch filtered activities
  useState(() => {
    const loadData = async () => {
      if (filterBy) {
        setLoading(true);
        try {
          const data = await fetchActivities(filterBy);
          setLoadedActivities(data || []);
        } catch (error) {
          console.error("Error fetching activities:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  });

  // Determine which activities to display
  const displayActivities = filterBy ? loadedActivities : activities;

  const handleCreateActivity = async (activityData: Partial<Activity>) => {
    try {
      // Add entity reference if provided
      if (entityId && entityType) {
        if (entityType === 'contact') {
          activityData.contactId = entityId;
        } else if (entityType === 'account') {
          activityData.accountId = entityId;
        } else if (entityType === 'deal') {
          activityData.dealId = entityId;
        }
      }

      await createActivity(activityData);
      setShowActivityForm(false);
      
      if (onActivityCreated) {
        onActivityCreated();
      }

      // If we're displaying filtered activities, refresh the list
      if (filterBy) {
        const data = await fetchActivities(filterBy);
        setLoadedActivities(data || []);
      }
    } catch (error) {
      console.error("Error creating activity:", error);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        {showAddButton && (
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowActivityForm(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {showActivityForm && (
          <div className="mb-6">
            <ActivityForm
              onSuccess={() => {
                setShowActivityForm(false);
                if (onActivityCreated) onActivityCreated();
              }}
              defaultValues={{
                type: 'call',
                status: 'planned',
                ...(entityId && entityType === 'contact' ? { contactId: entityId } : {}),
                ...(entityId && entityType === 'account' ? { accountId: entityId } : {}),
                ...(entityId && entityType === 'deal' ? { dealId: entityId } : {}),
              }}
            />
          </div>
        )}

        {loading ? (
          <div className="text-center py-4 text-muted-foreground">
            Loading activities...
          </div>
        ) : displayActivities.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No activities found
          </div>
        ) : (
          <div className="space-y-4">
            {displayActivities.map((activity) => (
              <ActivityItem
                key={activity.id}
                activity={activity}
                onClick={() => navigate(`/activities/${activity.id}`)}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
