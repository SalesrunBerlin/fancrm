import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAlertVariantClass } from "@/patches/FixAlertVariants";
import { CreateRecordForm } from "./CreateRecordForm";

interface PublicActionData {
  id: string;
  name: string;
  description: string;
  target_object_id: string;
  action_type: string;
  is_public: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export function PublicActionPageContent() {
  const { actionId } = useParams<{ actionId: string }>();
  const [action, setAction] = useState<PublicActionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicAction = async () => {
      if (!actionId) return;

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from("actions")
          .select("*")
          .eq("id", actionId)
          .eq("is_public", true)
          .single();

        if (error) throw error;

        if (!data) {
          setError("Action not found or is not public.");
          return;
        }

        setAction(data);
      } catch (err: any) {
        console.error("Error fetching public action:", err);
        setError(err.message || "Failed to load action");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublicAction();
  }, [actionId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className={getAlertVariantClass("destructive")}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!action) {
    return (
      <Alert className={getAlertVariantClass("destructive")}>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          The action you are looking for might have been deleted or is not public.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{action.name}</CardTitle>
        <CardDescription>{action.description}</CardDescription>
      </CardHeader>
      <CardContent>
        {action.action_type === "new_record" ? (
          <CreateRecordForm objectTypeId={action.target_object_id} actionId={action.id} />
        ) : (
          <Alert className={getAlertVariantClass("warning")}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This public action is not configured to create new records.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
