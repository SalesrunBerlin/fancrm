
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateContactFormProps {
  accountId: string;
  onContactCreated: () => void;
}

export function CreateContactForm({ accountId, onContactCreated }: CreateContactFormProps) {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase
      .from("contacts")
      .insert({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        account_id: accountId
      });

    if (error) {
      toast({
        title: "Error",
        description: "Contact could not be created",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Contact created successfully"
    });

    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    onContactCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Input
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
        <div>
          <Input
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
      </div>
      <div>
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <Input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <Button type="submit">Create Contact</Button>
    </form>
  );
}
