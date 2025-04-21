
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/types";
import { Label } from "@/components/ui/label";
import { useProductFamilies } from "@/hooks/useProductFamilies";

interface CreateProductFormProps {
  initialData?: Product;
  onSuccess: () => void;
}

export function CreateProductForm({ initialData, onSuccess }: CreateProductFormProps) {
  const { toast } = useToast();
  const { createProduct, updateProduct } = useProducts();
  const { productFamilies } = useProductFamilies();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>({
    defaultValues: initialData ? {
      name: initialData.name,
      recurrence: initialData.recurrence,
      price: initialData.price,
      productFamilyId: initialData.productFamilyId
    } : {
      recurrence: 'monthly',
      price: 0
    }
  });

  const onSubmit = async (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    setIsSubmitting(true);
    try {
      if (initialData) {
        // Update existing product
        await updateProduct.mutateAsync({
          ...initialData,
          ...data
        });
        toast({
          title: "Erfolg",
          description: "Produkt wurde aktualisiert",
        });
      } else {
        // Create new product
        await createProduct.mutateAsync(data);
        toast({
          title: "Erfolg",
          description: "Produkt wurde erstellt",
        });
      }
      onSuccess();
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Fehler",
        description: initialData 
          ? "Produkt konnte nicht aktualisiert werden" 
          : "Produkt konnte nicht erstellt werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Produktname</Label>
        <Input 
          {...register("name", { required: "Produktname ist erforderlich" })}
          placeholder="Geben Sie einen Produktnamen ein"
        />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Preis</Label>
        <Input 
          type="number" 
          step="0.01"
          {...register("price", { 
            required: "Preis ist erforderlich",
            min: { value: 0, message: "Preis muss positiv sein" }
          })}
          placeholder="Geben Sie den Preis ein"
        />
        {errors.price && <p className="text-destructive text-sm">{errors.price.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="recurrence">Turnus</Label>
        <Select 
          value={watch("recurrence")} 
          onValueChange={(value) => setValue("recurrence", value as Product['recurrence'])}
        >
          <SelectTrigger>
            <SelectValue placeholder="Turnus auswählen" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="once">Einmalig</SelectItem>
            <SelectItem value="monthly">Monatlich</SelectItem>
            <SelectItem value="yearly">Jährlich</SelectItem>
            <SelectItem value="hourly">Stündlich</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="productFamilyId">Produktfamilie</Label>
        <Select 
          value={watch("productFamilyId") || ""} 
          onValueChange={(value) => setValue("productFamilyId", value || undefined)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Produktfamilie auswählen" />
          </SelectTrigger>
          <SelectContent>
            {productFamilies?.map((family) => (
              <SelectItem key={family.id} value={family.id}>
                {family.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {initialData ? "Produkt aktualisieren" : "Produkt erstellen"}
      </Button>
    </form>
  );
}
