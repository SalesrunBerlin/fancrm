
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectFields } from "@/hooks/useObjectFields";
import { ObjectFieldsList } from "@/components/settings/ObjectFieldsList";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ArrowLeft, List, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { ObjectField } from "@/hooks/useObjectTypes";

export default function ObjectTypeDetail() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const { objectTypes, updateObjectType, publishObjectType, unpublishObjectType } = useObjectTypes();
  const { fields, isLoading, createField, updateField, deleteField } = useObjectFields(objectTypeId);
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Find the current object type
  const currentObjectType = objectTypes?.find(obj => obj.id === objectTypeId);
  
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

  return (
    <div className="container mx-auto px-2 md:px-0 space-y-6 max-w-5xl">
      <PageHeader
        title={currentObjectType.name}
        description={currentObjectType.description || `API Name: ${currentObjectType.api_name}`}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/settings/object-manager">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Object Manager
              </Link>
            </Button>
            <Button 
              variant="default"
              onClick={() => navigate(`/settings/objects/${objectTypeId}/fields/new`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New Field
            </Button>
            {!currentObjectType.is_system && (
              <Button 
                onClick={handleTogglePublish}
                disabled={isPublishing}
                variant={currentObjectType.is_published ? "outline" : "default"}
              >
                {currentObjectType.is_published ? "Unpublish" : "Publish"}
              </Button>
            )}
          </>
        }
      />
      
      <ObjectFieldsList 
        fields={fields || []} 
        objectTypeId={objectTypeId as string} 
        isLoading={isLoading}
        onManagePicklistValues={handleManagePicklistValues}
      />
    </div>
  );
}
