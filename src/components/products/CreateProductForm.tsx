
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
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

  const form = useForm<Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'productFamily'>>({
    defaultValues: {
      name: '',
      recurrence: 'once',
      price: 0,
      productFamilyId: undefined
    }
  });

  const onSubmit = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'productFamily'>) => {
    try {
      await createProduct.mutateAsync(data);
      toast({
        title: "Erfolg",
        description: "Produkt erfolgreich erstellt"
      });
      onSuccess();
    } catch (error) {
      console.error("Error creating product:", error);
      toast({
        title: "Fehler",
        description: "Produkt konnte nicht erstellt werden",
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Produktname</FormLabel>
              <FormControl>
                <Input placeholder="Name des Produkts" {...field} />
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
                <Input 
                  type="number" 
                  placeholder="Preis" 
                  {...field} 
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Turnus wählen" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="hourly">Stündlich</SelectItem>
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
                    <SelectValue placeholder="Produktfamilie wählen" />
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

        <Button type="submit" className="w-full">
          Produkt erstellen
        </Button>
      </form>
    </Form>
  );
}
