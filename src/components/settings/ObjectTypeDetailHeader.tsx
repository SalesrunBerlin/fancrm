
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Archive, Edit, MoreHorizontal, PackageOpen, Trash } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger, 
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ObjectType } from "@/hooks/useObjectTypes";
import { ApplicationAssignmentDialog } from "@/components/settings/ApplicationAssignmentDialog";
import { useState } from "react";
import { Apps } from "lucide-react";

interface ObjectTypeDetailHeaderProps {
  objectType: ObjectType;
}

export function ObjectTypeDetailHeader({ objectType }: ObjectTypeDetailHeaderProps) {
  const navigate = useNavigate();
  const [showAssignDialog, setShowAssignDialog] = useState(false);

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{objectType.name}</h1>
        <p className="text-sm text-muted-foreground">API Name: {objectType.api_name}</p>
        <div className="flex mt-2 gap-2">
          {objectType.is_system && (
            <Badge variant="outline">System Object</Badge>
          )}
          {objectType.is_template && (
            <Badge variant="outline" className="bg-purple-100">Imported</Badge>
          )}
          {objectType.is_published && (
            <Badge variant="outline" className="bg-blue-100">Published</Badge>
          )}
          {!objectType.is_active && (
            <Badge variant="destructive">Inactive</Badge>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          onClick={() => setShowAssignDialog(true)}
          className="flex items-center gap-1"
        >
          <Apps className="h-4 w-4 mr-1" />
          Assign to Applications
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!objectType.is_active ? (
              <DropdownMenuItem onClick={() => navigate(`/settings/objects/${objectType.id}/restore`)}>
                <PackageOpen className="h-4 w-4 mr-2" />
                Restore Object
              </DropdownMenuItem>
            ) : (
              <>
                <DropdownMenuItem onClick={() => navigate(`/settings/objects/${objectType.id}/archive`)}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Object
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => navigate(`/settings/objects/${objectType.id}/delete`)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Object
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <ApplicationAssignmentDialog
        objectTypeId={objectType.id}
        objectName={objectType.name}
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
      />
    </div>
  );
}
