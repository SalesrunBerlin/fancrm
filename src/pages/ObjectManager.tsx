
import { useState } from "react";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { 
  Plus, Loader2, Building, User, Briefcase, Calendar, Box, 
  Archive, RefreshCw, Eye, Trash2, MoreHorizontal
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ObjectType } from "@/hooks/useObjectTypes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { isArchived } from "@/patches/ObjectTypePatches";
import { useAuth } from "@/contexts/AuthContext";
import { ThemedButton } from "@/components/ui/themed-button";
import { ActionColor } from "@/hooks/useActions";

export default function ObjectManager() {
  // Fetch all objects including archived ones
  const { objectTypes: allObjectTypes, isLoading, deleteObjectType, publishedObjects } = useObjectTypes();
  const { user, favoriteColor } = useAuth();
  const [activeTab, setActiveTab] = useState("all");
  const [objectToDelete, setObjectToDelete] = useState<ObjectType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filter objects to only show those owned by the current user
  // Exclude objects that are published but not owned by the user
  const filteredObjectTypes = allObjectTypes?.filter(type => 
    // Only show objects that:
    // 1. Are owned by the current user
    // 2. Are system objects
    (type.owner_id === user?.id || type.is_system) &&
    // Don't show published objects from other users
    !(type.is_published && type.owner_id !== user?.id)
  ) || [];

  // Split objects into active and archived
  const activeObjects = filteredObjectTypes.filter(obj => !isArchived(obj));
  const archivedObjects = filteredObjectTypes.filter(obj => isArchived(obj));

  const getIconComponent = (iconName: string | null) => {
    switch(iconName) {
      case 'user': return <User className="h-5 w-5" />;
      case 'building': return <Building className="h-5 w-5" />;
      case 'briefcase': return <Briefcase className="h-5 w-5" />;
      case 'calendar': return <Calendar className="h-5 w-5" />;
      default: return <Box className="h-5 w-5" />;
    }
  };

  const handleDeleteObject = (object: ObjectType, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setObjectToDelete(object);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!objectToDelete) return;
    
    try {
      await deleteObjectType.mutateAsync(objectToDelete.id);
      setIsDeleteDialogOpen(false);
      setObjectToDelete(null);
      toast.success(`${objectToDelete.name} was deleted successfully`);
    } catch (error) {
      console.error("Error deleting object type:", error);
      toast.error("Failed to delete object");
    }
  };

  // Check if an object is a source for published objects
  const isSourceForPublishedObjects = (objectId: string) => {
    return publishedObjects?.some(obj => obj.source_object_id === objectId) || false;
  };

  // Function to render action buttons as a dropdown on mobile
  const renderObjectActions = (objectType: ObjectType, isArchived: boolean = false) => {
    // For mobile screens, render actions in dropdown
    return (
      <div className="flex sm:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <ThemedButton variant="outline" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </ThemedButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isArchived ? (
              <>
                <DropdownMenuItem asChild>
                  <Link to={`/settings/objects/${objectType.id}/restore`}>
                    Restore
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to={`/settings/objects/${objectType.id}`}>
                    View
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                {!objectType.is_system && (
                  <DropdownMenuItem asChild>
                    <Link to={`/settings/objects/${objectType.id}/archive`}>
                      Archive
                    </Link>
                  </DropdownMenuItem>
                )}
              </>
            )}
            {!objectType.is_system && !isSourceForPublishedObjects(objectType.id) && (
              <DropdownMenuItem 
                className="text-red-500"
                onClick={(e) => {
                  e.preventDefault();
                  handleDeleteObject(objectType, e as unknown as React.MouseEvent);
                }}
              >
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Object Manager"
        description="Manage all your custom and standard objects"
        actions={
          <ThemedButton 
            variant={(favoriteColor as ActionColor) || "default"}
            asChild
          >
            <Link to="/settings/object-manager/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Object
            </Link>
          </ThemedButton>
        }
      />

      <Tabs 
        defaultValue="all" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="all">Active Objects</TabsTrigger>
          <TabsTrigger value="archived">Archived Objects</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Active Objects</CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : activeObjects.length > 0 ? (
                <div className="space-y-4 overflow-x-auto">
                  {activeObjects.map((objectType: ObjectType) => (
                    <div key={objectType.id} className="block min-w-0">
                      <div className="flex flex-wrap md:flex-nowrap items-center justify-between p-4 border rounded-lg">
                        <Link 
                          to={`/settings/objects/${objectType.id}`}
                          className="flex-grow min-w-0 hover:bg-accent hover:text-accent-foreground transition-colors rounded-lg p-2 -m-2"
                        >
                          <div className="flex items-center gap-3">
                            {getIconComponent(objectType.icon)}
                            <div className="min-w-0 flex-shrink">
                              <h3 className="font-medium truncate">{objectType.name}</h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {objectType.description || `API Name: ${objectType.api_name}`}
                              </p>
                            </div>
                          </div>
                        </Link>
                        
                        {/* Mobile actions dropdown */}
                        {renderObjectActions(objectType)}
                        
                        <div className="flex flex-wrap items-center mt-2 w-full md:w-auto md:mt-0 gap-2 md:ml-4">
                          <div className="flex flex-wrap gap-1">
                            {objectType.is_system && (
                              <Badge variant="secondary">System</Badge>
                            )}
                            {objectType.is_published && (
                              <Badge variant="outline">Published</Badge>
                            )}
                            {objectType.is_template && (
                              <Badge variant="outline" className="bg-purple-100">Imported</Badge>
                            )}
                            {!objectType.is_active && (
                              <Badge variant="outline" className="bg-red-50 text-red-700">Inactive</Badge>
                            )}
                          </div>
                          
                          {/* Desktop action buttons - hidden on mobile */}
                          <div className="hidden sm:flex gap-2">
                            {!objectType.is_system && (
                              <>
                                <ThemedButton 
                                  variant="outline" 
                                  size="sm"
                                  className="text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                  asChild
                                >
                                  <Link to={`/settings/objects/${objectType.id}/archive`}>
                                    <Archive className="h-4 w-4" />
                                  </Link>
                                </ThemedButton>
                                {!isSourceForPublishedObjects(objectType.id) && (
                                  <ThemedButton 
                                    variant="outline" 
                                    size="sm"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                    onClick={(e) => handleDeleteObject(objectType, e)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </ThemedButton>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No object types found. Create your first custom object to get started.
                  </p>
                  <ThemedButton 
                    variant={(favoriteColor as ActionColor) || "default"}
                    asChild
                  >
                    <Link to="/settings/object-manager/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Object
                    </Link>
                  </ThemedButton>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archived">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Archived Objects</CardTitle>
            </CardHeader>
            <CardContent className="overflow-hidden">
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : archivedObjects.length > 0 ? (
                <div className="space-y-4 overflow-x-auto">
                  {archivedObjects.map((objectType: ObjectType) => (
                    <div key={objectType.id} className="block opacity-70 hover:opacity-100 transition-opacity min-w-0">
                      <div className="flex flex-wrap md:flex-nowrap items-center justify-between p-4 border rounded-lg bg-muted/20">
                        <div className="flex items-center gap-3 min-w-0 flex-grow">
                          {getIconComponent(objectType.icon)}
                          <div className="min-w-0 flex-shrink">
                            <h3 className="font-medium truncate">{objectType.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {objectType.description || `API Name: ${objectType.api_name}`}
                            </p>
                          </div>
                        </div>
                        
                        {/* Mobile actions dropdown */}
                        {renderObjectActions(objectType, true)}
                        
                        <div className="flex flex-wrap items-center mt-2 w-full md:w-auto md:mt-0 gap-2 md:ml-4">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="bg-slate-100">Archiviert</Badge>
                            {objectType.is_system && (
                              <Badge variant="secondary">System</Badge>
                            )}
                            {objectType.is_published && (
                              <Badge variant="outline">Published</Badge>
                            )}
                          </div>
                          
                          {/* Desktop action buttons - hidden on mobile */}
                          <div className="hidden sm:flex items-center gap-2">
                            <ThemedButton 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              asChild
                            >
                              <Link to={`/settings/objects/${objectType.id}/restore`}>
                                <RefreshCw className="h-4 w-4" />
                              </Link>
                            </ThemedButton>
                            <ThemedButton 
                              variant="outline" 
                              size="sm"
                              asChild
                            >
                              <Link to={`/settings/objects/${objectType.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </ThemedButton>
                            {!objectType.is_system && !isSourceForPublishedObjects(objectType.id) && (
                              <ThemedButton 
                                variant="outline" 
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => handleDeleteObject(objectType, e)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </ThemedButton>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Keine archivierten Objekte gefunden.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title={`Delete ${objectToDelete?.name}`}
        description={`Are you sure you want to delete "${objectToDelete?.name}"? This action cannot be undone and will permanently delete this object and all of its records.`}
      />
    </div>
  );
}
