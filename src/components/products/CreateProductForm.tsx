
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProducts } from "@/hooks/useProducts";
import { useProductFamilies } from "@/hooks/useProductFamilies";
import { useToast } from "@/hooks/use-toast";
import { Product } from "@/types";

interface CreateProductFormProps {
  onSuccess: () => void;
}

export function CreateProductForm({ onSuccess }: CreateProductFormProps) {
  const { createProduct } = useProducts();
  const { productFamilies } = useProductFamilies();
  const { toast } = useToast();

  const form = useForm({
    defaultValues: {
      name: "",
      price: "",
      recurrence: "once" as Product["recurrence"],
      productFamilyId: undefined as string | undefined,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await createProduct.mutateAsync({
        name: data.name,
        price: parseFloat(data.price),
        recurrence: data.recurrence,
        productFamilyId: data.productFamilyId,
      });
      
      toast({
        title: "Erfolg",
        description: "Produkt wurde erfolgreich erstellt",
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Fehler",
        description: "Produkt konnte nicht erstellt werden",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Preis</FormLabel>
              <FormControl>
                <Input {...field} type="number" step="0.01" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="recurrence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Turnus</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle einen Turnus" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="once">Einmalig</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productFamilyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produktfamilie</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle eine Produktfamilie" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {productFamilies?.map((family) => (
                    <SelectItem key={family.id} value={family.id}>
                      {family.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-4">
          <Button type="submit">Erstellen</Button>
        </div>
      </form>
    </Form>
  );
}
