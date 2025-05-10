
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
import { useIsMobile } from "@/hooks/use-mobile";

export default function Dashboard() {
  const { user } = useAuth();
  const { currentApplication, appObjects, isLoading } = useCurrentApplicationData();
  const isMobile = useIsMobile();
  
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
    <div className="container mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
      <PageHeader 
        title="Dashboard"
        description={currentApplication ? `Current Application: ${currentApplication.name}` : "No application selected"}
        actions={<ApplicationSwitcher variant="outline" size="sm" />}
      />
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AppWindow className="h-5 w-5" />
                Welcome to your CRM
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm sm:text-base mb-4">
                Your custom CRM solution is ready. You can create and manage your own
                object types and records in the Settings section.
              </p>
              {currentApplication && (
                <p className="text-xs sm:text-sm bg-muted p-2 rounded-md">
                  You're currently in the <strong>{currentApplication.name}</strong> application
                </p>
              )}
            </CardContent>
          </Card>

          {filteredObjects?.filter(type => type.is_active).map((objectType) => (
            <Card key={objectType.id} className="flex flex-col">
              <CardHeader className="pb-1 sm:pb-2 relative">
                <Link to={`/objects/${objectType.id}`}>
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    {getIconComponent(objectType.icon)}
                    <div className="flex items-center gap-1">
                      {objectType.name}
                    </div>
                  </CardTitle>
                </Link>
                {/* Add record count badge in top right */}
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
                  <ObjectCountBadge objectTypeId={objectType.id} />
                </div>
              </CardHeader>
              <CardContent className="pt-1 sm:pt-3 flex flex-col">
                <DashboardObjectActions objectTypeId={objectType.id} />
                
                {/* Add SavedFiltersButtons component with explicit visibility */}
                <div className="block w-full">
                  <SavedFiltersButtons 
                    objectTypeId={objectType.id} 
                    maxToShow={isMobile ? 2 : 3} 
                  />
                </div>
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
  const isMobile = useIsMobile();
  
  useEffect(() => {
    const loadActions = async () => {
      try {
        const objectActions = await getActionsByObjectId(objectTypeId);
        // Limit to fewer actions on mobile
        const limit = isMobile ? 4 : 5;
        setActions(objectActions.slice(0, limit));
      } catch (error) {
        console.error("Error loading actions for dashboard:", error);
      }
    };
    
    if (objectTypeId) {
      loadActions();
    }
  }, [objectTypeId, getActionsByObjectId, isMobile]);
  
  if (!actions.length) {
    return null;
  }
  
  // Display actions in a flex row with gap, wrapping as needed
  return (
    <div className="flex flex-wrap gap-1 sm:gap-2 w-full mb-2 sm:mb-4">
      {actions.map((action) => (
        <div key={action.id} className="w-[calc(50%-2px)] sm:w-[calc(50%-4px)]"> {/* Adjust gap for mobile */}
          <ExpandableActionButton
            key={action.id}
            actionName={action.name}
            color={action.color}
            compact={true}
            wideButton={true}
            onExecute={() => {
              window.location.href = `/actions/execute/${action.id}`;
            }}
          />
        </div>
      ))}
    </div>
  );
}
