
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useDeals } from "@/hooks/useDeals";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { DealEditForm } from "@/components/deals/DealEditForm";
import { DeleteDialog } from "@/components/common/DeleteDialog";
import { useToast } from "@/hooks/use-toast";
import { DealProducts } from "@/components/deals/DealProducts";

export default function DealDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams();
  const { data: deals, deleteDeal } = useDeals();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const deal = deals ? deals.find(d => d.id === id) : undefined;

  const handleDelete = async () => {
    try {
      await deleteDeal.mutateAsync(id!);
      toast({
        title: "Erfolg",
        description: "Deal wurde gelöscht",
      });
      navigate("/deals");
    } catch (error) {
      console.error("Error deleting deal:", error);
      toast({
        title: "Fehler",
        description: "Deal konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  if (!deal) {
    return <div className="p-4">Deal nicht gefunden</div>;
  }

  if (isEditing) {
    return (
      <div className="space-y-6 p-6 animate-fade-in">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => setIsEditing(false)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <DealEditForm 
          deal={deal} 
          onSuccess={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div className="space-x-2">
          <Button 
            variant="secondary"
            size="icon"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button 
            variant="destructive"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Betrag</h3>
              <p className="text-lg font-semibold">{formatCurrency(deal.amount)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <p className="text-lg font-semibold">{deal.status}</p>
            </div>
          </div>

          {deal.accountName && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Account</h3>
              <p className="text-lg">{deal.accountName}</p>
            </div>
          )}

          {deal.contactName && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Kontakt</h3>
              <p className="text-lg">{deal.contactName}</p>
            </div>
          )}

          {deal.closeDate && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Abschlussdatum</h3>
              <p className="text-lg">{new Date(deal.closeDate).toLocaleDateString()}</p>
            </div>
          )}
        </div>
      </Card>

      <DealProducts dealId={id!} />

      <DeleteDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Deal löschen"
        description="Sind Sie sicher, dass Sie diesen Deal löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </div>
  );
}
