
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Save, Trash2, Loader2, Settings, Check } from "lucide-react";
import { ObjectLayout, useObjectLayouts } from "@/hooks/useObjectLayouts";
import { LayoutField, useLayoutFields } from "@/hooks/useLayoutFields";
import { LayoutForm } from "./LayoutForm";
import { LayoutFieldEditor } from "./LayoutFieldEditor";
import { useObjectFields } from "@/hooks/useObjectFields";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";

interface LayoutManagerProps {
  objectTypeId: string;
}

export function LayoutManager({ objectTypeId }: LayoutManagerProps) {
  const [activeTab, setActiveTab] = useState<string>("default");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [currentLayout, setCurrentLayout] = useState<ObjectLayout | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [layoutToDelete, setLayoutToDelete] = useState<ObjectLayout | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { 
    layouts, 
    isLoading: isLoadingLayouts,
    createLayout,
    updateLayout,
    deleteLayout,
    getDefaultLayout,
    refetch: refetchLayouts
  } = useObjectLayouts(objectTypeId);

  const { fields, isLoading: isLoadingFields } = useObjectFields(objectTypeId);

  const { 
    layoutFields, 
    isLoading: isLoadingLayoutFields,
    initializeLayoutFields,
    updateLayoutField,
    updateMultipleFieldOrders
  } = useLayoutFields(activeTab !== "default" ? activeTab : undefined);

  // Set active tab when layouts are loaded
  useEffect(() => {
    if (!isLoadingLayouts && layouts.length > 0) {
      const defaultLayout = getDefaultLayout();
      if (defaultLayout) {
        setActiveTab(defaultLayout.id);
      }
    }
  }, [isLoadingLayouts, layouts]);

  const handleCreateLayout = async (values: any) => {
    try {
      const newLayout = await createLayout.mutateAsync({
        object_type_id: objectTypeId,
        name: values.name,
        description: values.description || null,
        is_default: values.is_default
      });

      // Initialize the layout with all the fields
      if (fields && fields.length > 0) {
        await initializeLayoutFields.mutateAsync({
          layoutId: newLayout.id,
          objectTypeId,
          fields
        });
      }

      setDialogOpen(false);
      setActiveTab(newLayout.id);
      toast.success("Layout created successfully");
    } catch (error) {
      console.error("Error creating layout:", error);
      toast.error("Failed to create layout");
    }
  };

  const handleUpdateLayout = async (values: any) => {
    if (!currentLayout) return;
    
    try {
      await updateLayout.mutateAsync({
        id: currentLayout.id,
        name: values.name,
        description: values.description,
        is_default: values.is_default
      });

      setDialogOpen(false);
      refetchLayouts();
    } catch (error) {
      console.error("Error updating layout:", error);
      toast.error("Failed to update layout");
    }
  };

  const handleDeleteLayout = async () => {
    if (!layoutToDelete) return;
    
    try {
      await deleteLayout.mutateAsync(layoutToDelete.id);
      setDeleteDialogOpen(false);
      
      // If we're deleting the active layout, switch to default
      if (activeTab === layoutToDelete.id) {
        const defaultLayout = layouts.find(l => l.id !== layoutToDelete.id);
        if (defaultLayout) {
          setActiveTab(defaultLayout.id);
        } else {
          setActiveTab("default");
        }
      }
    } catch (error) {
      console.error("Error deleting layout:", error);
      toast.error("Failed to delete layout");
    }
  };

  const openCreateDialog = () => {
    setDialogMode("create");
    setCurrentLayout(null);
    setDialogOpen(true);
  };

  const openEditDialog = (layout: ObjectLayout) => {
    setDialogMode("edit");
    setCurrentLayout(layout);
    setDialogOpen(true);
  };

  const confirmDelete = (layout: ObjectLayout) => {
    setLayoutToDelete(layout);
    setDeleteDialogOpen(true);
  };

  const handleMoveUp = async (layoutFieldId: string, currentOrder: number) => {
    // Find the field above this one
    const fieldAbove = layoutFields.find(
      field => field.display_order === currentOrder - 1
    );

    if (!fieldAbove) return;

    setIsSaving(true);
    try {
      // Update both fields
      await updateMultipleFieldOrders.mutateAsync([
        { id: layoutFieldId, display_order: currentOrder - 1 },
        { id: fieldAbove.id, display_order: currentOrder }
      ]);
    } catch (error) {
      console.error("Error moving field up:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMoveDown = async (layoutFieldId: string, currentOrder: number) => {
    // Find the field below this one
    const fieldBelow = layoutFields.find(
      field => field.display_order === currentOrder + 1
    );

    if (!fieldBelow) return;

    setIsSaving(true);
    try {
      // Update both fields
      await updateMultipleFieldOrders.mutateAsync([
        { id: layoutFieldId, display_order: currentOrder + 1 },
        { id: fieldBelow.id, display_order: currentOrder }
      ]);
    } catch (error) {
      console.error("Error moving field down:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleVisibility = async (layoutFieldId: string, isCurrentlyVisible: boolean) => {
    setIsSaving(true);
    try {
      await updateLayoutField.mutateAsync({
        id: layoutFieldId,
        is_visible: !isCurrentlyVisible
      });
    } catch (error) {
      console.error("Error toggling visibility:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isLoadingLayouts || isLoadingFields || isLoadingLayoutFields || isSaving;

  if (isLoadingLayouts) {
    return (
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Layouts</CardTitle>
            <CardDescription>
              Customize how fields appear in forms and detail views
            </CardDescription>
          </div>
          <Button onClick={openCreateDialog} variant="default" size="sm">
            <Plus className="mr-1 h-4 w-4" /> Add Layout
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {layouts.length === 0 ? (
          <div className="p-6 text-center border-t">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-muted mb-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-lg mb-2">No layouts created yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Create layouts to customize how fields are displayed in detail and form views
            </p>
            <Button onClick={openCreateDialog} variant="default">
              Create your first layout
            </Button>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b px-3">
              <TabsList className="bg-transparent h-auto p-0">
                {layouts.map(layout => (
                  <TabsTrigger
                    key={layout.id}
                    value={layout.id}
                    className="data-[state=active]:border-b-primary data-[state=active]:border-b-2 data-[state=active]:shadow-none rounded-none h-10 px-4"
                  >
                    {layout.name}
                    {layout.is_default && (
                      <Check className="ml-1 h-3 w-3 text-green-500" />
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {layouts.map(layout => (
              <TabsContent 
                key={layout.id}
                value={layout.id} 
                className="p-4 focus-visible:outline-none focus-visible:ring-0"
              >
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-lg font-medium">{layout.name}</h3>
                    {layout.description && (
                      <p className="text-muted-foreground text-sm">{layout.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => openEditDialog(layout)} 
                      variant="outline" 
                      size="sm"
                    >
                      <Settings className="mr-1 h-4 w-4" /> Edit Layout
                    </Button>
                    <Button
                      onClick={() => confirmDelete(layout)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Field Order & Visibility</h4>
                  <LayoutFieldEditor
                    fields={fields || []}
                    layoutFields={layoutFields || []}
                    isLoading={isLoading}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onToggleVisibility={handleToggleVisibility}
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="bg-muted/50 py-3 px-6 border-t">
        <p className="text-xs text-muted-foreground">
          Layouts determine the field order and visibility in forms and detail views.
        </p>
      </CardFooter>

      {/* Layout Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "create" ? "Create Layout" : "Edit Layout"}
            </DialogTitle>
          </DialogHeader>
          <LayoutForm
            objectTypeId={objectTypeId}
            layout={currentLayout || undefined}
            onSubmit={dialogMode === "create" ? handleCreateLayout : handleUpdateLayout}
            isSubmitting={dialogMode === "create" ? createLayout.isPending : updateLayout.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex items-center">
                <AlertCircle className="text-destructive mr-2 h-5 w-5" />
                Delete Layout
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the "{layoutToDelete?.name}" layout? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLayout} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteLayout.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Layout'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
