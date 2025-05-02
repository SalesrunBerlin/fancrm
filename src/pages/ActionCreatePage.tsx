
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/ui/page-header";
import { ActionForm } from "@/components/actions/ActionForm";
import { useActions } from "@/hooks/useActions";
import { useObjectTypes } from "@/hooks/useObjectTypes";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";

export default function ActionCreatePage() {
  const navigate = useNavigate();
  const { createAction, isLoading } = useActions();
  const { objectTypes } = useObjectTypes();
  const [error, setError] = useState<string | null>(null);

  const activeObjectOptions = objectTypes
    ?.filter((obj) => obj.is_active && !obj.is_archived)
    .map((obj) => ({
      id: obj.id,
      name: obj.name,
    })) || [];

  const handleSubmit = async (data: any) => {
    try {
      setError(null);
      const result = await createAction.mutateAsync(data);
      navigate(`/actions/${result.id}`);
    } catch (err: any) {
      setError(err.message || "Failed to create action");
    }
  };

  if (!objectTypes) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Action"
        description="Define a new action for your objects"
        backTo="/actions"
      />

      {error && (
        <Alert className={getAlertVariantClass("destructive")}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <ActionForm
            objects={activeObjectOptions}
            onSubmit={handleSubmit}
            isSubmitting={isLoading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
