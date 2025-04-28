import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useObjectRecords } from "@/hooks/useObjectRecords";

interface CreateContactFormProps {
  accountId: string;
  onContactCreated: () => void;
}

export function CreateContactForm({ accountId, onContactCreated }: CreateContactFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { createRecord } = useObjectRecords("contact_object_type_id");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    if (!user) {
      setErrorMessage("You must be logged in to create contacts");
      setIsSubmitting(false);
      return;
    }

    try {
      await createRecord.mutateAsync({
        first_name: firstName,
        last_name: lastName,
        email: email || null,
        phone: phone || null,
        account_id: accountId || null,
      });

      toast({
        title: "Success",
        description: "Contact created successfully"
      });

      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      onContactCreated();
    } catch (err) {
      console.error("Unexpected error:", err);
      setErrorMessage("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Input
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <div>
        <Input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={isSubmitting}
        />
      </div>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Contact"}
      </Button>
    </form>
  );
}
