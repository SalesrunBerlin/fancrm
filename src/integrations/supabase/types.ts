export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      action_field_settings: {
        Row: {
          action_id: string
          created_at: string
          default_value: string | null
          display_order: number
          field_id: string
          formula_expression: string | null
          formula_type: string
          id: string
          is_enabled: boolean
          is_preselected: boolean
          updated_at: string
        }
        Insert: {
          action_id: string
          created_at?: string
          default_value?: string | null
          display_order?: number
          field_id: string
          formula_expression?: string | null
          formula_type?: string
          id?: string
          is_enabled?: boolean
          is_preselected?: boolean
          updated_at?: string
        }
        Update: {
          action_id?: string
          created_at?: string
          default_value?: string | null
          display_order?: number
          field_id?: string
          formula_expression?: string | null
          formula_type?: string
          id?: string
          is_enabled?: boolean
          is_preselected?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_field_settings_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_field_settings_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_field_relationships"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "action_field_settings_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      actions: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          source_field_id: string | null
          target_object_id: string
          updated_at: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          source_field_id?: string | null
          target_object_id: string
          updated_at?: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          source_field_id?: string | null
          target_object_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "actions_source_field_id_fkey"
            columns: ["source_field_id"]
            isOneToOne: false
            referencedRelation: "object_field_relationships"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "actions_source_field_id_fkey"
            columns: ["source_field_id"]
            isOneToOne: false
            referencedRelation: "object_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "actions_target_object_id_fkey"
            columns: ["target_object_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_default: boolean
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          account_id: string | null
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          latitude: number | null
          longitude: number | null
          owner_id: string | null
          phone: string | null
          postal_code: string | null
          street: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          latitude?: number | null
          longitude?: number | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          latitude?: number | null
          longitude?: number | null
          owner_id?: string | null
          phone?: string | null
          postal_code?: string | null
          street?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      field_display_configs: {
        Row: {
          created_at: string
          display_field_api_name: string
          field_id: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_field_api_name: string
          field_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_field_api_name?: string
          field_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_display_configs_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_field_relationships"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "field_display_configs_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      field_picklist_values: {
        Row: {
          created_at: string | null
          field_id: string
          id: string
          label: string
          order_position: number
          owner_id: string | null
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          field_id: string
          id?: string
          label: string
          order_position?: number
          owner_id?: string | null
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          field_id?: string
          id?: string
          label?: string
          order_position?: number
          owner_id?: string | null
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_picklist_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_field_relationships"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "field_picklist_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      object_application_assignments: {
        Row: {
          application_id: string
          created_at: string
          id: string
          object_type_id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          object_type_id: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          object_type_id?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_application_assignments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_application_assignments_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      object_field_publishing: {
        Row: {
          created_at: string
          field_id: string
          id: string
          is_included: boolean
          object_type_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_id: string
          id?: string
          is_included?: boolean
          object_type_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          is_included?: boolean
          object_type_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_field_publishing_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_field_relationships"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "object_field_publishing_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_field_publishing_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      object_field_values: {
        Row: {
          created_at: string | null
          field_api_name: string
          id: string
          record_id: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          field_api_name: string
          id?: string
          record_id: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          field_api_name?: string
          id?: string
          record_id?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "object_field_values_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "object_records"
            referencedColumns: ["id"]
          },
        ]
      }
      object_fields: {
        Row: {
          api_name: string
          created_at: string
          data_type: string
          default_value: Json | null
          display_order: number
          id: string
          is_required: boolean
          is_system: boolean
          name: string
          object_type_id: string
          options: Json | null
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          api_name: string
          created_at?: string
          data_type: string
          default_value?: Json | null
          display_order?: number
          id?: string
          is_required?: boolean
          is_system?: boolean
          name: string
          object_type_id: string
          options?: Json | null
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          api_name?: string
          created_at?: string
          data_type?: string
          default_value?: Json | null
          display_order?: number
          id?: string
          is_required?: boolean
          is_system?: boolean
          name?: string
          object_type_id?: string
          options?: Json | null
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_fields_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      object_records: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          last_modified_by: string | null
          object_type_id: string
          owner_id: string | null
          record_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_modified_by?: string | null
          object_type_id: string
          owner_id?: string | null
          record_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_modified_by?: string | null
          object_type_id?: string
          owner_id?: string | null
          record_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_records_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      object_relationships: {
        Row: {
          created_at: string
          from_object_id: string
          id: string
          name: string
          owner_id: string | null
          relationship_type: string
          to_object_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          from_object_id: string
          id?: string
          name: string
          owner_id?: string | null
          relationship_type: string
          to_object_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          from_object_id?: string
          id?: string
          name?: string
          owner_id?: string | null
          relationship_type?: string
          to_object_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_relationships_from_object_id_fkey"
            columns: ["from_object_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_relationships_to_object_id_fkey"
            columns: ["to_object_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      object_types: {
        Row: {
          api_name: string
          created_at: string
          default_field_api_name: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_archived: boolean
          is_published: boolean
          is_system: boolean
          is_template: boolean
          name: string
          owner_id: string | null
          show_in_navigation: boolean
          source_object_id: string | null
          updated_at: string
        }
        Insert: {
          api_name: string
          created_at?: string
          default_field_api_name?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          is_published?: boolean
          is_system?: boolean
          is_template?: boolean
          name: string
          owner_id?: string | null
          show_in_navigation?: boolean
          source_object_id?: string | null
          updated_at?: string
        }
        Update: {
          api_name?: string
          created_at?: string
          default_field_api_name?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_archived?: boolean
          is_published?: boolean
          is_system?: boolean
          is_template?: boolean
          name?: string
          owner_id?: string | null
          show_in_navigation?: boolean
          source_object_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_types_source_object_id_fkey"
            columns: ["source_object_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          role: string | null
          screen_name: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          role?: string | null
          screen_name?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          role?: string | null
          screen_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      record_field_values: {
        Row: {
          created_at: string
          field_id: string
          id: string
          record_id: string
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          field_id: string
          id?: string
          record_id: string
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          record_id?: string
          updated_at?: string
          value?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "record_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_field_relationships"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "record_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_field_values_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "object_records"
            referencedColumns: ["id"]
          },
        ]
      }
      user_color_preferences: {
        Row: {
          colors: Json
          created_at: string
          id: string
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          colors: Json
          created_at?: string
          id?: string
          theme: string
          updated_at?: string
          user_id: string
        }
        Update: {
          colors?: Json
          created_at?: string
          id?: string
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      object_field_relationships: {
        Row: {
          field_id: string | null
          field_name: string | null
          from_object_id: string | null
          target_object_name: string | null
          to_object_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "object_fields_object_type_id_fkey"
            columns: ["from_object_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      clone_object_structure: {
        Args: { source_object_id: string; new_owner_id: string }
        Returns: string
      }
      delete_system_objects: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      evaluate_action_formula: {
        Args: {
          formula_expression: string
          formula_type: string
          field_id: string
          action_id: string
        }
        Returns: string
      }
      initialize_deal_statuses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      initialize_product_families: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      initialize_standard_objects: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_published_objects_view: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      action_type: "new_record" | "linked_record"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_type: ["new_record", "linked_record"],
    },
  },
} as const
