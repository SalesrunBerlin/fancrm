
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, Settings, MoreHorizontal, Play, Edit, Trash2 } from "lucide-react";
import { useActions, Action } from "@/hooks/useActions";
import { formatDistanceToNow } from "date-fns";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

export default function ActionsPage() {
  const navigate = useNavigate();
  const { actions, deleteAction, isLoading } = useActions();
  const { objectTypes } = useObjectTypes();
  const [actionToDelete, setActionToDelete] = useState<Action | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteAction = async () => {
    if (!actionToDelete) return;
    try {
      await deleteAction.mutateAsync(actionToDelete.id);
      setIsDeleteDialogOpen(false);
      setActionToDelete(null);
    } catch (error) {
      console.error("Failed to delete action:", error);
    }
  };

  const getObjectName = (objectId: string) => {
    const objectType = objectTypes?.find(obj => obj.id === objectId);
    return objectType?.name || "Unknown Object";
  };

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'new_record':
        return 'New Record (Global)';
      case 'linked_record':
        return 'Linked Record';
      default:
        return type;
    }
  };

  const getActionTypeColor = (type: string) => {
    switch (type) {
      case 'new_record':
        return 'bg-blue-100 text-blue-800';
      case 'linked_record':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Actions"
        description="Define and manage actions for your objects"
        actions={
          <Button asChild>
            <Link to="/actions/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Action
            </Link>
          </Button>
        }
        backTo="/settings"
      />

      <Card>
        <CardHeader>
          <CardTitle>All Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : actions && actions.length > 0 ? (
            <div className="space-y-4">
              {actions.map((action) => (
                <div 
                  key={action.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-medium">{action.name}</h3>
                      <Badge className={getActionTypeColor(action.action_type)} variant="outline">
                        {getActionTypeLabel(action.action_type)}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      <span className="inline-block mr-3">
                        Object: {getObjectName(action.target_object_id)}
                      </span>
                      <span className="text-xs">
                        Created {formatDistanceToNow(new Date(action.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {action.action_type === 'new_record' && (
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/actions/execute/${action.id}`)}
                      >
                        <Play className="h-4 w-4 mr-1" /> Execute
                      </Button>
                    )}
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/actions/${action.id}`)}>
                          <Edit className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => {
                            setActionToDelete(action);
                            setIsDeleteDialogOpen(true);
                          }}
                          className="text-red-500 hover:text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No actions found. Create your first action to get started.
              </p>
              <Button asChild>
                <Link to="/actions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Action
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={`Delete Action: ${actionToDelete?.name}`}
        description="Are you sure you want to delete this action? This action cannot be undone."
        onConfirm={handleDeleteAction}
        deleteButtonText="Delete Action"
      />
    </div>
  );
}
