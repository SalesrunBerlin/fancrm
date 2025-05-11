
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Box, Building, Briefcase, Calendar, AppWindow, User } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ObjectActionsSection } from "@/components/actions/ObjectActionsSection";
import { ApplicationSwitcher } from "@/components/applications/ApplicationSwitcher";
import { useCurrentApplicationData } from "@/hooks/useCurrentApplicationData";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { ExpandableActionButton } from "@/components/actions/ExpandableActionButton";
import { useActions } from "@/hooks/useActions";
import { SavedFiltersButtons } from "@/components/records/SavedFiltersButtons";
import { ObjectCountBadge } from "@/components/dashboard/ObjectCountBadge";

export default function Dashboard() {
  const { user } = useAuth();
  const { currentApplication, appObjects, isLoading } = useCurrentApplicationData();
  
  // Filter objects to only show those owned by the current user or system objects
  // that are active, and don't show published objects from other users
  const filteredObjects = appObjects?.filter(type => 
    // Only show objects that:
    // 1. Are owned by the current user
    // 2. Are system objects that are active (but not published from other users)
    (type.owner_id === user?.id || (type.is_system && type.is_active)) &&
    // Don't show published objects from other users
    !(type.is_published && type.owner_id !== user?.id)
  );
  
  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-5 w-5" />;
      case 'building': return <Building className="h-5 w-5" />;
      case 'briefcase': return <Briefcase className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <PageHeader 
        title="Dashboard"
        description={currentApplication ? `Current Application: ${currentApplication.name}` : "No application selected"}
        actions={<ApplicationSwitcher variant="outline" size="sm" />}
      />
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 mb-3" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AppWindow className="h-5 w-5" />
                Welcome to your CRM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Your custom CRM solution is ready. You can create and manage your own
                object types and records in the Settings section.
              </p>
              {currentApplication && (
                <p className="text-sm bg-muted p-2 rounded-md">
                  You're currently in the <strong>{currentApplication.name}</strong> application
                </p>
              )}
            </CardContent>
          </Card>

          {filteredObjects?.filter(type => type.is_active).map((objectType) => (
            <Card key={objectType.id} className="flex flex-col">
              <CardHeader className="pb-2 relative">
                <Link to={`/objects/${objectType.id}`}>
                  <CardTitle className="flex items-center gap-2">
                    {getIconComponent(objectType.icon)}
                    <div className="flex items-center gap-1">
                      {objectType.name}
                    </div>
                  </CardTitle>
                </Link>
                {/* Add record count badge in top right */}
                <div className="absolute top-4 right-4">
                  <ObjectCountBadge objectTypeId={objectType.id} />
                </div>
              </CardHeader>
              <CardContent className="pt-3 flex flex-col">
                <DashboardObjectActions objectTypeId={objectType.id} />
                
                {/* Add SavedFiltersButtons component */}
                <SavedFiltersButtons objectTypeId={objectType.id} maxToShow={3} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// This function is no longer used in the CardTitle, but kept for other parts of the UI
function ObjectRecordCount({ objectTypeId }: { objectTypeId: string }) {
  const { records, isLoading } = useObjectRecords(objectTypeId);
  
  if (isLoading) {
    return <Skeleton className="h-4 w-6 inline-block" />;
  }
  
  return <>{records?.length || 0}</>;
}

// Component to display action buttons for an object type
function DashboardObjectActions({ objectTypeId }: { objectTypeId: string }) {
  const { getActionsByObjectId } = useActions();
  const [actions, setActions] = useState<any[]>([]);
  
  useEffect(() => {
    const loadActions = async () => {
      try {
        const objectActions = await getActionsByObjectId(objectTypeId);
        // Limit to 5 actions max now
        setActions(objectActions.slice(0, 5));
      } catch (error) {
        console.error("Error loading actions for dashboard:", error);
      }
    };
    
    if (objectTypeId) {
      loadActions();
    }
  }, [objectTypeId, getActionsByObjectId]);
  
  if (!actions.length) {
    return null;
  }
  
  // Display actions in a single horizontal row, spread across the full width
  return (
    <div className="flex flex-row justify-between w-full gap-2">
      {actions.map((action) => (
        <ExpandableActionButton
          key={action.id}
          actionName={action.name}
          color={action.color}
          compact={true}
          onExecute={() => {
            window.location.href = `/actions/execute/${action.id}`;
          }}
        />
      ))}
    </div>
  );
}
