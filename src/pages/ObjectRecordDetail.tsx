
import { useParams, Link } from "react-router-dom";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function ObjectRecordDetail() {
  const { objectTypeId, recordId } = useParams<{ objectTypeId: string; recordId: string }>();
  const { objectTypes } = useObjectTypes();
  
  const objectType = objectTypes?.find(type => type.id === objectTypeId);

  if (!objectType) {
    return <div>Object type not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link to={`/objects/${objectTypeId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to {objectType.name}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-semibold">Record Details</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Record ID</label>
              <p>{recordId}</p>
            </div>
            {/* Additional fields will be rendered here dynamically */}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
