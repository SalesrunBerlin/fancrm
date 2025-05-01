
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { ObjectFieldsList } from "@/components/settings/ObjectFieldsList";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft, List, Plus, Archive, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { DefaultFieldSelector } from "@/components/settings/DefaultFieldSelector";
import { useIsMobile } from "@/hooks/use-mobile";

export default function ObjectTypeDetail() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { objectTypes, updateObjectType, publishObjectType, unpublishObjectType, publishedObjects, isLoadingPublished } = useObjectTypes();
  const { fields, isLoading, createField, updateField, deleteField } = useObjectFields(objectTypeId);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Find the current object type either from user's objects or from published objects
  const currentObjectType = objectTypes?.find(obj => obj.id === objectTypeId) || 
                          publishedObjects?.find(obj => obj.id === objectTypeId);
  
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
            <Button variant="outline" onClick={() => navigate("/settings/object-manager")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Object Manager
            </Button>
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
          <div className={`flex ${isMobile ? 'flex-col w-full' : 'flex-row'} gap-2`}>
            <Button 
              variant="outline" 
              asChild 
              className={isMobile ? "w-full" : ""}
            >
              <Link to="/settings/object-manager">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Object Manager
              </Link>
            </Button>
            {!isPublishedByOthers && !currentObjectType.is_system && !isArchived && (
              <>
                <Button 
                  variant="default"
                  onClick={() => navigate(`/settings/objects/${objectTypeId}/fields/new`)}
                  className={isMobile ? "w-full" : ""}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Field
                </Button>
                <Button 
                  onClick={handleTogglePublish}
                  disabled={isPublishing}
                  variant={currentObjectType.is_published ? "outline" : "default"}
                  className={isMobile ? "w-full" : ""}
                >
                  {currentObjectType.is_published ? "Unpublish" : "Publish"}
                </Button>
                <Button 
                  variant="warning"
                  onClick={() => navigate(`/settings/objects/${objectTypeId}/archive`)}
                  className={isMobile ? "w-full" : ""}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              </>
            )}
            {isArchived && (
              <Button
                variant="success" 
                onClick={() => navigate(`/settings/objects/${objectTypeId}/restore`)}
                className={isMobile ? "w-full" : ""}
              >
                Restore
              </Button>
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
    </div>
  );
}
