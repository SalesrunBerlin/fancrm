
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PublicRecordShare {
  id: string;
  record_id: string;
  object_type_id: string;
  token: string;
  name?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  expires_at?: string;
  is_active: boolean;
  allow_edit: boolean;
}

export interface PublicRecordField {
  id: string;
  public_record_share_id: string;
  field_api_name: string;
  is_visible: boolean;
}

export interface PublicRecordRelatedObject {
  id: string;
  public_record_share_id: string;
  related_object_type_id: string;
  relationship_id: string;
  is_visible: boolean;
}

export interface CreateShareInput {
  recordId: string;
  objectTypeId: string;
  name?: string;
  expiresAt?: Date | null;
  allowEdit?: boolean;
  fields: { field_api_name: string; is_visible: boolean }[];
  relatedObjects: { related_object_type_id: string; relationship_id: string; is_visible: boolean }[];
}

export function usePublicRecordShares(recordId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch shares for a specific record
  const { data: shares, isLoading, error } = useQuery({
    queryKey: ["public-record-shares", recordId],
    queryFn: async () => {
      if (!recordId || !user) return [];

      const { data, error } = await supabase
        .from("public_record_shares")
        .select("*")
        .eq("record_id", recordId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as PublicRecordShare[];
    },
    enabled: !!recordId && !!user,
  });

  // Fetch fields for a specific share
  const getShareFields = async (shareId: string) => {
    const { data, error } = await supabase
      .from("public_record_fields")
      .select("*")
      .eq("public_record_share_id", shareId);

    if (error) throw error;
    return data as PublicRecordField[];
  };

  // Fetch related objects for a specific share
  const getShareRelatedObjects = async (shareId: string) => {
    const { data, error } = await supabase
      .from("public_record_related_objects")
      .select("*")
      .eq("public_record_share_id", shareId);

    if (error) throw error;
    return data as PublicRecordRelatedObject[];
  };

  // Generate a unique token
  const generateToken = () => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  };

  // Create a new public share
  const createShare = useMutation({
    mutationFn: async ({
      recordId,
      objectTypeId,
      name,
      expiresAt,
      allowEdit = false,
      fields,
      relatedObjects,
    }: CreateShareInput) => {
      if (!user) throw new Error("You must be logged in to create a public share");

      // Generate a unique token for this share
      const token = generateToken();

      // Create the share record
      const { data: share, error: shareError } = await supabase
        .from("public_record_shares")
        .insert({
          record_id: recordId,
          object_type_id: objectTypeId,
          token,
          name,
          created_by: user.id,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          is_active: true,
          allow_edit: allowEdit,
        })
        .select()
        .single();

      if (shareError) throw shareError;

      // Create field visibility records
      if (fields && fields.length > 0) {
        const fieldRecords = fields.map((field) => ({
          public_record_share_id: share.id,
          field_api_name: field.field_api_name,
          is_visible: field.is_visible,
        }));

        const { error: fieldsError } = await supabase
          .from("public_record_fields")
          .insert(fieldRecords);

        if (fieldsError) throw fieldsError;
      }

      // Create related object visibility records
      if (relatedObjects && relatedObjects.length > 0) {
        const relatedRecords = relatedObjects.map((object) => ({
          public_record_share_id: share.id,
          related_object_type_id: object.related_object_type_id,
          relationship_id: object.relationship_id,
          is_visible: object.is_visible,
        }));

        const { error: relatedError } = await supabase
          .from("public_record_related_objects")
          .insert(relatedRecords);

        if (relatedError) throw relatedError;
      }

      return share as PublicRecordShare;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["public-record-shares", recordId],
      });
      toast.success("Public share created successfully");
    },
    onError: (error: any) => {
      console.error("Error creating public share:", error);
      toast.error("Failed to create public share", {
        description: error.message,
      });
    },
  });

  // Update an existing share
  const updateShare = useMutation({
    mutationFn: async ({
      shareId,
      name,
      expiresAt,
      isActive,
      allowEdit,
    }: {
      shareId: string;
      name?: string;
      expiresAt?: Date | null;
      isActive?: boolean;
      allowEdit?: boolean;
    }) => {
      const updateData: Partial<PublicRecordShare> = {};
      
      if (name !== undefined) updateData.name = name;
      if (expiresAt !== undefined) updateData.expires_at = expiresAt ? expiresAt.toISOString() : null;
      if (isActive !== undefined) updateData.is_active = isActive;
      if (allowEdit !== undefined) updateData.allow_edit = allowEdit;

      const { data, error } = await supabase
        .from("public_record_shares")
        .update(updateData)
        .eq("id", shareId)
        .select()
        .single();

      if (error) throw error;
      return data as PublicRecordShare;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["public-record-shares", recordId],
      });
      toast.success("Public share updated successfully");
    },
    onError: (error: any) => {
      console.error("Error updating public share:", error);
      toast.error("Failed to update public share", {
        description: error.message,
      });
    },
  });

  // Delete a share
  const deleteShare = useMutation({
    mutationFn: async (shareId: string) => {
      const { error } = await supabase
        .from("public_record_shares")
        .delete()
        .eq("id", shareId);

      if (error) throw error;
      return shareId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["public-record-shares", recordId],
      });
      toast.success("Public share deleted successfully");
    },
    onError: (error: any) => {
      console.error("Error deleting public share:", error);
      toast.error("Failed to delete public share", {
        description: error.message,
      });
    },
  });

  // Update field visibility
  const updateFieldVisibility = useMutation({
    mutationFn: async ({
      shareId,
      fields,
    }: {
      shareId: string;
      fields: { field_api_name: string; is_visible: boolean }[];
    }) => {
      // First, delete existing field settings for this share
      const { error: deleteError } = await supabase
        .from("public_record_fields")
        .delete()
        .eq("public_record_share_id", shareId);

      if (deleteError) throw deleteError;

      // Then insert new field settings
      const fieldRecords = fields.map((field) => ({
        public_record_share_id: shareId,
        field_api_name: field.field_api_name,
        is_visible: field.is_visible,
      }));

      const { data, error } = await supabase
        .from("public_record_fields")
        .insert(fieldRecords)
        .select();

      if (error) throw error;
      return data as PublicRecordField[];
    },
    onSuccess: () => {
      toast.success("Field visibility updated successfully");
    },
    onError: (error: any) => {
      console.error("Error updating field visibility:", error);
      toast.error("Failed to update field visibility", {
        description: error.message,
      });
    },
  });

  // Update related objects visibility
  const updateRelatedObjectsVisibility = useMutation({
    mutationFn: async ({
      shareId,
      relatedObjects,
    }: {
      shareId: string;
      relatedObjects: { related_object_type_id: string; relationship_id: string; is_visible: boolean }[];
    }) => {
      // First, delete existing related objects settings for this share
      const { error: deleteError } = await supabase
        .from("public_record_related_objects")
        .delete()
        .eq("public_record_share_id", shareId);

      if (deleteError) throw deleteError;

      // Then insert new related objects settings
      const relatedRecords = relatedObjects.map((object) => ({
        public_record_share_id: shareId,
        related_object_type_id: object.related_object_type_id,
        relationship_id: object.relationship_id,
        is_visible: object.is_visible,
      }));

      const { data, error } = await supabase
        .from("public_record_related_objects")
        .insert(relatedRecords)
        .select();

      if (error) throw error;
      return data as PublicRecordRelatedObject[];
    },
    onSuccess: () => {
      toast.success("Related objects visibility updated successfully");
    },
    onError: (error: any) => {
      console.error("Error updating related objects visibility:", error);
      toast.error("Failed to update related objects visibility", {
        description: error.message,
      });
    },
  });

  return {
    shares,
    isLoading,
    error,
    getShareFields,
    getShareRelatedObjects,
    createShare,
    updateShare,
    deleteShare,
    updateFieldVisibility,
    updateRelatedObjectsVisibility,
  };
}
