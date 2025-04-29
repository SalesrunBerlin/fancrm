
import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { useObjectRecords } from "@/hooks/useObjectRecords";
import { useRecordFields } from "@/hooks/useRecordFields";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Loader2, Plus } from "lucide-react";
import { RecordsTable } from "@/components/records/RecordsTable";
import { Card } from "@/components/ui/card";

export default function ObjectRecordsList() {
  const { objectTypeId } = useParams<{ objectTypeId: string }>();
  const { objectTypes } = useObjectTypes();
  const { records, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useObjectRecords(objectTypeId);
  const { fields, isLoading: isLoadingFields } = useRecordFields(objectTypeId);
  const objectType = objectTypes?.find(type => type.id === objectTypeId);
  const [allRecords, setAllRecords] = useState<any[]>([]);

  useEffect(() => {
    if (records) {
      const flattenedRecords = records.pages.flatMap(page => page);
      setAllRecords(flattenedRecords);
    }
  }, [records]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (!objectType) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={objectType.name}
        description={objectType.description || `Manage your ${objectType.name.toLowerCase()}`}
        actions={
          <Button asChild>
            <Link to={`/objects/${objectTypeId}/new`}>
              <Plus className="mr-1.5 h-4 w-4" />
              New {objectType.name}
            </Link>
          </Button>
        }
      />

      <Card className="overflow-hidden">
        {isLoading || isLoadingFields ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <RecordsTable 
            records={allRecords} 
            fields={fields} 
            objectTypeId={objectTypeId!}
          />
        )}
      </Card>

      {hasNextPage && (
        <div className="flex justify-center mt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
