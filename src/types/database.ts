export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: boolean
          tax_rate: number
        }
        Insert: {
          id?: boolean
          tax_rate?: number
        }
        Update: {
          id?: boolean
          tax_rate?: number
        }
        Relationships: []
      }
      area_pictures: {
        Row: {
          area_id: string
          id: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          area_id: string
          id?: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          area_id?: string
          id?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "area_pictures_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "job_site_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_type: string
          actor_user_id: string | null
          changes: Json
          client_id: string | null
          correlation_id: string | null
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          occurred_at: string
          outcome: string
          reason: string | null
        }
        Insert: {
          action: string
          actor_type?: string
          actor_user_id?: string | null
          changes?: Json
          client_id?: string | null
          correlation_id?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          outcome?: string
          reason?: string | null
        }
        Update: {
          action?: string
          actor_type?: string
          actor_user_id?: string | null
          changes?: Json
          client_id?: string | null
          correlation_id?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          outcome?: string
          reason?: string | null
        }
        Relationships: []
      }
      auth_rate_limit_buckets: {
        Row: {
          action: string
          attempt_count: number
          blocked_until: string | null
          bucket_key: string
          captcha_required: boolean
          denied_count: number
          expires_at: string
          last_attempt_at: string
          metadata: Json
          risk_score: number
          window_started_at: string
        }
        Insert: {
          action: string
          attempt_count?: number
          blocked_until?: string | null
          bucket_key: string
          captcha_required?: boolean
          denied_count?: number
          expires_at: string
          last_attempt_at?: string
          metadata?: Json
          risk_score?: number
          window_started_at?: string
        }
        Update: {
          action?: string
          attempt_count?: number
          blocked_until?: string | null
          bucket_key?: string
          captcha_required?: boolean
          denied_count?: number
          expires_at?: string
          last_attempt_at?: string
          metadata?: Json
          risk_score?: number
          window_started_at?: string
        }
        Relationships: []
      }
      business_settings: {
        Row: {
          created_at: string
          is_public: boolean
          key: string
          label_en: string | null
          label_es: string | null
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          is_public?: boolean
          key: string
          label_en?: string | null
          label_es?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          is_public?: boolean
          key?: string
          label_en?: string | null
          label_es?: string | null
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      catalog_items: {
        Row: {
          active: boolean
          created_at: string
          default_price: number
          id: string
          kind: Database["public"]["Enums"]["catalog_item_kind"]
          name: string
          taxable: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_price?: number
          id?: string
          kind: Database["public"]["Enums"]["catalog_item_kind"]
          name: string
          taxable?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          default_price?: number
          id?: string
          kind?: Database["public"]["Enums"]["catalog_item_kind"]
          name?: string
          taxable?: boolean
        }
        Relationships: []
      }
      client_billing_info: {
        Row: {
          billing_address: string | null
          billing_email: string | null
          billing_name: string | null
          billing_phone: string | null
          client_id: string
          created_at: string
          notes: string | null
          payment_terms: string | null
          updated_at: string
        }
        Insert: {
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_phone?: string | null
          client_id: string
          created_at?: string
          notes?: string | null
          payment_terms?: string | null
          updated_at?: string
        }
        Update: {
          billing_address?: string | null
          billing_email?: string | null
          billing_name?: string | null
          billing_phone?: string | null
          client_id?: string
          created_at?: string
          notes?: string | null
          payment_terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_billing_info_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_documents: {
        Row: {
          client_id: string
          id: string
          name: string
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          client_id: string
          id?: string
          name: string
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          client_id?: string
          id?: string
          name?: string
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          company: string | null
          created_at: string
          email: string | null
          facility_type: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          role: string | null
          services_required: string[] | null
          status: Database["public"]["Enums"]["client_status"]
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email?: string | null
          facility_type?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          role?: string | null
          services_required?: string[] | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string | null
          facility_type?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          role?: string | null
          services_required?: string[] | null
          status?: Database["public"]["Enums"]["client_status"]
          updated_at?: string
        }
        Relationships: []
      }
      discounts: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          type: Database["public"]["Enums"]["discount_type"]
          value: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          type: Database["public"]["Enums"]["discount_type"]
          value: number
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          type?: Database["public"]["Enums"]["discount_type"]
          value?: number
        }
        Relationships: []
      }
      document_sequences: {
        Row: {
          code: string
          next_value: number
          padding: number
          prefix: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          code: string
          next_value?: number
          padding?: number
          prefix: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          code?: string
          next_value?: number
          padding?: number
          prefix?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_category_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_category_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_category_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          expense_date: string
          id: string
          job_site_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          job_site_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          job_site_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_job_site_id_fkey"
            columns: ["job_site_id"]
            isOneToOne: false
            referencedRelation: "job_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          completed_at: string | null
          created_at: string
          error_code: string | null
          expires_at: string
          id: string
          key: string
          operation: string
          request_hash: string
          response_entity_id: string | null
          response_entity_type: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          expires_at: string
          id?: string
          key: string
          operation: string
          request_hash: string
          response_entity_id?: string | null
          response_entity_type?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_code?: string | null
          expires_at?: string
          id?: string
          key?: string
          operation?: string
          request_hash?: string
          response_entity_id?: string | null
          response_entity_type?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      job_site_areas: {
        Row: {
          condition: Database["public"]["Enums"]["area_condition"]
          created_at: string
          frequency: Database["public"]["Enums"]["frequency_type"] | null
          id: string
          job_site_id: string
          name: string
          notes: string | null
          size: Database["public"]["Enums"]["area_size"]
          type: string | null
        }
        Insert: {
          condition?: Database["public"]["Enums"]["area_condition"]
          created_at?: string
          frequency?: Database["public"]["Enums"]["frequency_type"] | null
          id?: string
          job_site_id: string
          name: string
          notes?: string | null
          size?: Database["public"]["Enums"]["area_size"]
          type?: string | null
        }
        Update: {
          condition?: Database["public"]["Enums"]["area_condition"]
          created_at?: string
          frequency?: Database["public"]["Enums"]["frequency_type"] | null
          id?: string
          job_site_id?: string
          name?: string
          notes?: string | null
          size?: Database["public"]["Enums"]["area_size"]
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_site_areas_job_site_id_fkey"
            columns: ["job_site_id"]
            isOneToOne: false
            referencedRelation: "job_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      job_sites: {
        Row: {
          address: string
          client_id: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          contact_role: string | null
          created_at: string
          estimated_duration_minutes: number
          frequency: Database["public"]["Enums"]["frequency_type"]
          frequency_days: Database["public"]["Enums"]["weekday"][] | null
          id: string
          name: string
          notes: string | null
          preferred_end_time: string | null
          preferred_start_time: string
          service_amount: number | null
          staff_payment_amount: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["job_site_status"]
          updated_at: string
        }
        Insert: {
          address: string
          client_id: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          created_at?: string
          estimated_duration_minutes?: number
          frequency: Database["public"]["Enums"]["frequency_type"]
          frequency_days?: Database["public"]["Enums"]["weekday"][] | null
          id?: string
          name: string
          notes?: string | null
          preferred_end_time?: string | null
          preferred_start_time: string
          service_amount?: number | null
          staff_payment_amount?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_site_status"]
          updated_at?: string
        }
        Update: {
          address?: string
          client_id?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          contact_role?: string | null
          created_at?: string
          estimated_duration_minutes?: number
          frequency?: Database["public"]["Enums"]["frequency_type"]
          frequency_days?: Database["public"]["Enums"]["weekday"][] | null
          id?: string
          name?: string
          notes?: string | null
          preferred_end_time?: string | null
          preferred_start_time?: string
          service_amount?: number | null
          staff_payment_amount?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["job_site_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_sites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      job_staff_assignments: {
        Row: {
          created_at: string
          id: string
          job_site_id: string
          payment_amount: number
          staff_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_site_id: string
          payment_amount: number
          staff_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_site_id?: string
          payment_amount?: number
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_staff_assignments_job_site_id_fkey"
            columns: ["job_site_id"]
            isOneToOne: false
            referencedRelation: "job_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_staff_assignments_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_recovery_codes: {
        Row: {
          batch_id: string
          code_hash: string
          confirmed_at: string | null
          created_at: string
          id: string
          reserved_at: string | null
          reserved_until: string | null
          revocation_reason: string | null
          revoked_at: string | null
          status: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          batch_id: string
          code_hash: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          reserved_at?: string | null
          reserved_until?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          batch_id?: string
          code_hash?: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          reserved_at?: string | null
          reserved_until?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          code: string
          created_at: string
          description_en: string
          description_es: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          description_en: string
          description_es: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          description_en?: string
          description_es?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profile_status_history: {
        Row: {
          changed_at: string
          changed_by: string | null
          from_status: string | null
          id: string
          profile_id: string
          reason: string | null
          to_status: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          from_status?: string | null
          id?: string
          profile_id: string
          reason?: string | null
          to_status: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          from_status?: string | null
          id?: string
          profile_id?: string
          reason?: string | null
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_status_history_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          display_name: string
          first_name: string | null
          id: string
          last_activity_at: string | null
          last_name: string | null
          mfa_recovery_codes_confirmed_at: string | null
          phone: string | null
          preferred_language: string
          status: string
          time_zone: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          display_name: string
          first_name?: string | null
          id: string
          last_activity_at?: string | null
          last_name?: string | null
          mfa_recovery_codes_confirmed_at?: string | null
          phone?: string | null
          preferred_language?: string
          status?: string
          time_zone?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          display_name?: string
          first_name?: string | null
          id?: string
          last_activity_at?: string | null
          last_name?: string | null
          mfa_recovery_codes_confirmed_at?: string | null
          phone?: string | null
          preferred_language?: string
          status?: string
          time_zone?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_line_items: {
        Row: {
          amount: number
          description: string
          id: string
          quote_id: string
          sort_order: number
          taxable: boolean
        }
        Insert: {
          amount: number
          description: string
          id?: string
          quote_id: string
          sort_order?: number
          taxable?: boolean
        }
        Update: {
          amount?: number
          description?: string
          id?: string
          quote_id?: string
          sort_order?: number
          taxable?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "quote_line_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_responses: {
        Row: {
          accepted_by_email: string | null
          accepted_by_name: string | null
          accepted_by_role: string | null
          action: Database["public"]["Enums"]["quote_response_action"]
          created_at: string
          id: string
          quote_id: string
          reason: string | null
        }
        Insert: {
          accepted_by_email?: string | null
          accepted_by_name?: string | null
          accepted_by_role?: string | null
          action: Database["public"]["Enums"]["quote_response_action"]
          created_at?: string
          id?: string
          quote_id: string
          reason?: string | null
        }
        Update: {
          accepted_by_email?: string | null
          accepted_by_name?: string | null
          accepted_by_role?: string | null
          action?: Database["public"]["Enums"]["quote_response_action"]
          created_at?: string
          id?: string
          quote_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quote_responses_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          amount: number
          created_at: string
          id: string
          job_site_id: string
          notes: string | null
          pdf_url: string | null
          responded_at: string | null
          sent_at: string | null
          share_token: string
          status: Database["public"]["Enums"]["quote_status"]
          tax_amount: number
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: string
          job_site_id: string
          notes?: string | null
          pdf_url?: string | null
          responded_at?: string | null
          sent_at?: string | null
          share_token?: string
          status?: Database["public"]["Enums"]["quote_status"]
          tax_amount?: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          job_site_id?: string
          notes?: string | null
          pdf_url?: string | null
          responded_at?: string | null
          sent_at?: string | null
          share_token?: string
          status?: Database["public"]["Enums"]["quote_status"]
          tax_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_job_site_id_fkey"
            columns: ["job_site_id"]
            isOneToOne: false
            referencedRelation: "job_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          granted_at: string
          granted_by: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_system: boolean
          name_en: string
          name_es: string
          rank: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name_en: string
          name_es: string
          rank: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_system?: boolean
          name_en?: string
          name_es?: string
          rank?: number
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          event_type: string
          id: string
          ip_hash: string | null
          metadata: Json
          occurred_at: string
          outcome: string
          reviewed_at: string | null
          reviewed_by: string | null
          risk_signals: Json
          session_id: string | null
          severity: string
          user_agent_summary: string | null
          user_id: string | null
        }
        Insert: {
          event_type: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          occurred_at?: string
          outcome: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_signals?: Json
          session_id?: string | null
          severity?: string
          user_agent_summary?: string | null
          user_id?: string | null
        }
        Update: {
          event_type?: string
          id?: string
          ip_hash?: string | null
          metadata?: Json
          occurred_at?: string
          outcome?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_signals?: Json
          session_id?: string | null
          severity?: string
          user_agent_summary?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_areas: {
        Row: {
          area_type: string
          city: string | null
          country_code: string
          county: string | null
          created_at: string
          effective_from: string | null
          effective_until: string | null
          id: string
          name: string
          postal_code: string | null
          state_code: string
          status: string
          surcharge_cents: number
          updated_at: string
        }
        Insert: {
          area_type: string
          city?: string | null
          country_code?: string
          county?: string | null
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          name: string
          postal_code?: string | null
          state_code?: string
          status?: string
          surcharge_cents?: number
          updated_at?: string
        }
        Update: {
          area_type?: string
          city?: string | null
          country_code?: string
          county?: string | null
          created_at?: string
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          name?: string
          postal_code?: string | null
          state_code?: string
          status?: string
          surcharge_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          phone: string | null
          status: Database["public"]["Enums"]["staff_status"]
          type: Database["public"]["Enums"]["staff_type"]
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          phone?: string | null
          status?: Database["public"]["Enums"]["staff_status"]
          type: Database["public"]["Enums"]["staff_type"]
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["staff_status"]
          type?: Database["public"]["Enums"]["staff_type"]
        }
        Relationships: []
      }
      tax_jurisdictions: {
        Row: {
          city: string | null
          code: string
          country_code: string
          county: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          state_code: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          code: string
          country_code?: string
          county?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          state_code?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          code?: string
          country_code?: string
          county?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          state_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tax_rates: {
        Row: {
          created_at: string
          effective_from: string
          effective_until: string | null
          id: string
          jurisdiction_id: string
          rate: number
          source_reference: string | null
          tax_type: string
          updated_at: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          effective_from: string
          effective_until?: string | null
          id?: string
          jurisdiction_id: string
          rate: number
          source_reference?: string | null
          tax_type: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          effective_from?: string
          effective_until?: string | null
          id?: string
          jurisdiction_id?: string
          rate?: number
          source_reference?: string | null
          tax_type?: string
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_rates_jurisdiction_id_fkey"
            columns: ["jurisdiction_id"]
            isOneToOne: false
            referencedRelation: "tax_jurisdictions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          intended_role_id: string
          invitation_scope: Json
          invited_by: string
          normalized_email: string | null
          revoked_at: string | null
          revoked_by: string | null
          status: string
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          intended_role_id: string
          invitation_scope?: Json
          invited_by: string
          normalized_email?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          intended_role_id?: string
          invitation_scope?: Json
          invited_by?: string
          normalized_email?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          status?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_intended_role_id_fkey"
            columns: ["intended_role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          ends_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          revocation_reason: string | null
          revoked_at: string | null
          revoked_by: string | null
          role_id: string
          starts_at: string
          status: string
          user_id: string
        }
        Insert: {
          ends_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_id: string
          starts_at?: string
          status?: string
          user_id: string
        }
        Update: {
          ends_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          revocation_reason?: string | null
          revoked_at?: string | null
          revoked_by?: string | null
          role_id?: string
          starts_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_logs: {
        Row: {
          created_at: string
          id: string
          job_site_id: string
          notes: string | null
          payment_amount: number
          staff_id: string
          updated_at: string
          work_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_site_id: string
          notes?: string | null
          payment_amount: number
          staff_id: string
          updated_at?: string
          work_date: string
        }
        Update: {
          created_at?: string
          id?: string
          job_site_id?: string
          notes?: string | null
          payment_amount?: number
          staff_id?: string
          updated_at?: string
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_logs_job_site_id_fkey"
            columns: ["job_site_id"]
            isOneToOne: false
            referencedRelation: "job_sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_job: { Args: { p_job_site_id: string }; Returns: undefined }
      admin_activate_converted_account: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_id: string
          p_correlation_id?: string
          p_location_id: string
        }
        Returns: Json
      }
      admin_activate_existing_client_jobsite: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_address_line1: string
          p_address_line2: string
          p_city: string
          p_correlation_id?: string
          p_country: string
          p_idempotency_key: string
          p_location_name: string
          p_postal_code: string
          p_quote_id: string
          p_service_area_id: string
          p_state: string
          p_timezone: string
        }
        Returns: Json
      }
      admin_add_catalog_item_to_quote: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_catalog_item_id: string
          p_correlation_id?: string
          p_description: string
          p_quantity: number
          p_quote_id: string
          p_quote_version_id: string
          p_taxable: boolean
          p_unit: string
          p_unit_price_cents: number
          p_visible_to_client: boolean
        }
        Returns: string
      }
      admin_add_client_contact: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_id: string
          p_correlation_id?: string
          p_duplicate_reviewed: boolean
          p_email: string
          p_existing_contact_id: string
          p_full_name: string
          p_is_primary: boolean
          p_job_title: string
          p_phone: string
          p_preferred_locale: string
          p_reason: string
          p_relationship_label: string
        }
        Returns: Json
      }
      admin_add_commercial_activity: {
        Args: {
          p_activity_type: string
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_due_at?: string
          p_notes?: string
          p_occurred_at?: string
          p_prospect_id: string
          p_responsible_user_id?: string
          p_summary: string
        }
        Returns: string
      }
      admin_add_prospect_contact: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_contact_name: string
          p_correlation_id?: string
          p_email?: string
          p_is_primary?: boolean
          p_phone?: string
          p_prospect_id: string
        }
        Returns: string
      }
      admin_add_quote_line_item: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_description: string
          p_item_type: string
          p_quantity: number
          p_quote_id: string
          p_quote_version_id: string
          p_taxable: boolean
          p_unit: string
          p_unit_price_cents: number
          p_visible_to_client?: boolean
        }
        Returns: string
      }
      admin_add_walkthrough_area: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_approximate_dimensions?: string
          p_area_type?: string
          p_condition?: string
          p_correlation_id?: string
          p_name: string
          p_notes?: string
          p_requested_frequency?: string
          p_special_requirements?: string
          p_walkthrough_id: string
        }
        Returns: string
      }
      admin_add_walkthrough_requirement: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_description: string
          p_material_or_equipment?: string
          p_priority?: string
          p_quote_impact?: string
          p_requirement_type: string
          p_risk?: string
          p_walkthrough_id: string
        }
        Returns: string
      }
      admin_apply_quote_tax_rates: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_quote_id: string
          p_quote_version_id: string
          p_tax_rate_ids: string[]
        }
        Returns: Json
      }
      admin_approve_quote_for_send: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_quote_id: string
          p_quote_version_id: string
          p_reason?: string
        }
        Returns: boolean
      }
      admin_archive_staff_availability: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_availability_id: string
          p_correlation_id: string
          p_expected_version: number
          p_reason: string
        }
        Returns: Json
      }
      admin_archive_walkthrough_area: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_area_id: string
          p_correlation_id?: string
          p_reason: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_archive_walkthrough_requirement: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_reason: string
          p_requirement_id: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_assign_role: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_ends_at?: string
          p_profile_id: string
          p_reason?: string
          p_role_code: string
        }
        Returns: string
      }
      admin_assign_staff_to_job: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_assignment_role: string
          p_correlation_id: string
          p_idempotency_key: string
          p_job_id: string
          p_override_reason: string
          p_staff_member_ids: string[]
        }
        Returns: Json
      }
      admin_assign_staff_to_jobsite: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id: string
          p_location_id: string
          p_reason: string
          p_staff_member_id: string
          p_starts_on: string
        }
        Returns: Json
      }
      admin_assign_staff_to_jobsite_v2: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id: string
          p_location_id: string
          p_reason: string
          p_staff_member_id: string
          p_starts_on: string
          p_worker_pay_amount_cents: number
          p_worker_pay_custom: string
          p_worker_pay_mode: string
          p_worker_pay_percentage: number
        }
        Returns: Json
      }
      admin_audit_location_access_instruction_denial: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_instruction_id: string
          p_reason_code: string
        }
        Returns: undefined
      }
      admin_cancel_walkthrough: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_reason: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_change_client_location_status: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_expected_version: number
          p_location_id: string
          p_reason: string
          p_status: string
        }
        Returns: Json
      }
      admin_change_client_status: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_id: string
          p_correlation_id?: string
          p_expected_version: number
          p_reason: string
          p_status: string
        }
        Returns: Json
      }
      admin_change_location_access_instruction_status: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_expected_version: number
          p_instruction_id: string
          p_reason: string
          p_status: string
        }
        Returns: Json
      }
      admin_change_prospect_status: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_new_status: string
          p_prospect_id: string
          p_reason?: string
        }
        Returns: string
      }
      admin_change_service_status: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_expected_version: number
          p_reason: string
          p_service_id: string
          p_status: string
        }
        Returns: Json
      }
      admin_change_staff_status: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id: string
          p_expected_version: number
          p_reason: string
          p_staff_member_id: string
          p_status: string
        }
        Returns: Json
      }
      admin_claim_quote_delivery: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_channel: string
          p_correlation_id?: string
          p_idempotency_key: string
          p_prospect_contact_id: string
          p_quote_id: string
          p_quote_version_id: string
        }
        Returns: Json
      }
      admin_complete_quote_delivery: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_delivery_id: string
          p_manual_method?: string
          p_outcome: string
          p_provider?: string
          p_provider_message_id?: string
          p_safe_error_code?: string
        }
        Returns: Json
      }
      admin_complete_walkthrough: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_confirm_recurring_job_generation: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_confirmation_week_start: string
          p_correlation_id?: string
          p_holiday_review_confirmed: boolean
          p_reason: string
          p_schedule_rule_id: string
          p_service_id: string
        }
        Returns: Json
      }
      admin_convert_accepted_quote_to_client: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_address_line1: string
          p_address_line2: string
          p_billing_city: string
          p_billing_country: string
          p_billing_line1: string
          p_billing_line2: string
          p_billing_postal_code: string
          p_billing_state: string
          p_city: string
          p_client_type: string
          p_correlation_id?: string
          p_country: string
          p_idempotency_key: string
          p_legal_name: string
          p_location_name: string
          p_postal_code: string
          p_preferred_locale: string
          p_quote_id: string
          p_service_area_id: string
          p_state: string
          p_timezone: string
          p_trade_name: string
        }
        Returns: Json
      }
      admin_create_client: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_billing_city: string
          p_billing_country: string
          p_billing_line1: string
          p_billing_line2: string
          p_billing_postal_code: string
          p_billing_state: string
          p_client_type: string
          p_correlation_id?: string
          p_general_email: string
          p_general_phone: string
          p_internal_notes: string
          p_legal_name: string
          p_payment_terms: string
          p_preferred_locale: string
          p_responsible_user_id: string
          p_trade_name: string
        }
        Returns: Json
      }
      admin_create_client_location: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_address_line1: string
          p_address_line2: string
          p_city: string
          p_client_id: string
          p_correlation_id?: string
          p_country: string
          p_name: string
          p_operational_notes: string
          p_permitted_hours: string
          p_postal_code: string
          p_primary_client_contact_id: string
          p_service_area_id: string
          p_state: string
          p_timezone: string
        }
        Returns: Json
      }
      admin_create_invitation: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_email: string
          p_expires_at: string
          p_role_code: string
          p_scope?: Json
          p_token_hash: string
        }
        Returns: string
      }
      admin_create_location_access_instruction: {
        Args: {
          p_access_type: string
          p_actor_aal: string
          p_actor_user_id: string
          p_ciphertext: string
          p_correlation_id?: string
          p_encryption_version: string
          p_key_reference: string
          p_location_id: string
          p_reason: string
          p_sensitivity_level: string
          p_valid_from: string
          p_valid_until: string
        }
        Returns: Json
      }
      admin_create_location_risk: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_description: string
          p_location_id: string
          p_mitigation: string
          p_reason: string
          p_risk_type: string
          p_severity: string
        }
        Returns: Json
      }
      admin_create_prospect: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_city_or_postal_code?: string
          p_company_name?: string
          p_contact_name: string
          p_correlation_id?: string
          p_email: string
          p_phone: string
          p_preferred_contact_method?: string
          p_request_locale?: string
          p_service_interest: string
        }
        Returns: Json
      }
      admin_create_quote_access_link: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_delivery_id: string
          p_expires_at: string
          p_token_hash: string
        }
        Returns: string
      }
      admin_create_quote_draft: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_currency?: string
          p_expires_on?: string
          p_prospect_id: string
          p_responsible_user_id?: string
        }
        Returns: string
      }
      admin_create_quote_draft_v2: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_currency: string
          p_expires_on: string
          p_idempotency_key: string
          p_request_hash: string
          p_responsible_user_id: string
          p_walkthrough_id: string
        }
        Returns: Json
      }
      admin_create_quote_from_walkthrough_v5: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_currency: string
          p_expires_on: string
          p_idempotency_key: string
          p_request_hash: string
          p_responsible_user_id: string
          p_walkthrough_id: string
        }
        Returns: Json
      }
      admin_create_quote_revision: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_quote_id: string
          p_reason: string
        }
        Returns: string
      }
      admin_create_service: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_agreed_price_cents: number
          p_client_id: string
          p_conditions: string
          p_correlation_id?: string
          p_end_date: string
          p_estimated_duration_minutes: number
          p_estimated_staff_count: number
          p_frequency_label: string
          p_items: Json
          p_location_id: string
          p_reason: string
          p_schedule_summary: string
          p_scope: string
          p_service_type: string
          p_start_date: string
          p_tasks: Json
        }
        Returns: Json
      }
      admin_create_service_version: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_agreed_price_cents: number
          p_conditions: string
          p_correlation_id?: string
          p_effective_from: string
          p_estimated_duration_minutes: number
          p_estimated_staff_count: number
          p_expected_service_version: number
          p_frequency_label: string
          p_items: Json
          p_reason: string
          p_schedule_summary: string
          p_scope: string
          p_service_id: string
          p_source_of_change: string
          p_tasks: Json
        }
        Returns: Json
      }
      admin_create_staff_member: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_administrative_notes: string
          p_correlation_id: string
          p_display_name: string
          p_email: string
          p_end_date: string
          p_preferred_language: string
          p_profile_id: string
          p_reason: string
          p_relationship_type: string
          p_start_date: string
          p_work_phone: string
        }
        Returns: Json
      }
      admin_discard_staff_file: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id: string
          p_file_id: string
          p_reason: string
        }
        Returns: Json
      }
      admin_end_jobsite_staff_assignment: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_assignment_id: string
          p_correlation_id: string
          p_ends_on: string
          p_reason: string
        }
        Returns: Json
      }
      admin_expire_quote: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_quote_id: string
          p_reason?: string
        }
        Returns: boolean
      }
      admin_find_contact_candidates: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_email?: string
          p_limit?: number
          p_phone?: string
        }
        Returns: {
          client_relationship_count: number
          contact_id: string
          email: string
          full_name: string
          job_title: string
          phone: string
          status: string
        }[]
      }
      admin_get_client: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_id: string
        }
        Returns: Json
      }
      admin_get_client_location: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_location_id: string
        }
        Returns: Json
      }
      admin_get_client_workspace: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_id: string
          p_include_locations?: boolean
        }
        Returns: Json
      }
      admin_get_job_assignment_workspace: {
        Args: { p_actor_aal: string; p_actor_user_id: string; p_job_id: string }
        Returns: Json
      }
      admin_get_jobsite_operations: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_id: string
          p_location_id: string
        }
        Returns: Json
      }
      admin_get_location_access_instruction_metadata: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_instruction_id: string
        }
        Returns: Json
      }
      admin_get_location_risk: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_risk_id: string
        }
        Returns: Json
      }
      admin_get_location_workspace: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_id: string
          p_include_sensitive?: boolean
          p_location_id: string
        }
        Returns: Json
      }
      admin_get_recurrence_preview: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_service_id: string
          p_window_end?: string
          p_window_start?: string
        }
        Returns: Json
      }
      admin_get_service_create_options: {
        Args: { p_actor_aal: string; p_actor_user_id: string }
        Returns: Json
      }
      admin_get_service_workspace: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_service_id: string
        }
        Returns: Json
      }
      admin_get_staff_document_download: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id: string
          p_document_id: string
        }
        Returns: Json
      }
      admin_get_staff_member_workspace: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_staff_member_id: string
        }
        Returns: Json
      }
      admin_get_walkthrough_media_download: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_media_id: string
          p_walkthrough_id: string
        }
        Returns: {
          bucket: string
          original_name: string
          storage_path: string
        }[]
      }
      admin_import_prospects: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_rows: Json
        }
        Returns: Json
      }
      admin_integrated_add_areas: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_area_type: string
          p_correlation_id?: string
          p_custom_type: string
          p_quantity: number
          p_walkthrough_id: string
        }
        Returns: string[]
      }
      admin_integrated_add_special_condition: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_area_id: string
          p_correlation_id?: string
          p_description: string
          p_frequency: string
          p_frequency_detail: string
          p_notes: string
          p_walkthrough_id: string
        }
        Returns: string
      }
      admin_integrated_capture_quote_snapshot: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_quote_id: string
        }
        Returns: boolean
      }
      admin_integrated_complete_walkthrough: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_integrated_create_prospect: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_address_line1: string
          p_address_line2: string
          p_city: string
          p_contact_name: string
          p_correlation_id?: string
          p_email: string
          p_name: string
          p_phone: string
          p_postal_code: string
          p_prospect_type: string
          p_state: string
        }
        Returns: string
      }
      admin_integrated_import_prospects: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_rows: Json
        }
        Returns: Json
      }
      admin_integrated_save_walkthrough: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_contact_email: string
          p_contact_name: string
          p_contact_phone: string
          p_correlation_id?: string
          p_custom_frequency: string
          p_general_frequency: string
          p_location: string
          p_meeting_at: string
          p_preferred_end_time: string
          p_preferred_start_time: string
          p_requested_days: string[]
          p_target_start_date: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_integrated_start_walkthrough: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_prospect_id: string
        }
        Returns: string
      }
      admin_integrated_update_area: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_area_id: string
          p_correlation_id?: string
          p_frequency: string
          p_frequency_detail: string
          p_name: string
          p_notes: string
          p_size: string
        }
        Returns: boolean
      }
      admin_integrated_update_jobsite_financials: {
        Args: {
          p_account_revenue_cadence: string
          p_account_revenue_cents: number
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_location_id: string
          p_show_price_to_client: boolean
        }
        Returns: boolean
      }
      admin_integrated_update_prospect: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_address_line1: string
          p_address_line2: string
          p_city: string
          p_contact_name: string
          p_correlation_id?: string
          p_email: string
          p_name: string
          p_phone: string
          p_postal_code: string
          p_prospect_id: string
          p_prospect_type: string
          p_state: string
        }
        Returns: boolean
      }
      admin_list_assignable_staff_for_job: {
        Args: { p_actor_aal: string; p_actor_user_id: string; p_job_id: string }
        Returns: Json
      }
      admin_list_client_contacts: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_id: string
        }
        Returns: {
          can_accept_quotes: boolean
          can_report_incidents: boolean
          can_request_changes: boolean
          client_contact_id: string
          contact_id: string
          contact_status: string
          email: string
          ends_at: string
          full_name: string
          has_portal_access: boolean
          is_primary: boolean
          job_title: string
          phone: string
          preferred_locale: string
          profile_id: string
          receives_invoices: boolean
          relationship_label: string
          relationship_status: string
          starts_at: string
          version: number
        }[]
      }
      admin_list_client_conversion_candidates: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_quote_id: string
        }
        Returns: {
          client_id: string
          display_name: string
          matched_by_email: boolean
          matched_by_name: boolean
          primary_contact_email: string
          primary_contact_name: string
          status: string
        }[]
      }
      admin_list_client_locations: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_id: string
        }
        Returns: {
          activated_at: string
          address_line1: string
          address_line2: string
          archived_at: string
          city: string
          country: string
          created_at: string
          id: string
          name: string
          operational_notes: string
          permitted_hours: string
          postal_code: string
          primary_client_contact_id: string
          primary_contact_name: string
          service_area_id: string
          service_area_name: string
          state: string
          status: string
          timezone: string
          updated_at: string
          version: number
        }[]
      }
      admin_list_client_status_history: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_id: string
          p_limit?: number
        }
        Returns: {
          actor_type: string
          changed_at: string
          changed_by: string
          changed_by_name: string
          correlation_id: string
          from_status: string
          id: string
          reason: string
          to_status: string
        }[]
      }
      admin_list_clients: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: {
          client_type: string
          created_at: string
          display_name: string
          id: string
          legal_name: string
          location_count: number
          origin_quote_id: string
          preferred_locale: string
          primary_contact_email: string
          primary_contact_name: string
          primary_contact_phone: string
          responsible_name: string
          responsible_user_id: string
          status: string
          total_count: number
          trade_name: string
          updated_at: string
        }[]
      }
      admin_list_convertible_accepted_quotes: {
        Args: { p_actor_aal: string; p_actor_user_id: string; p_limit?: number }
        Returns: {
          accepted_at: string
          accepted_email: string
          accepted_name: string
          accepted_phone: string
          accepted_title: string
          possible_client_count: number
          prospect_id: string
          prospect_name: string
          quote_id: string
          quote_number: string
          request_locale: string
          service_location_snapshot: string
        }[]
      }
      admin_list_eligible_client_portal_profiles: {
        Args: { p_actor_aal: string; p_actor_user_id: string }
        Returns: {
          display_name: string
          preferred_language: string
          profile_id: string
          role_ends_at: string
          role_starts_at: string
        }[]
      }
      admin_list_existing_client_jobsite_activation_quotes: {
        Args: { p_actor_aal: string; p_actor_user_id: string; p_limit?: number }
        Returns: {
          accepted_at: string
          accepted_email: string
          accepted_name: string
          client_id: string
          client_name: string
          quote_id: string
          quote_number: string
          scope_id: string
          service_location_snapshot: string
        }[]
      }
      admin_list_jobs_for_assignment: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_date_from?: string
          p_date_to?: string
        }
        Returns: Json
      }
      admin_list_location_access_instruction_metadata: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_location_id: string
        }
        Returns: {
          access_type: string
          created_at: string
          id: string
          last_reviewed_at: string
          sensitivity_level: string
          status: string
          updated_at: string
          valid_from: string
          valid_until: string
          version: number
        }[]
      }
      admin_list_location_contacts: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_location_id: string
        }
        Returns: {
          client_contact_id: string
          client_contact_status: string
          contact_id: string
          email: string
          full_name: string
          has_portal_access: boolean
          is_primary: boolean
          job_title: string
          location_contact_id: string
          phone: string
          relation_version: number
          role_label: string
          status: string
        }[]
      }
      admin_list_location_risks: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_location_id: string
        }
        Returns: {
          created_at: string
          description: string
          id: string
          mitigation: string
          reviewed_at: string
          risk_type: string
          severity: string
          status: string
          updated_at: string
        }[]
      }
      admin_list_location_status_history: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_limit?: number
          p_location_id: string
        }
        Returns: {
          actor_type: string
          changed_at: string
          changed_by: string
          changed_by_name: string
          correlation_id: string
          from_status: string
          id: string
          reason: string
          to_status: string
        }[]
      }
      admin_list_prospect_assignees: {
        Args: { p_actor_aal: string; p_actor_user_id: string }
        Returns: {
          display_name: string
          id: string
        }[]
      }
      admin_list_prospects: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_direction?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sort?: string
          p_status?: string
        }
        Returns: {
          city_or_postal_code: string
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          next_action: string
          next_action_at: string
          open_duplicate_count: number
          request_locale: string
          responsible_name: string
          responsible_user_id: string
          service_interest: string
          source: string
          status: string
          total_count: number
          updated_at: string
        }[]
      }
      admin_list_quotes: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: {
          created_at: string
          currency: string
          discount_cents: number
          expires_on: string
          id: string
          prospect_id: string
          prospect_name: string
          quote_number: string
          responsible_name: string
          responsible_user_id: string
          status: string
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          total_count: number
          updated_at: string
          version_number: number
          version_status: string
        }[]
      }
      admin_list_service_areas: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_status?: string
        }
        Returns: {
          area_type: string
          city: string
          country_code: string
          county: string
          effective_from: string
          effective_now: boolean
          effective_until: string
          id: string
          name: string
          postal_code: string
          state_code: string
          status: string
          surcharge_cents: number
        }[]
      }
      admin_list_services: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: {
          agreed_price_cents: number
          client_id: string
          client_name: string
          currency: string
          current_version_id: string
          current_version_number: number
          end_date: string
          frequency_label: string
          id: string
          location_id: string
          location_name: string
          location_timezone: string
          service_type: string
          start_date: string
          status: string
          total_count: number
          updated_at: string
          version: number
        }[]
      }
      admin_list_staff_document_types: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_include_inactive?: boolean
        }
        Returns: Json
      }
      admin_list_staff_members: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_include_archived?: boolean
        }
        Returns: Json
      }
      admin_list_unlinked_staff_profiles: {
        Args: { p_actor_aal: string; p_actor_user_id: string }
        Returns: Json
      }
      admin_list_walkthrough_assignees: {
        Args: { p_actor_aal: string; p_actor_user_id: string }
        Returns: {
          display_name: string
          id: string
        }[]
      }
      admin_list_walkthroughs: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_from?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
          p_to?: string
        }
        Returns: {
          client_id: string
          conflict_count: number
          contact_name: string
          id: string
          origin_type: string
          photo_permission_status: string
          prospect_id: string
          prospect_name: string
          provisional_location: string
          responsible_name: string
          responsible_user_id: string
          scheduled_end_at: string
          scheduled_start_at: string
          status: string
          time_zone: string
          total_count: number
          updated_at: string
        }[]
      }
      admin_mark_location_access_instruction_reviewed: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_expected_version: number
          p_instruction_id: string
          p_reason: string
          p_reviewed_at: string
        }
        Returns: Json
      }
      admin_prepare_quote_for_delivery: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_quote_id: string
          p_quote_version_id: string
          p_tax_rate_ids?: string[]
        }
        Returns: boolean
      }
      admin_record_job_result: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_actual_end_at: string
          p_actual_start_at: string
          p_correlation_id: string
          p_job_id: string
          p_note: string
          p_outcome: string
          p_worked_staff_member_ids: string[]
        }
        Returns: Json
      }
      admin_record_quote_response: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_comment: string
          p_correlation_id?: string
          p_declaration: string
          p_idempotency_key: string
          p_method: string
          p_prospect_contact_id: string
          p_quote_id: string
          p_quote_version_id: string
          p_response_type: string
        }
        Returns: Json
      }
      admin_record_quote_response_v2: {
        Args: {
          p_acceptor_email: string
          p_acceptor_name: string
          p_acceptor_title: string
          p_actor_aal: string
          p_actor_user_id: string
          p_comment: string
          p_correlation_id?: string
          p_declaration: string
          p_idempotency_key: string
          p_method: string
          p_prospect_contact_id: string
          p_quote_id: string
          p_quote_version_id: string
          p_response_type: string
        }
        Returns: Json
      }
      admin_refresh_jobsite_forecast: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id: string
          p_horizon_days: number
          p_reason: string
          p_service_id: string
        }
        Returns: Json
      }
      admin_register_quote_document: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_byte_size: number
          p_correlation_id?: string
          p_original_name: string
          p_quote_id: string
          p_quote_version_id: string
          p_sha256: string
          p_storage_path: string
        }
        Returns: string
      }
      admin_register_staff_document: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id: string
          p_document_type_id: string
          p_expiration_date: string
          p_file_id: string
          p_issue_date: string
          p_reason: string
          p_staff_member_id: string
          p_supersedes_document_id: string
        }
        Returns: Json
      }
      admin_register_staff_file: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_bucket: string
          p_byte_size: number
          p_correlation_id: string
          p_declared_mime: string
          p_original_name: string
          p_sha256: string
          p_storage_path: string
          p_stored_name: string
          p_verified_mime: string
        }
        Returns: Json
      }
      admin_register_walkthrough_media: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_byte_size: number
          p_category: string
          p_correlation_id?: string
          p_declared_mime: string
          p_description?: string
          p_original_name: string
          p_policy_attested?: boolean
          p_sha256: string
          p_storage_path: string
          p_stored_name: string
          p_verified_mime: string
          p_walkthrough_id: string
        }
        Returns: string
      }
      admin_register_walkthrough_media_v2: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_byte_size: number
          p_category: string
          p_correlation_id?: string
          p_declared_mime: string
          p_description?: string
          p_original_name: string
          p_policy_attested?: boolean
          p_sha256: string
          p_storage_path: string
          p_stored_name: string
          p_verified_mime: string
          p_walkthrough_area_id: string
          p_walkthrough_id: string
        }
        Returns: string
      }
      admin_remove_job_assignment: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_assignment_id: string
          p_correlation_id: string
          p_expected_version: number
          p_reason: string
        }
        Returns: Json
      }
      admin_remove_quote_line_item: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_line_item_id: string
          p_quote_id: string
          p_quote_version_id: string
          p_reason: string
        }
        Returns: boolean
      }
      admin_remove_quote_prefill_item: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_line_item_id: string
          p_quote_id: string
          p_quote_version_id: string
        }
        Returns: boolean
      }
      admin_reopen_walkthrough: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_reason: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_replace_job_assignment: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_assignment_id: string
          p_correlation_id: string
          p_expected_version: number
          p_idempotency_key: string
          p_new_staff_member_id: string
          p_override_reason: string
          p_reason: string
        }
        Returns: Json
      }
      admin_reschedule_walkthrough: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_reason: string
          p_responsible_user_id: string
          p_scheduled_end_at: string
          p_scheduled_start_at: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_reschedule_walkthrough_local: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_local_end: string
          p_local_start: string
          p_reason: string
          p_responsible_user_id: string
          p_time_zone: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_resolve_duplicate_candidate: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_candidate_id: string
          p_correlation_id?: string
          p_reason: string
          p_resolution: string
        }
        Returns: boolean
      }
      admin_return_quote_to_draft: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_quote_id: string
          p_quote_version_id: string
          p_reason: string
        }
        Returns: boolean
      }
      admin_reveal_location_access_instruction: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_instruction_id: string
        }
        Returns: Json
      }
      admin_review_staff_document: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id: string
          p_decision: string
          p_document_id: string
          p_expected_version: number
          p_reason: string
        }
        Returns: Json
      }
      admin_revoke_role: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_assignment_id: string
          p_reason: string
        }
        Returns: undefined
      }
      admin_save_jobsite_schedule: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id: string
          p_ends_on: string
          p_expected_rule_version: number
          p_local_end_time: string
          p_local_start_time: string
          p_reason: string
          p_rule_definition: Json
          p_rule_id: string
          p_rule_type: string
          p_service_id: string
          p_starts_on: string
        }
        Returns: Json
      }
      admin_save_quote_draft_overview: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_visible_notes?: string
          p_correlation_id?: string
          p_internal_notes?: string
          p_quote_id: string
          p_quote_version_id: string
          p_service_frequency?: string
          p_terms?: string
          p_valid_until?: string
        }
        Returns: boolean
      }
      admin_save_service_catalog_item: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_customer_description: string
          p_default_frequency: string
          p_default_price_cents: number
          p_default_terms: string
          p_default_unit: string
          p_is_active: boolean
          p_item_id: string
          p_item_type: string
          p_name: string
          p_taxable: boolean
        }
        Returns: string
      }
      admin_save_service_schedule_rule: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_ends_on: string
          p_expected_rule_version: number
          p_expected_service_version: number
          p_local_end_time: string
          p_local_start_time: string
          p_reason: string
          p_rule_definition: Json
          p_rule_id: string
          p_rule_type: string
          p_service_id: string
          p_starts_on: string
        }
        Returns: Json
      }
      admin_save_staff_availability: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_availability_id: string
          p_availability_type: string
          p_correlation_id: string
          p_effective_from: string
          p_effective_until: string
          p_ends_at: string
          p_entry_reason: string
          p_expected_version: number
          p_local_end_time: string
          p_local_start_time: string
          p_pattern_type: string
          p_reason: string
          p_staff_member_id: string
          p_starts_at: string
          p_timezone: string
          p_weekday: number
        }
        Returns: Json
      }
      admin_save_staff_document_type: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_allowed_mime_types: string[]
          p_applies_to: string[]
          p_code: string
          p_correlation_id: string
          p_description: string
          p_document_type_id: string
          p_expected_version: number
          p_is_active: boolean
          p_is_blocking: boolean
          p_is_required: boolean
          p_max_file_size_bytes: number
          p_name_en: string
          p_name_es: string
          p_reason: string
          p_requires_expiration: boolean
          p_requires_verification: boolean
        }
        Returns: Json
      }
      admin_save_walkthrough_evaluation: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_next_steps?: string
          p_notes?: string
          p_photo_permission_status?: string
          p_recommendations?: string
          p_result?: string
          p_scope_required?: string
          p_site_characteristics?: string
          p_special_conditions?: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_save_walkthrough_evaluation_v2: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_next_steps?: string
          p_notes?: string
          p_photo_excluded_areas?: string
          p_photo_permission_method?: string
          p_photo_permission_status?: string
          p_photo_requirement_reasons?: string[]
          p_recommendations?: string
          p_result?: string
          p_scope_required?: string
          p_site_characteristics?: string
          p_special_conditions?: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_schedule_scope_local: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_contact_id: string
          p_correlation_id?: string
          p_local_end: string
          p_local_start: string
          p_origin_id: string
          p_origin_type: string
          p_provisional_location: string
          p_responsible_user_id?: string
          p_time_zone?: string
        }
        Returns: string
      }
      admin_schedule_walkthrough: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_prospect_contact_id: string
          p_prospect_id: string
          p_provisional_location: string
          p_responsible_user_id?: string
          p_scheduled_end_at: string
          p_scheduled_start_at: string
          p_time_zone?: string
        }
        Returns: string
      }
      admin_schedule_walkthrough_local: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_local_end: string
          p_local_start: string
          p_prospect_contact_id: string
          p_prospect_id: string
          p_provisional_location: string
          p_responsible_user_id?: string
          p_time_zone?: string
        }
        Returns: string
      }
      admin_set_job_required_staff_count: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id: string
          p_expected_version: number
          p_job_id: string
          p_reason: string
          p_required_staff_count: number
        }
        Returns: Json
      }
      admin_set_profile_status: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_profile_id: string
          p_reason: string
          p_status: string
        }
        Returns: undefined
      }
      admin_set_service_catalog_active: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_is_active: boolean
          p_item_id: string
          p_reason: string
        }
        Returns: boolean
      }
      admin_submit_quote_for_review: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_quote_id: string
          p_quote_version_id: string
          p_reason?: string
        }
        Returns: boolean
      }
      admin_update_business_setting: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_key: string
          p_value: Json
        }
        Returns: undefined
      }
      admin_update_client_contact_access: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_can_accept_quotes: boolean
          p_can_report_incidents: boolean
          p_can_request_changes: boolean
          p_client_contact_id: string
          p_correlation_id?: string
          p_ends_at: string
          p_has_portal_access: boolean
          p_profile_id: string
          p_reason: string
          p_receives_invoices: boolean
          p_starts_at: string
          p_status: string
        }
        Returns: Json
      }
      admin_update_client_location: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_address_line1: string
          p_address_line2: string
          p_city: string
          p_correlation_id?: string
          p_country: string
          p_expected_version: number
          p_location_id: string
          p_name: string
          p_operational_notes: string
          p_permitted_hours: string
          p_postal_code: string
          p_primary_client_contact_id: string
          p_reason: string
          p_service_area_id: string
          p_state: string
          p_timezone: string
        }
        Returns: Json
      }
      admin_update_client_profile: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_billing_city: string
          p_billing_country: string
          p_billing_line1: string
          p_billing_line2: string
          p_billing_postal_code: string
          p_billing_state: string
          p_client_id: string
          p_client_type: string
          p_correlation_id?: string
          p_expected_version: number
          p_general_email: string
          p_general_phone: string
          p_internal_notes: string
          p_legal_name: string
          p_payment_terms: string
          p_preferred_locale: string
          p_reason: string
          p_responsible_user_id: string
          p_trade_name: string
        }
        Returns: Json
      }
      admin_update_jobsite_staff_compensation: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_assignment_id: string
          p_correlation_id: string
          p_expected_version: number
          p_reason: string
          p_worker_pay_amount_cents: number
          p_worker_pay_custom: string
          p_worker_pay_mode: string
          p_worker_pay_percentage: number
        }
        Returns: Json
      }
      admin_update_location_access_instruction: {
        Args: {
          p_access_type: string
          p_actor_aal: string
          p_actor_user_id: string
          p_ciphertext: string
          p_correlation_id?: string
          p_encryption_version: string
          p_expected_version: number
          p_instruction_id: string
          p_key_reference: string
          p_reason: string
          p_sensitivity_level: string
          p_valid_from: string
          p_valid_until: string
        }
        Returns: Json
      }
      admin_update_location_risk: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_description: string
          p_expected_version: number
          p_mitigation: string
          p_reason: string
          p_reviewed_at: string
          p_risk_id: string
          p_risk_type: string
          p_severity: string
          p_status: string
        }
        Returns: Json
      }
      admin_update_prospect_workflow: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_next_action?: string
          p_next_action_at?: string
          p_prospect_id: string
          p_responsible_user_id?: string
        }
        Returns: boolean
      }
      admin_update_quote_draft_content: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_visible_notes?: string
          p_correlation_id?: string
          p_internal_notes?: string
          p_quote_id: string
          p_quote_version_id: string
          p_terms?: string
          p_valid_until?: string
        }
        Returns: boolean
      }
      admin_update_quote_frequency: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_quote_id: string
          p_quote_version_id: string
          p_service_frequency: string
        }
        Returns: boolean
      }
      admin_update_quote_line_item: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_description: string
          p_item_type: string
          p_line_item_id: string
          p_quantity: number
          p_quote_id: string
          p_quote_version_id: string
          p_taxable: boolean
          p_unit: string
          p_unit_price_cents: number
          p_visible_to_client?: boolean
        }
        Returns: boolean
      }
      admin_update_staff_member: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_administrative_notes: string
          p_correlation_id: string
          p_display_name: string
          p_email: string
          p_end_date: string
          p_expected_version: number
          p_manual_assignment_blocked: boolean
          p_manual_block_reason: string
          p_preferred_language: string
          p_profile_id: string
          p_reason: string
          p_relationship_type: string
          p_staff_member_id: string
          p_start_date: string
          p_work_phone: string
        }
        Returns: Json
      }
      admin_update_walkthrough_area: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_approximate_dimensions?: string
          p_area_id: string
          p_area_type?: string
          p_condition?: string
          p_correlation_id?: string
          p_name: string
          p_notes?: string
          p_requested_frequency?: string
          p_special_requirements?: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_update_walkthrough_requirement: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_correlation_id?: string
          p_description: string
          p_material_or_equipment?: string
          p_priority?: string
          p_quote_impact?: string
          p_requirement_id: string
          p_requirement_type: string
          p_risk?: string
          p_walkthrough_id: string
        }
        Returns: boolean
      }
      admin_upsert_location_contact: {
        Args: {
          p_actor_aal: string
          p_actor_user_id: string
          p_client_contact_id: string
          p_correlation_id?: string
          p_expected_location_version: number
          p_expected_relation_version: number
          p_is_primary: boolean
          p_location_id: string
          p_reason: string
          p_role_label: string
          p_status: string
        }
        Returns: Json
      }
      assign_staff_to_job: {
        Args: {
          p_job_site_id: string
          p_payment_amount: number
          p_staff_id: string
        }
        Returns: undefined
      }
      auth_risk_precheck: {
        Args: {
          p_action: string
          p_bucket_key: string
          p_ip_hash: string
          p_metadata?: Json
        }
        Returns: Json
      }
      auth_risk_record_result: {
        Args: {
          p_action: string
          p_bucket_key: string
          p_captcha_passed: boolean
          p_ip_hash: string
          p_metadata?: Json
          p_reason: string
          p_success: boolean
          p_user_agent_summary: string
          p_user_id: string
        }
        Returns: Json
      }
      claim_public_prospect_notification_delivery: {
        Args: { p_correlation_id?: string; p_prospect_id: string }
        Returns: Json
      }
      complete_public_prospect_notification_delivery: {
        Args: {
          p_correlation_id?: string
          p_delivery_id: string
          p_error_code?: string
          p_outcome: string
          p_provider_message_id?: string
          p_recipient_count: number
        }
        Returns: boolean
      }
      get_public_prospect_notification_context: {
        Args: { p_prospect_id: string }
        Returns: Json
      }
      get_public_quote: { Args: { p_token: string }; Returns: Json }
      mark_client_contacted: {
        Args: { p_client_id: string }
        Returns: undefined
      }
      mark_client_in_process: {
        Args: { p_client_id: string }
        Returns: undefined
      }
      mfa_recovery_confirm_codes: {
        Args: { p_batch_id: string; p_user_id: string }
        Returns: boolean
      }
      mfa_recovery_finalize_reset: {
        Args: { p_reservation_id: string; p_user_id: string }
        Returns: boolean
      }
      mfa_recovery_release_reservation: {
        Args: { p_reason?: string; p_reservation_id: string; p_user_id: string }
        Returns: boolean
      }
      mfa_recovery_replace_codes: {
        Args: { p_code_hashes: string[]; p_reason?: string; p_user_id: string }
        Returns: string
      }
      mfa_recovery_reserve_code: {
        Args: {
          p_code_hash: string
          p_ip_hash?: string
          p_metadata?: Json
          p_user_agent_summary?: string
          p_user_id: string
        }
        Returns: Json
      }
      record_public_prospect_notification_delivery: {
        Args: {
          p_correlation_id?: string
          p_error_code?: string
          p_outcome: string
          p_prospect_id: string
          p_provider_message_id?: string
          p_recipient_count: number
        }
        Returns: string
      }
      respond_to_public_quote: {
        Args: {
          p_action: string
          p_email?: string
          p_name?: string
          p_reason?: string
          p_role?: string
          p_token: string
        }
        Returns: Json
      }
      send_quote: {
        Args: { p_pdf_url: string; p_quote_id: string }
        Returns: undefined
      }
      staff_get_my_assignment: {
        Args: { p_actor_user_id: string; p_assignment_id: string }
        Returns: Json
      }
      staff_list_my_assignments: {
        Args: { p_actor_user_id: string }
        Returns: Json
      }
      staff_respond_to_assignment: {
        Args: {
          p_actor_user_id: string
          p_assignment_id: string
          p_correlation_id: string
          p_expected_version: number
          p_idempotency_key: string
          p_reason: string
          p_response: string
        }
        Returns: Json
      }
      submit_prospect_request: {
        Args: {
          p_city_or_postal_code?: string
          p_company_name?: string
          p_contact_name: string
          p_correlation_id?: string
          p_email: string
          p_idempotency_key: string
          p_message?: string
          p_phone: string
          p_preferred_contact_method?: string
          p_request_hash: string
          p_request_locale?: string
          p_service_interest: string
        }
        Returns: Json
      }
      submit_quote_customer_response: {
        Args: {
          p_comment: string
          p_correlation_id?: string
          p_declaration: string
          p_idempotency_key: string
          p_response_type: string
          p_token_hash: string
        }
        Returns: Json
      }
      submit_quote_customer_response_v2: {
        Args: {
          p_acceptor_email: string
          p_acceptor_name: string
          p_acceptor_title: string
          p_comment: string
          p_correlation_id?: string
          p_declaration: string
          p_idempotency_key: string
          p_response_type: string
          p_token_hash: string
        }
        Returns: Json
      }
    }
    Enums: {
      area_condition: "good" | "normal" | "bad"
      area_size: "small" | "normal" | "big"
      catalog_item_kind: "service" | "addon"
      client_status:
        | "prospect"
        | "contacted"
        | "in_process"
        | "quoted"
        | "pending"
        | "active"
        | "archived"
      discount_type: "percentage" | "fixed"
      frequency_type:
        | "one_time"
        | "daily"
        | "weekly"
        | "biweekly"
        | "monthly"
        | "custom"
      job_site_status:
        | "new"
        | "pending"
        | "approved"
        | "active"
        | "archived"
        | "paused"
      quote_response_action: "approved" | "changes_requested" | "declined"
      quote_status:
        | "draft"
        | "sent"
        | "approved"
        | "changes_requested"
        | "declined"
        | "superseded"
      staff_status: "active" | "paused" | "archived"
      staff_type: "employee" | "contractor"
      weekday: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      area_condition: ["good", "normal", "bad"],
      area_size: ["small", "normal", "big"],
      catalog_item_kind: ["service", "addon"],
      client_status: [
        "prospect",
        "contacted",
        "in_process",
        "quoted",
        "pending",
        "active",
        "archived",
      ],
      discount_type: ["percentage", "fixed"],
      frequency_type: [
        "one_time",
        "daily",
        "weekly",
        "biweekly",
        "monthly",
        "custom",
      ],
      job_site_status: [
        "new",
        "pending",
        "approved",
        "active",
        "archived",
        "paused",
      ],
      quote_response_action: ["approved", "changes_requested", "declined"],
      quote_status: [
        "draft",
        "sent",
        "approved",
        "changes_requested",
        "declined",
        "superseded",
      ],
      staff_status: ["active", "paused", "archived"],
      staff_type: ["employee", "contractor"],
      weekday: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    },
  },
} as const
