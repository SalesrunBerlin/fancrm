
import { StatusList } from "@/components/settings/StatusList";
import { StatusForm } from "@/components/settings/StatusForm";
import { ObjectTypesList } from "@/components/settings/ObjectTypesList";
import { useDealStatuses } from "@/hooks/useDealStatuses";
import { useEffect } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Settings() {
  const { dealStatuses, isLoading, createStatus, updateStatus, deleteStatus } = useDealStatuses();
  const { objectTypes, isLoading: loadingObjectTypes } = useObjectTypes();
  
  // Find the account object type to provide a direct link
  const accountObjectType = objectTypes?.find(type => type.api_name === "account");

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      
      <div className="space-y-6">
        {/* Object Types Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Objects</h2>
          
          {/* Quick access card for Account picklist configuration */}
          {accountObjectType && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <Link to={`/settings/object-types/${accountObjectType.id}`}>
                      Configure Account Fields
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <ObjectTypesList />
        </div>

        {/* Deal Status Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Deal Statuses</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StatusList 
              dealStatuses={dealStatuses || []}
              isLoading={isLoading}
              updateStatus={updateStatus}
              deleteStatus={deleteStatus}
            />
            <StatusForm 
              dealStatuses={dealStatuses || []}
              createStatus={createStatus}
              isPending={createStatus.isPending || false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
