
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDeals } from "@/hooks/useDeals";
import { useToast } from "@/hooks/use-toast";
import { DealType } from "@/types";

export function useCreateDealForm({ onSuccess }: { onSuccess: () => void }) {
  const { createDeal } = useDeals();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [associationType, setAssociationType] = useState<'account' | 'contact'>('account');

  const form = useForm<Omit<DealType, 'id' | 'accountName' | 'contactName'>>({
    defaultValues: {
      name: "",
      amount: null,
      status: "Prospect",
    },
  });

  const onSubmit = async (data: Omit<DealType, 'id' | 'accountName' | 'contactName'>) => {
    setIsLoading(true);
    try {
      await createDeal.mutateAsync(data);
      toast({
        title: "Erfolg",
        description: "Deal erfolgreich erstellt",
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating deal:", error);
      toast({
        title: "Fehler",
        description: "Deal konnte nicht erstellt werden",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    isLoading,
    associationType,
    setAssociationType,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
