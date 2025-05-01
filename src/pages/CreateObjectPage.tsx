
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { ObjectTypeForm } from "@/components/settings/ObjectTypeForm";

export default function CreateObjectPage() {
  const navigate = useNavigate();

  const handleComplete = () => {
    navigate("/settings/object-manager");
  };

  return (
    <div className="space-y-4 container px-4 py-4 md:px-6 md:py-6">
      <Button variant="outline" asChild>
        <Link to="/settings/object-manager">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Object Manager
        </Link>
      </Button>
      
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
