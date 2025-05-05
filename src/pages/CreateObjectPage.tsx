
import { useNavigate, Link } from "react-router-dom";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ObjectTypeForm } from "@/components/settings/ObjectTypeForm";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { toast } from "sonner";
import { ThemedButton } from "@/components/ui/themed-button";

export default function CreateObjectPage() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      toast.error("Authentication required", {
        description: "You must be logged in to create objects"
      });
      // We don't redirect here to avoid an abrupt navigation
      // Just show the warning in the UI
    }
  }, [user, isLoading]);

  const handleComplete = () => {
    navigate("/settings/object-manager");
  };

  return (
    <div className="space-y-4 container px-4 py-4 md:px-6 md:py-6">
      <ThemedButton variant="outline" asChild>
        <Link to="/settings/object-manager">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Object Manager
        </Link>
      </ThemedButton>
      
      {!isLoading && !user && (
        <div className="p-4 mb-4 bg-yellow-100 text-yellow-800 rounded-md">
          <h3 className="font-bold">Authentication Required</h3>
          <p>You need to be logged in to create and manage objects.</p>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">Create New Object</h1>
        </CardHeader>
        <CardContent>
          <ObjectTypeForm onComplete={handleComplete} />
        </CardContent>
      </Card>
    </div>
  );
}
