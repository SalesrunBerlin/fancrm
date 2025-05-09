
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useObjectType } from "@/hooks/useObjectType";
import { useRouter } from "@/hooks/useRouter";

interface QuickCreateListProps {
  objectTypeId: string;
  nameFieldApiName: string;
}

export function QuickCreateList({ objectTypeId, nameFieldApiName }: QuickCreateListProps) {
  const [items, setItems] = useState<any[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const { user } = useAuth();
  const { objectType } = useObjectType(objectTypeId);
  const router = useRouter();
  
  // Load existing items when component mounts
  useEffect(() => {
    if (objectTypeId) {
      loadItems();
    }
  }, [objectTypeId]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const { data: records, error } = await supabase
        .from("object_records")
        .select(`
          id,
          record_id,
          object_field_values (
            field_api_name,
            value
          )
        `)
        .eq("object_type_id", objectTypeId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Process and set items
      setItems(records || []);
    } catch (error) {
      console.error("Error loading items:", error);
      toast.error("Failed to load items");
    } finally {
      setIsLoading(false);
    }
  };

  const createItem = async () => {
    if (!newItemName.trim() || !objectTypeId || !user) return;
    
    setIsCreating(true);
    try {
      // First create the record
      const { data: record, error: recordError } = await supabase
        .from("object_records")
        .insert({
          object_type_id: objectTypeId,
          owner_id: user.id,
          created_by: user.id,
          last_modified_by: user.id
        })
        .select()
        .single();

      if (recordError) throw recordError;

      // Then add the field value
      const { error: fieldError } = await supabase
        .from("object_field_values")
        .insert({
          record_id: record.id,
          field_api_name: nameFieldApiName,
          value: newItemName
        });

      if (fieldError) throw fieldError;

      // Add new item to the list
      setItems((prevItems) => [{
        id: record.id,
        record_id: record.record_id,
        object_field_values: [{ 
          field_api_name: nameFieldApiName, 
          value: newItemName 
        }]
      }, ...prevItems]);
      
      setNewItemName(""); // Clear input
      toast.success("Item created successfully");
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Failed to create item");
    } finally {
      setIsCreating(false);
    }
  };

  // Get display name for an item
  const getItemName = (item: any) => {
    const nameField = item.object_field_values?.find(
      (fv: any) => fv.field_api_name === nameFieldApiName
    );
    return nameField?.value || `Item ${item.record_id || ''}`;
  };
  
  // Navigate to item detail
  const viewItem = (itemId: string) => {
    router.push(`/objects/${objectTypeId}/${itemId}`);
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder={`New ${objectType?.name || 'Item'} Name...`}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            disabled={isCreating}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newItemName.trim()) {
                createItem();
              }
            }}
          />
          <Button 
            onClick={createItem} 
            disabled={!newItemName.trim() || isCreating}
          >
            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            <span className="ml-2">Add</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2 mt-4">
            {items.length > 0 ? (
              items.map((item) => (
                <div 
                  key={item.id}
                  className="p-3 border rounded-lg flex justify-between items-center hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
                  onClick={() => viewItem(item.id)}
                >
                  <span className="font-medium">{getItemName(item)}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              ))
            ) : (
              <div className="text-center p-8 text-muted-foreground">
                No items found. Create your first one above.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
