
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { ObjectFieldsList } from "@/components/settings/ObjectFieldsList";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft, List, Plus, Archive, Loader2, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { DefaultFieldSelector } from "@/components/settings/DefaultFieldSelector";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemedButton } from "@/components/ui/themed-button";
import { AddFieldSheet } from "@/components/records/AddFieldSheet";
import { useObjectType } from "@/hooks/useObjectType";

export default function ObjectTypeDetail() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { objectTypes, updateObjectType, publishObjectType, unpublishObjectType, publishedObjects, isLoadingPublished } = useObjectTypes();
  const { fields, isLoading, createField, updateField, deleteField, refetch } = useObjectFields(objectTypeId);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showAddFieldSheet, setShowAddFieldSheet] = useState(false);
  
  // Use useObjectType hook for direct access to a single object type
  const { objectType: singleObjectType } = useObjectType(objectTypeId || '');
  
  // Find the current object type either from user's objects or from published objects
  const currentObjectType = 
    singleObjectType || 
    objectTypes?.find(obj => obj.id === objectTypeId) || 
    publishedObjects?.find(obj => obj.id === objectTypeId);
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast.success("Fields refreshed");
  };
  
  // Show loading state while data is being fetched
  if (isLoading || isLoadingPublished) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!currentObjectType) {
    return (
      <div>
        <PageHeader
          title="Object Type Not Found"
          description="The requested object type does not exist or is not accessible."
          actions={
            <ThemedButton variant="outline" onClick={() => navigate("/settings/object-manager")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="md:inline">Back to Object Manager</span>
            </ThemedButton>
          }
        />
      </div>
    );
  }

  const handleTogglePublish = async () => {
    if (!objectTypeId) return;
    
    try {
      setIsPublishing(true);
      if (currentObjectType.is_published) {
        await unpublishObjectType.mutateAsync(objectTypeId);
      } else {
        await publishObjectType.mutateAsync(objectTypeId);
      }
    } catch (error) {
      console.error("Error toggling publish status:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleManagePicklistValues = (fieldId: string) => {
    // This would be implemented to handle managing picklist values
    console.log("Managing picklist values for field:", fieldId);
    // You could navigate to another page or open a dialog here
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      await deleteField.mutateAsync(fieldId);
      toast.success("Field deleted successfully");
    } catch (error) {
      console.error("Error deleting field:", error);
      toast.error("Failed to delete field");
    }
  };

  const handleUpdateDefaultField = async (fieldApiName: string) => {
    if (!objectTypeId) return;
    
    await updateObjectType.mutateAsync({
      id: objectTypeId,
      default_field_api_name: fieldApiName
    });
  };

  // Check if the current user owns this object
  const isPublishedByOthers = publishedObjects?.some(obj => obj.id === objectTypeId) || false;
  const isArchived = currentObjectType.is_archived;

  return (
    <div className="container mx-auto px-2 md:px-0 space-y-6 max-w-5xl overflow-x-hidden">
      <PageHeader
        title={currentObjectType.name}
        description={currentObjectType.description || `API Name: ${currentObjectType.api_name}`}
        actions={
          <div className="flex flex-row gap-2 w-full justify-end">
            <ThemedButton 
              variant="outline" 
              size="responsive"
              asChild
            >
              <Link to="/settings/object-manager">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden md:inline">Back</span>
              </Link>
            </ThemedButton>
            
            <ThemedButton
              variant="outline"
              size="responsive"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">Refresh</span>
            </ThemedButton>
            
            {!isPublishedByOthers && !currentObjectType.is_system && !isArchived && (
              <>
                <ThemedButton 
                  variant="default"
                  size="responsive"
                  onClick={() => setShowAddFieldSheet(true)}
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden md:inline">New Field</span>
                </ThemedButton>
                <ThemedButton 
                  onClick={handleTogglePublish}
                  disabled={isPublishing}
                  size="responsive"
                  variant={currentObjectType.is_published ? "outline" : "default"}
                >
                  <List className="h-4 w-4" />
                  <span className="hidden md:inline">
                    {currentObjectType.is_published ? "Unpublish" : "Publish"}
                  </span>
                </ThemedButton>
                <ThemedButton 
                  variant="warning"
                  size="responsive"
                  onClick={() => navigate(`/settings/objects/${objectTypeId}/archive`)}
                >
                  <Archive className="h-4 w-4" />
                  <span className="hidden md:inline">Archive</span>
                </ThemedButton>
              </>
            )}
            {isArchived && (
              <ThemedButton
                variant="success" 
                size="responsive"
                onClick={() => navigate(`/settings/objects/${objectTypeId}/restore`)}
              >
                <Archive className="h-4 w-4" />
                <span className="hidden md:inline">Restore</span>
              </ThemedButton>
            )}
          </div>
        }
      />
      
      {/* Only show the field selector for objects that can be edited */}
      {!isPublishedByOthers && !currentObjectType.is_system && fields && (
        <DefaultFieldSelector
          objectType={currentObjectType}
          fields={fields}
          onUpdateDefaultField={handleUpdateDefaultField}
          isMobile={isMobile}
        />
      )}
      
      <div className="overflow-x-auto">
        <ObjectFieldsList 
          fields={fields || []} 
          objectTypeId={objectTypeId as string} 
          isLoading={isLoading}
          onManagePicklistValues={handleManagePicklistValues}
          onDeleteField={!currentObjectType.is_system && !isPublishedByOthers ? handleDeleteField : undefined}
        />
      </div>

      {/* Add New Field Sheet */}
      <AddFieldSheet
        open={showAddFieldSheet}
        onOpenChange={setShowAddFieldSheet}
        objectTypeId={objectTypeId as string}
        onFieldCreated={() => {
          refetch();
          toast.success("New field created successfully");
        }}
      />
    </div>
  );
}
