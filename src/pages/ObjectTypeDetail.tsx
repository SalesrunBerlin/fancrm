import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { RecordDetailForm } from "@/components/records/RecordDetailForm";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { RelatedRecordsSection } from "@/components/records/RelatedRecordsSection";
import { useRecordDetail } from "@/hooks/useRecordDetail";
import { RecordDeleteDialog } from "@/components/records/RecordDeleteDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ObjectTypeDetail() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDeleteId, setRecordToDeleteId] = useState<string | null>(null);
  const [isPublishingDialogOpen, setIsPublishingDialogOpen] = useState(false);

  const {
    isLoading,
    objectType,
    fields,
    records,
    deleteRecord,
    updateObjectType,
    publishObjectType,
    unpublishObjectType,
    defaultFieldApiName,
  } = useObjectRecords(objectTypeId || "");

  const handleCreateRecord = () => {
    navigate(`/objects/${objectTypeId}/new`);
  };

  const handleImportRecords = () => {
    navigate(`/objects/${objectTypeId}/import`);
  };

  const handleEditObjectType = () => {
    navigate(`/settings/objects/${objectTypeId}`);
  };

  const handleFieldEdit = (fieldId: string) => {
    navigate(`/settings/objects/${objectTypeId}/fields/${fieldId}/edit`);
  };

  const handleNewField = () => {
    navigate(`/settings/objects/${objectTypeId}/fields/new`);
  };

  const handleDeleteRecord = (recordId: string) => {
    setRecordToDeleteId(recordId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteRecord = async () => {
    if (recordToDeleteId) {
      await deleteRecord.mutateAsync(recordToDeleteId);
      setIsDeleteDialogOpen(false);
      setRecordToDeleteId(null);
    }
  };

  const handlePublishToggle = () => {
    setIsPublishingDialogOpen(true);
  };

  const handlePublish = async () => {
    if (!objectType) return;

    if (objectType.is_published) {
      await unpublishObjectType.mutateAsync(objectType.id);
    } else {
      await publishObjectType.mutateAsync(objectType.id);
    }

    setIsPublishingDialogOpen(false);
  };

  if (isLoading || !objectType) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title={objectType.name}
          description={objectType.description || "No description provided."}
        />
        <div className="flex gap-2">
          <Button onClick={handleCreateRecord}>Create Record</Button>
          <Button onClick={handleImportRecords}>Import Records</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                Actions <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Object Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleEditObjectType}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit Object</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleNewField}>
                <PlusCircle className="mr-2 h-4 w-4" />
                <span>Add Field</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePublishToggle}>
                {objectType.is_published ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    <span>Unpublish</span>
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    <span>Publish</span>
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete Object</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <PublishingConfigDialog
        objectTypeId={objectType.id}
        isPublished={objectType.is_published}
        onPublish={handlePublish}
        onUnpublish={handlePublish}
        open={isPublishingDialogOpen}
        onOpenChange={setIsPublishingDialogOpen}
      />

      <RecordDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDeleteRecord}
      />

      <div className="grid grid-cols-1 gap-6">
        {fields && fields.length > 0 ? (
          <ObjectRecordsTable
            records={records || []}
            fields={fields}
            objectTypeId={objectTypeId || ""}
            onEdit={handleFieldEdit}
            onDelete={handleDeleteRecord}
            defaultFieldApiName={defaultFieldApiName}
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>No Fields Defined</CardTitle>
              <CardDescription>
                This object type has no fields defined. Add some fields to start
                collecting data.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleNewField}>Add First Field</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface ObjectRecordsTableProps {
  records: any[];
  fields: any[];
  objectTypeId: string;
  onEdit: (fieldId: string) => void;
  onDelete: (recordId: string) => void;
  defaultFieldApiName?: string;
}

function ObjectRecordsTable({
  records,
  fields,
  objectTypeId,
  onEdit,
  onDelete,
  defaultFieldApiName,
}: ObjectRecordsTableProps) {
  const navigate = useNavigate();

  const handleRowClick = (recordId: string) => {
    navigate(`/objects/${objectTypeId}/${recordId}`);
  };

  return (
    <div className="relative overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">
              {fields.find(f => f.api_name === defaultFieldApiName)?.name || 'Name'}
            </TableHead>
            {fields
              .filter(f => f.api_name !== defaultFieldApiName)
              .map((field) => (
                <TableHead key={field.id}>{field.name}</TableHead>
              ))}
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow
              key={record.id}
              onClick={() => handleRowClick(record.id)}
              className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
            >
              <TableCell className="font-medium">
                {record.field_values[defaultFieldApiName || 'name']}
              </TableCell>
              {fields
                .filter(f => f.api_name !== defaultFieldApiName)
                .map((field) => (
                  <TableCell key={field.id}>
                    {record.field_values[field.api_name]}
                  </TableCell>
                ))}
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        navigate(`/objects/${objectTypeId}/${record.id}/edit`)
                      }
                    >
                      <Edit className="mr-2 h-4 w-4" /> <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onEdit(record.id)}
                    >
                      <Settings className="mr-2 h-4 w-4" /> <span>Edit Fields</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(record.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

