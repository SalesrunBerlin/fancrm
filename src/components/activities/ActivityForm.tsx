
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ActivityAccountSelect } from "./ActivityAccountSelect";
import { ActivityContactSelect } from "./ActivityContactSelect";
import { ActivityDealSelect } from "./ActivityDealSelect";
import { ActivityTypeSelect } from "./ActivityTypeSelect";
import { Activity } from "@/lib/types/database";

export interface ActivityFormProps {
  onSuccess: () => void;
  initialValues?: {
    accountId?: string;
    contactId?: string;
    dealId?: string;
  };
  onSubmit?: (activityData: Partial<Activity>) => Promise<void>;
  onCancel?: () => void;
  defaultValues?: {
    type?: string;
    status?: string;
    contactId?: string;
    accountId?: string;
    dealId?: string;
  };
}

export function ActivityForm({ 
  onSuccess, 
  initialValues = {}, 
  onSubmit: externalSubmit,
  onCancel: externalCancel,
  defaultValues = {}
}: ActivityFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [outcome, setOutcome] = useState("");
  const [status, setStatus] = useState<"open" | "done" | "planned">(
    (defaultValues.status as "open" | "done" | "planned") || "open"
  );
  const [type, setType] = useState<string>(defaultValues.type || "call");
  const [accountId, setAccountId] = useState<string | null>(
    initialValues.accountId || defaultValues.accountId || null
  );
  const [contactId, setContactId] = useState<string | null>(
    initialValues.contactId || defaultValues.contactId || null
  );
  const [dealId, setDealId] = useState<string | null>(
    initialValues.dealId || defaultValues.dealId || null
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const activityData = {
      type,
      subject,
      description,
      scheduled_at: scheduledAt ? scheduledAt : null,
      outcome,
      status,
      account_id: accountId,
      contact_id: contactId,
      deal_id: dealId,
    };

    if (externalSubmit) {
      await externalSubmit(activityData);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from("activities")
        .insert({
          owner_id: user.id,
          type,
          subject,
          description,
          scheduled_at: scheduledAt ? scheduledAt : null,
          outcome,
          status,
          account_id: accountId,
          contact_id: contactId,
          deal_id: dealId,
        });

      if (error) {
        toast({
          title: "Fehler",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({ title: "Gespeichert", description: "Aktivität gespeichert." });
      setSubject("");
      setDescription("");
      setScheduledAt("");
      setOutcome("");
      setStatus("open");
      setType("call");
      setAccountId(null);
      setContactId(null);
      setDealId(null);
      onSuccess();
    } catch (error: any) {
      toast({
        title: "Fehler",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (externalCancel) {
      externalCancel();
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActivityTypeSelect value={type} onChange={setType} disabled={loading} />
        <Input
          placeholder="Betreff*"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      <div>
        <Textarea
          placeholder="Beschreibung / Notizen"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="datetime-local"
          placeholder="Termin"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          disabled={loading}
        />
        <Input
          placeholder="Ergebnis (z.B. erreicht, nicht erreicht)"
          value={outcome}
          onChange={(e) => setOutcome(e.target.value)}
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActivityAccountSelect value={accountId} onChange={setAccountId} disabled={loading} />
        <ActivityContactSelect value={contactId} onChange={setContactId} disabled={loading} />
        <ActivityDealSelect value={dealId} onChange={setDealId} disabled={loading} />
      </div>
      <div className="flex gap-4 items-center">
        <label>
          <input
            type="radio"
            name="status"
            value="open"
            checked={status === "open"}
            onChange={() => setStatus("open")}
            disabled={loading}
          />{" "}
          Offen
        </label>
        <label>
          <input
            type="radio"
            name="status"
            value="done"
            checked={status === "done"}
            onChange={() => setStatus("done")}
            disabled={loading}
          />{" "}
          Erledigt
        </label>
        <label>
          <input
            type="radio"
            name="status"
            value="planned"
            checked={status === "planned"}
            onChange={() => setStatus("planned")}
            disabled={loading}
          />{" "}
          Geplant
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Speichern..." : "Speichern"}
        </Button>
        {externalCancel && (
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            Abbrechen
          </Button>
        )}
      </div>
    </form>
  );
}
