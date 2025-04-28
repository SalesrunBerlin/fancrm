
import { z } from "zod";

export const fieldEditSchema = z.object({
  name: z.string().min(2),
  api_name: z.string().min(2),
  display_field_api_name: z.string().optional(),
  target_object_type_id: z.string().optional(),
});

export type FieldEditFormData = z.infer<typeof fieldEditSchema>;
