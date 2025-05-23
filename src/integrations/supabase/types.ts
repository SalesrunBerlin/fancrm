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
            referencedRelation: "action_metadata_view"
            referencedColumns: ["action_id"]
          },
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
          color: string | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          lookup_field_id: string | null
          name: string
          owner_id: string
          source_field_id: string | null
          target_object_id: string
          updated_at: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          lookup_field_id?: string | null
          name: string
          owner_id: string
          source_field_id?: string | null
          target_object_id: string
          updated_at?: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          lookup_field_id?: string | null
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
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
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
      application_imports: {
        Row: {
          created_at: string
          id: string
          import_status: string
          imported_actions_count: number
          imported_by: string
          imported_objects_count: number
          published_application_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          import_status?: string
          imported_actions_count?: number
          imported_by: string
          imported_objects_count?: number
          published_application_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          import_status?: string
          imported_actions_count?: number
          imported_by?: string
          imported_objects_count?: number
          published_application_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_imports_published_application_id_fkey"
            columns: ["published_application_id"]
            isOneToOne: false
            referencedRelation: "published_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_publishing_settings: {
        Row: {
          application_id: string
          created_at: string
          id: string
          include_actions: boolean
          include_objects: boolean
          published_application_id: string
          updated_at: string
        }
        Insert: {
          application_id: string
          created_at?: string
          id?: string
          include_actions?: boolean
          include_objects?: boolean
          published_application_id: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          created_at?: string
          id?: string
          include_actions?: boolean
          include_objects?: boolean
          published_application_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_publishing_settings_published_application_id_fkey"
            columns: ["published_application_id"]
            isOneToOne: false
            referencedRelation: "published_applications"
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
      auto_number_configurations: {
        Row: {
          created_at: string
          current_value: number
          field_id: string
          format_pattern: string
          id: string
          prefix: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: number
          field_id: string
          format_pattern?: string
          id?: string
          prefix?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: number
          field_id?: string
          format_pattern?: string
          id?: string
          prefix?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_number_configurations_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_field_relationships"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "auto_number_configurations_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_fields: {
        Row: {
          collection_id: string | null
          created_at: string
          field_api_name: string
          id: string
          object_type_id: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          field_api_name: string
          id?: string
          object_type_id?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          field_api_name?: string
          id?: string
          object_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_fields_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection_access"
            referencedColumns: ["collection_id"]
          },
          {
            foreignKeyName: "collection_fields_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "sharing_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_fields_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "collection_fields_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_members: {
        Row: {
          collection_id: string | null
          created_at: string
          id: string
          permission_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          id?: string
          permission_level: string
          updated_at?: string
          user_id: string
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          id?: string
          permission_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_members_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection_access"
            referencedColumns: ["collection_id"]
          },
          {
            foreignKeyName: "collection_members_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "sharing_collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_records: {
        Row: {
          collection_id: string | null
          created_at: string
          id: string
          record_id: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          id?: string
          record_id?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          id?: string
          record_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_records_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collection_access"
            referencedColumns: ["collection_id"]
          },
          {
            foreignKeyName: "collection_records_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "sharing_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_records_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "object_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_records_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "public_accessible_records"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "collection_records_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "shared_records"
            referencedColumns: ["record_id"]
          },
        ]
      }
      companies: {
        Row: {
          address: string
          created_at: string
          email: string | null
          id: string
          name: string
          owner_id: string | null
          phone: string | null
          source_url: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          owner_id?: string | null
          phone?: string | null
          source_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          phone?: string | null
          source_url?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "field_picklist_values_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      help_content: {
        Row: {
          content: string
          content_html: string | null
          created_at: string
          display_order: number
          id: string
          section_id: string
          section_order: number
          tab_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          content_html?: string | null
          created_at?: string
          display_order?: number
          id?: string
          section_id: string
          section_order?: number
          tab_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          content_html?: string | null
          created_at?: string
          display_order?: number
          id?: string
          section_id?: string
          section_order?: number
          tab_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "help_content_tab_id_fkey"
            columns: ["tab_id"]
            isOneToOne: false
            referencedRelation: "help_tabs"
            referencedColumns: ["tab_id"]
          },
        ]
      }
      help_tabs: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          name: string
          tab_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          name: string
          tab_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          name?: string
          tab_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      layout_fields: {
        Row: {
          created_at: string
          display_order: number
          field_id: string
          id: string
          is_visible: boolean
          layout_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          field_id: string
          id?: string
          is_visible?: boolean
          layout_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          field_id?: string
          id?: string
          is_visible?: boolean
          layout_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "layout_fields_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_field_relationships"
            referencedColumns: ["field_id"]
          },
          {
            foreignKeyName: "layout_fields_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "object_fields"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "layout_fields_layout_id_fkey"
            columns: ["layout_id"]
            isOneToOne: false
            referencedRelation: "object_layouts"
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
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
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
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
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
          {
            foreignKeyName: "object_field_values_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "public_accessible_records"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "object_field_values_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "shared_records"
            referencedColumns: ["record_id"]
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
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "object_fields_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_fields_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      object_layouts: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          object_type_id: string
          owner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          object_type_id: string
          owner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          object_type_id?: string
          owner_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "object_layouts_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "object_layouts_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_layouts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
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
            foreignKeyName: "object_records_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_records_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_records_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "object_records_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_records_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
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
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "object_relationships_from_object_id_fkey"
            columns: ["from_object_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_relationships_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_relationships_to_object_id_fkey"
            columns: ["to_object_id"]
            isOneToOne: false
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
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
            foreignKeyName: "object_types_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_types_source_object_id_fkey"
            columns: ["source_object_id"]
            isOneToOne: false
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "object_types_source_object_id_fkey"
            columns: ["source_object_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      persons: {
        Row: {
          company_id: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          owner_id: string | null
          phone: string | null
          position: string | null
          updated_at: string
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          owner_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          owner_id?: string | null
          phone?: string | null
          position?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "persons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "persons_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_level: string | null
          avatar_url: string | null
          company: string | null
          created_at: string
          created_by: string | null
          data_access: boolean | null
          email: string | null
          favorite_color: string | null
          first_name: string | null
          id: string
          is_active: boolean | null
          last_name: string | null
          metadata_access: boolean | null
          role: string | null
          screen_name: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          access_level?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          data_access?: boolean | null
          email?: string | null
          favorite_color?: string | null
          first_name?: string | null
          id: string
          is_active?: boolean | null
          last_name?: string | null
          metadata_access?: boolean | null
          role?: string | null
          screen_name?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          access_level?: string | null
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          created_by?: string | null
          data_access?: boolean | null
          email?: string | null
          favorite_color?: string | null
          first_name?: string | null
          id?: string
          is_active?: boolean | null
          last_name?: string | null
          metadata_access?: boolean | null
          role?: string | null
          screen_name?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      public_action_tokens: {
        Row: {
          action_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          name: string | null
          token: string
        }
        Insert: {
          action_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          token: string
        }
        Update: {
          action_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_action_tokens_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "action_metadata_view"
            referencedColumns: ["action_id"]
          },
          {
            foreignKeyName: "public_action_tokens_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_action_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      public_record_fields: {
        Row: {
          created_at: string
          field_api_name: string
          id: string
          is_visible: boolean
          public_record_share_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_api_name: string
          id?: string
          is_visible?: boolean
          public_record_share_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_api_name?: string
          id?: string
          is_visible?: boolean
          public_record_share_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_record_fields_public_record_share_id_fkey"
            columns: ["public_record_share_id"]
            isOneToOne: false
            referencedRelation: "public_accessible_records"
            referencedColumns: ["share_id"]
          },
          {
            foreignKeyName: "public_record_fields_public_record_share_id_fkey"
            columns: ["public_record_share_id"]
            isOneToOne: false
            referencedRelation: "public_record_shares"
            referencedColumns: ["id"]
          },
        ]
      }
      public_record_related_objects: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean
          public_record_share_id: string
          related_object_type_id: string
          relationship_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean
          public_record_share_id: string
          related_object_type_id: string
          relationship_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean
          public_record_share_id?: string
          related_object_type_id?: string
          relationship_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_record_related_objects_public_record_share_id_fkey"
            columns: ["public_record_share_id"]
            isOneToOne: false
            referencedRelation: "public_accessible_records"
            referencedColumns: ["share_id"]
          },
          {
            foreignKeyName: "public_record_related_objects_public_record_share_id_fkey"
            columns: ["public_record_share_id"]
            isOneToOne: false
            referencedRelation: "public_record_shares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_record_related_objects_related_object_type_id_fkey"
            columns: ["related_object_type_id"]
            isOneToOne: false
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "public_record_related_objects_related_object_type_id_fkey"
            columns: ["related_object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_record_related_objects_relationship_id_fkey"
            columns: ["relationship_id"]
            isOneToOne: false
            referencedRelation: "object_relationships"
            referencedColumns: ["id"]
          },
        ]
      }
      public_record_shares: {
        Row: {
          allow_edit: boolean
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          name: string | null
          object_type_id: string
          record_id: string
          token: string
          updated_at: string
        }
        Insert: {
          allow_edit?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          object_type_id: string
          record_id: string
          token: string
          updated_at?: string
        }
        Update: {
          allow_edit?: boolean
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          name?: string | null
          object_type_id?: string
          record_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "public_record_shares_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_record_shares_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "public_record_shares_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_record_shares_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "object_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "public_record_shares_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "public_accessible_records"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "public_record_shares_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "shared_records"
            referencedColumns: ["record_id"]
          },
        ]
      }
      published_application_actions: {
        Row: {
          action_id: string
          created_at: string
          id: string
          is_included: boolean
          published_application_id: string
          updated_at: string
        }
        Insert: {
          action_id: string
          created_at?: string
          id?: string
          is_included?: boolean
          published_application_id: string
          updated_at?: string
        }
        Update: {
          action_id?: string
          created_at?: string
          id?: string
          is_included?: boolean
          published_application_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_application_actions_published_application_id_fkey"
            columns: ["published_application_id"]
            isOneToOne: false
            referencedRelation: "published_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      published_application_objects: {
        Row: {
          created_at: string
          id: string
          is_included: boolean
          object_type_id: string
          published_application_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_included?: boolean
          object_type_id: string
          published_application_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_included?: boolean
          object_type_id?: string
          published_application_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "published_application_objects_published_application_id_fkey"
            columns: ["published_application_id"]
            isOneToOne: false
            referencedRelation: "published_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      published_applications: {
        Row: {
          application_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          published_by: string
          updated_at: string
          version: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          published_by: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          published_by?: string
          updated_at?: string
          version?: string | null
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
          {
            foreignKeyName: "record_field_values_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "public_accessible_records"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "record_field_values_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "shared_records"
            referencedColumns: ["record_id"]
          },
        ]
      }
      record_share_fields: {
        Row: {
          created_at: string
          field_api_name: string
          id: string
          is_visible: boolean
          record_share_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_api_name: string
          id?: string
          is_visible?: boolean
          record_share_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_api_name?: string
          id?: string
          is_visible?: boolean
          record_share_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_share_fields_record_share_id_fkey"
            columns: ["record_share_id"]
            isOneToOne: false
            referencedRelation: "record_shares"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_share_fields_record_share_id_fkey"
            columns: ["record_share_id"]
            isOneToOne: false
            referencedRelation: "shared_records"
            referencedColumns: ["share_id"]
          },
        ]
      }
      record_shares: {
        Row: {
          created_at: string
          id: string
          permission_level: string
          record_id: string | null
          shared_by_user_id: string
          shared_with_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission_level: string
          record_id?: string | null
          shared_by_user_id: string
          shared_with_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          permission_level?: string
          record_id?: string | null
          shared_by_user_id?: string
          shared_with_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_record_shares_shared_by"
            columns: ["shared_by_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_record_shares_shared_with"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_shares_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "object_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "record_shares_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "public_accessible_records"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "record_shares_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "shared_records"
            referencedColumns: ["record_id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          filters: Json | null
          id: string
          last_viewed_at: string | null
          name: string
          object_ids: string[]
          selected_fields: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          filters?: Json | null
          id?: string
          last_viewed_at?: string | null
          name: string
          object_ids: string[]
          selected_fields: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          filters?: Json | null
          id?: string
          last_viewed_at?: string | null
          name?: string
          object_ids?: string[]
          selected_fields?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      scraper_feedback: {
        Row: {
          confidence: number | null
          correct_value: string | null
          created_at: string | null
          domain: string | null
          extraction_method: string | null
          field_type: string
          html_snippet: string | null
          id: string
          initial_value: string | null
          url: string
          user_hash: string | null
        }
        Insert: {
          confidence?: number | null
          correct_value?: string | null
          created_at?: string | null
          domain?: string | null
          extraction_method?: string | null
          field_type: string
          html_snippet?: string | null
          id?: string
          initial_value?: string | null
          url: string
          user_hash?: string | null
        }
        Update: {
          confidence?: number | null
          correct_value?: string | null
          created_at?: string | null
          domain?: string | null
          extraction_method?: string | null
          field_type?: string
          html_snippet?: string | null
          id?: string
          initial_value?: string | null
          url?: string
          user_hash?: string | null
        }
        Relationships: []
      }
      sharing_collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ui_theme_profile: {
        Row: {
          accent_color: string | null
          density: string | null
          font_family: string | null
          font_weight: number | null
          font_width: number | null
          icon_pack: string | null
          logo_url: string | null
          primary_color: string | null
          profile_id: string
          radius_scale: string | null
          shadow_level: string | null
        }
        Insert: {
          accent_color?: string | null
          density?: string | null
          font_family?: string | null
          font_weight?: number | null
          font_width?: number | null
          icon_pack?: string | null
          logo_url?: string | null
          primary_color?: string | null
          profile_id: string
          radius_scale?: string | null
          shadow_level?: string | null
        }
        Update: {
          accent_color?: string | null
          density?: string | null
          font_family?: string | null
          font_weight?: number | null
          font_width?: number | null
          icon_pack?: string | null
          logo_url?: string | null
          primary_color?: string | null
          profile_id?: string
          radius_scale?: string | null
          shadow_level?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ui_theme_profile_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activities: {
        Row: {
          action: string
          activity_type: string
          created_at: string
          details: Json | null
          id: string
          object_id: string | null
          object_type: string | null
          session_id: string | null
          timestamp: string
          user_id: string
        }
        Insert: {
          action: string
          activity_type: string
          created_at?: string
          details?: Json | null
          id?: string
          object_id?: string | null
          object_type?: string | null
          session_id?: string | null
          timestamp?: string
          user_id: string
        }
        Update: {
          action?: string
          activity_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          object_id?: string | null
          object_type?: string | null
          session_id?: string | null
          timestamp?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activities_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "user_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
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
        Relationships: [
          {
            foreignKeyName: "user_color_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_connections: {
        Row: {
          config: Json
          created_at: string
          display_name: string
          encrypted_key: string | null
          id: string
          is_active: boolean
          profile_id: string
          service_type: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          display_name: string
          encrypted_key?: string | null
          id?: string
          is_active?: boolean
          profile_id: string
          service_type: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          display_name?: string
          encrypted_key?: string | null
          id?: string
          is_active?: boolean
          profile_id?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_connections_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_icons: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          height: number | null
          id: string
          name: string
          original_file_path: string | null
          processed_file_path: string | null
          svg_content: string
          updated_at: string
          user_id: string
          width: number | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          height?: number | null
          id?: string
          name: string
          original_file_path?: string | null
          processed_file_path?: string | null
          svg_content: string
          updated_at?: string
          user_id: string
          width?: number | null
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          height?: number | null
          id?: string
          name?: string
          original_file_path?: string | null
          processed_file_path?: string | null
          svg_content?: string
          updated_at?: string
          user_id?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_icons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_field_mappings: {
        Row: {
          created_at: string
          id: string
          source_field_api_name: string
          source_object_id: string
          source_user_id: string
          target_field_api_name: string
          target_object_id: string
          target_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          source_field_api_name: string
          source_object_id: string
          source_user_id: string
          target_field_api_name: string
          target_object_id: string
          target_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          source_field_api_name?: string
          source_object_id?: string
          source_user_id?: string
          target_field_api_name?: string
          target_object_id?: string
          target_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_field_mappings_source_object_id_fkey"
            columns: ["source_object_id"]
            isOneToOne: false
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "user_field_mappings_source_object_id_fkey"
            columns: ["source_object_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_field_mappings_source_user_id_fkey"
            columns: ["source_user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_field_mappings_target_object_id_fkey"
            columns: ["target_object_id"]
            isOneToOne: false
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "user_field_mappings_target_object_id_fkey"
            columns: ["target_object_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_field_mappings_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          is_active: boolean
          last_activity_time: string
          login_time: string
          logout_time: string | null
          session_duration_seconds: number | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity_time?: string
          login_time?: string
          logout_time?: string | null
          session_duration_seconds?: number | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_activity_time?: string
          login_time?: string
          logout_time?: string | null
          session_duration_seconds?: number | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_view_settings: {
        Row: {
          created_at: string
          id: string
          object_type_id: string
          settings_data: Json
          settings_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          object_type_id: string
          settings_data?: Json
          settings_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          object_type_id?: string
          settings_data?: Json
          settings_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_view_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invitations: {
        Row: {
          created_at: string
          created_by: string
          data_access: boolean | null
          email: string
          expires_at: string
          id: string
          is_used: boolean | null
          metadata_access: boolean | null
          token: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          data_access?: boolean | null
          email: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          metadata_access?: boolean | null
          token: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          data_access?: boolean | null
          email?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          metadata_access?: boolean | null
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invitations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_invitations_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_users: {
        Row: {
          can_create_actions: boolean | null
          can_create_objects: boolean | null
          can_manage_users: boolean | null
          can_modify_objects: boolean | null
          created_at: string
          id: string
          role: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          can_create_actions?: boolean | null
          can_create_objects?: boolean | null
          can_manage_users?: boolean | null
          can_modify_objects?: boolean | null
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          can_create_actions?: boolean | null
          can_create_objects?: boolean | null
          can_manage_users?: boolean | null
          can_modify_objects?: boolean | null
          created_at?: string
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workspace_users_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          owner_id: string
          primary_color: string | null
          registration_enabled: boolean
          theme: string | null
          updated_at: string
          welcome_message: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          owner_id: string
          primary_color?: string | null
          registration_enabled?: boolean
          theme?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          owner_id?: string
          primary_color?: string | null
          registration_enabled?: boolean
          theme?: string | null
          updated_at?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workspaces_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "auth_users_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      action_metadata_view: {
        Row: {
          action_id: string | null
          action_name: string | null
          action_type: Database["public"]["Enums"]["action_type"] | null
          color: string | null
          description: string | null
          is_public: boolean | null
          lookup_field_api_name: string | null
          lookup_field_id: string | null
          lookup_field_name: string | null
          source_field_api_name: string | null
          source_field_id: string | null
          source_field_name: string | null
          target_object_api_name: string | null
          target_object_id: string | null
          target_object_name: string | null
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
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
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
      admin_user_session_stats: {
        Row: {
          avg_session_duration: number | null
          email: string | null
          first_name: string | null
          last_login: string | null
          last_name: string | null
          role: string | null
          total_activities: number | null
          total_duration_seconds: number | null
          total_sessions: number | null
        }
        Relationships: []
      }
      auth_users_view: {
        Row: {
          email: string | null
          id: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
        }
        Relationships: []
      }
      collection_access: {
        Row: {
          collection_id: string | null
          collection_name: string | null
          description: string | null
          object_type_id: string | null
          permission_level: string | null
          record_id: string | null
          user_id: string | null
          visible_fields: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_records_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "object_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_records_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "public_accessible_records"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "collection_records_record_id_fkey"
            columns: ["record_id"]
            isOneToOne: false
            referencedRelation: "shared_records"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "object_records_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "object_records_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
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
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "object_fields_object_type_id_fkey"
            columns: ["from_object_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      object_lookup_display_values: {
        Row: {
          display_value: string | null
          field_api_name: string | null
          lookup_record_id: string | null
          target_object_type_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "object_field_values_record_id_fkey"
            columns: ["lookup_record_id"]
            isOneToOne: false
            referencedRelation: "object_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_field_values_record_id_fkey"
            columns: ["lookup_record_id"]
            isOneToOne: false
            referencedRelation: "public_accessible_records"
            referencedColumns: ["record_id"]
          },
          {
            foreignKeyName: "object_field_values_record_id_fkey"
            columns: ["lookup_record_id"]
            isOneToOne: false
            referencedRelation: "shared_records"
            referencedColumns: ["record_id"]
          },
        ]
      }
      public_accessible_records: {
        Row: {
          allow_edit: boolean | null
          expires_at: string | null
          is_active: boolean | null
          object_type_id: string | null
          record_id: string | null
          share_id: string | null
          token: string | null
        }
        Relationships: [
          {
            foreignKeyName: "object_records_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "object_records_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_records: {
        Row: {
          object_type_id: string | null
          permission_level: string | null
          record_id: string | null
          share_id: string | null
          shared_with_user_id: string | null
          visible_fields: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_record_shares_shared_with"
            columns: ["shared_with_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "object_records_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_lookup_display_values"
            referencedColumns: ["target_object_type_id"]
          },
          {
            foreignKeyName: "object_records_object_type_id_fkey"
            columns: ["object_type_id"]
            isOneToOne: false
            referencedRelation: "object_types"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      admin_create_user: {
        Args: {
          email?: string
          password?: string
          first_name?: string
          last_name?: string
          workspace_id?: string
          metadata_access?: boolean
          data_access?: boolean
        }
        Returns: string
      }
      clone_object_structure: {
        Args: { source_object_id: string; new_owner_id: string }
        Returns: string
      }
      create_workspace_invitation: {
        Args: {
          workspace_id: string
          email: string
          metadata_access?: boolean
          data_access?: boolean
          expiry_days?: number
        }
        Returns: string
      }
      decrypt_api_key: {
        Args: { p_encrypted_key: string; p_secret: string }
        Returns: {
          decrypted_key: string
        }[]
      }
      decrypt_connection: {
        Args: { p_connection_id: string; p_secret: string }
        Returns: {
          service_type: string
          decrypted_key: string
        }[]
      }
      delete_published_objects: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      delete_system_objects: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      encrypt_api_key: {
        Args: { p_key: string; p_secret: string }
        Returns: {
          encrypted_key: string
        }[]
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
      extract_domain: {
        Args: { url: string }
        Returns: string
      }
      generate_auto_number: {
        Args: { field_id: string; prefix?: string; format_pattern?: string }
        Returns: string
      }
      get_all_picklist_values: {
        Args: { object_type_id: string }
        Returns: {
          field_id: string
          picklist_values: Json
        }[]
      }
      get_auth_logs: {
        Args: { target_user_id: string }
        Returns: {
          log_timestamp: number
          event_message: string
        }[]
      }
      get_public_related_records: {
        Args: {
          p_record_id: string
          p_related_object_type_id: string
          p_relationship_id: string
        }
        Returns: {
          id: string
          record_id: string
          object_type_id: string
          created_at: string
          updated_at: string
          owner_id: string
          created_by: string
          last_modified_by: string
          field_values: Json
        }[]
      }
      get_public_visible_fields: {
        Args: { p_token: string; p_record_id: string }
        Returns: {
          field_api_name: string
        }[]
      }
      get_public_visible_related_objects: {
        Args: { p_token: string; p_record_id: string }
        Returns: {
          related_object_type_id: string
          relationship_id: string
        }[]
      }
      get_user_collection_membership: {
        Args: { user_uuid: string; collection_uuid: string }
        Returns: boolean
      }
      get_user_connection_types: {
        Args: Record<PropertyKey, never>
        Returns: {
          service_type: string
          has_connection: boolean
          display_name: string
          connection_id: string
          is_active: boolean
        }[]
      }
      get_user_emails: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
        }[]
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
      is_record_publicly_accessible: {
        Args: { p_token: string; p_record_id: string }
        Returns: boolean
      }
      refresh_published_objects_view: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      store_encrypted_connection: {
        Args: {
          p_service_type: string
          p_display_name: string
          p_api_key: string
          p_config: Json
          p_secret: string
        }
        Returns: boolean
      }
      swap_tab_order: {
        Args: {
          tab_id_1: string
          tab_id_2: string
          new_order_1: number
          new_order_2: number
        }
        Returns: undefined
      }
      sync_user_emails_to_profiles: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_openai_usage: {
        Args: {
          p_profile_id: string
          p_prompt_tokens: number
          p_completion_tokens: number
        }
        Returns: undefined
      }
      user_is_admin_or_superadmin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      user_is_collection_member: {
        Args: { collection_uuid: string }
        Returns: boolean
      }
      user_owns_collection: {
        Args: { collection_uuid: string }
        Returns: boolean
      }
      user_owns_collection_safe: {
        Args: { collection_uuid: string; user_uuid: string }
        Returns: boolean
      }
      user_owns_workspace: {
        Args: { workspace_id: string }
        Returns: boolean
      }
    }
    Enums: {
      action_type: "new_record" | "linked_record" | "mass_action"
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
      action_type: ["new_record", "linked_record", "mass_action"],
    },
  },
} as const
