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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_pii_access_logs: {
        Row: {
          access_reason: string | null
          accessed_fields: string[] | null
          accessed_record_id: string | null
          accessed_table: string
          admin_id: string
          created_at: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          access_reason?: string | null
          accessed_fields?: string[] | null
          accessed_record_id?: string | null
          accessed_table: string
          admin_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          access_reason?: string | null
          accessed_fields?: string[] | null
          accessed_record_id?: string | null
          accessed_table?: string
          admin_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: []
      }
      agents: {
        Row: {
          active: boolean | null
          address: string | null
          created_at: string | null
          created_by: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          phone: string
          region: string
          telegram: string | null
          updated_at: string | null
          whatsapp: string | null
          working_hours: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          phone: string
          region: string
          telegram?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          working_hours?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          phone?: string
          region?: string
          telegram?: string | null
          updated_at?: string | null
          whatsapp?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      auto_billing_settings: {
        Row: {
          advance_days: number | null
          auto_send_email: boolean | null
          auto_send_sms: boolean | null
          billing_day: number | null
          created_at: string | null
          created_by: string | null
          enabled: boolean | null
          id: string
          updated_at: string | null
        }
        Insert: {
          advance_days?: number | null
          auto_send_email?: boolean | null
          auto_send_sms?: boolean | null
          billing_day?: number | null
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          advance_days?: number | null
          auto_send_email?: boolean | null
          auto_send_sms?: boolean | null
          billing_day?: number | null
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      complaints: {
        Row: {
          assigned_to: string | null
          category: string
          complaint_number: string
          created_at: string | null
          created_by: string | null
          description: string
          id: string
          priority: string | null
          resolution: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          subscriber_id: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category: string
          complaint_number?: string
          created_at?: string | null
          created_by?: string | null
          description: string
          id?: string
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          subscriber_id: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string
          complaint_number?: string
          created_at?: string | null
          created_by?: string | null
          description?: string
          id?: string
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          subscriber_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "complaints_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_history: {
        Row: {
          connection_quality: string | null
          download_speed: number | null
          id: string
          ip_address: unknown
          notes: string | null
          recorded_at: string | null
          recorded_by: string | null
          status: string
          subscriber_id: string
          upload_speed: number | null
        }
        Insert: {
          connection_quality?: string | null
          download_speed?: number | null
          id?: string
          ip_address?: unknown
          notes?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          status: string
          subscriber_id: string
          upload_speed?: number | null
        }
        Update: {
          connection_quality?: string | null
          download_speed?: number | null
          id?: string
          ip_address?: unknown
          notes?: string | null
          recorded_at?: string | null
          recorded_by?: string | null
          status?: string
          subscriber_id?: string
          upload_speed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "connection_history_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "connection_history_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          auto_renew: boolean
          contract_number: string
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          end_date: string
          id: string
          installation_fee: number | null
          monthly_fee: number
          notes: string | null
          package_id: string | null
          renewal_period_months: number | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          subscriber_id: string
          updated_at: string
        }
        Insert: {
          auto_renew?: boolean
          contract_number: string
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          end_date: string
          id?: string
          installation_fee?: number | null
          monthly_fee?: number
          notes?: string | null
          package_id?: string | null
          renewal_period_months?: number | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          subscriber_id: string
          updated_at?: string
        }
        Update: {
          auto_renew?: boolean
          contract_number?: string
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          end_date?: string
          id?: string
          installation_fee?: number | null
          monthly_fee?: number
          notes?: string | null
          package_id?: string | null
          renewal_period_months?: number | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          subscriber_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "public_packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_usage: {
        Row: {
          coupon_id: string
          discount_amount: number
          id: string
          invoice_id: string | null
          subscriber_id: string
          used_at: string | null
          used_by: string | null
        }
        Insert: {
          coupon_id: string
          discount_amount: number
          id?: string
          invoice_id?: string | null
          subscriber_id: string
          used_at?: string | null
          used_by?: string | null
        }
        Update: {
          coupon_id?: string
          discount_amount?: number
          id?: string
          invoice_id?: string | null
          subscriber_id?: string
          used_at?: string | null
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_usage_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "discount_coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_usage_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_coupons: {
        Row: {
          active: boolean | null
          applicable_to: string | null
          code: string
          created_at: string | null
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          max_discount_amount: number | null
          min_purchase_amount: number | null
          package_ids: string[] | null
          per_user_limit: number | null
          updated_at: string | null
          usage_count: number | null
          usage_limit: number | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          active?: boolean | null
          applicable_to?: string | null
          code: string
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          package_ids?: string[] | null
          per_user_limit?: number | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string
          valid_until: string
        }
        Update: {
          active?: boolean | null
          applicable_to?: string | null
          code?: string
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          package_ids?: string[] | null
          per_user_limit?: number | null
          updated_at?: string | null
          usage_count?: number | null
          usage_limit?: number | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      employee_access_logs: {
        Row: {
          accessed_by: string
          action: string
          created_at: string | null
          employee_id: string
          id: string
          ip_address: unknown
          user_agent: string | null
        }
        Insert: {
          accessed_by: string
          action: string
          created_at?: string | null
          employee_id: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Update: {
          accessed_by?: string
          action?: string
          created_at?: string | null
          employee_id?: string
          id?: string
          ip_address?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_access_logs_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_location_access_logs: {
        Row: {
          access_timestamp: string | null
          accessed_user_id: string | null
          accessor_id: string
          id: string
          ip_address: unknown
          metadata: Json | null
          query_type: string
          records_count: number | null
          user_agent: string | null
        }
        Insert: {
          access_timestamp?: string | null
          accessed_user_id?: string | null
          accessor_id: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          query_type?: string
          records_count?: number | null
          user_agent?: string | null
        }
        Update: {
          access_timestamp?: string | null
          accessed_user_id?: string | null
          accessor_id?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          query_type?: string
          records_count?: number | null
          user_agent?: string | null
        }
        Relationships: []
      }
      employee_locations: {
        Row: {
          accuracy: number | null
          created_at: string | null
          device_info: Json | null
          heading: number | null
          id: string
          latitude: number
          longitude: number
          recorded_at: string | null
          speed: number | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string | null
          device_info?: Json | null
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string | null
          speed?: number | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string | null
          device_info?: Json | null
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string | null
          speed?: number | null
          user_id?: string
        }
        Relationships: []
      }
      employees: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          employee_code: string
          full_name: string
          id: string
          phone: string
          position: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          employee_code: string
          full_name: string
          id?: string
          phone: string
          position?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          employee_code?: string
          full_name?: string
          id?: string
          phone?: string
          position?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exchange_rates: {
        Row: {
          created_at: string | null
          created_by: string | null
          effective_date: string
          from_currency: Database["public"]["Enums"]["currency_type"]
          id: string
          rate: number
          to_currency: Database["public"]["Enums"]["currency_type"]
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          effective_date?: string
          from_currency: Database["public"]["Enums"]["currency_type"]
          id?: string
          rate: number
          to_currency: Database["public"]["Enums"]["currency_type"]
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          effective_date?: string
          from_currency?: Database["public"]["Enums"]["currency_type"]
          id?: string
          rate?: number
          to_currency?: Database["public"]["Enums"]["currency_type"]
        }
        Relationships: []
      }
      expense_vouchers: {
        Row: {
          amount: number
          approved_by: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          description: string | null
          expense_type: string
          id: string
          paid_to: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          voucher_number: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          expense_type: string
          id?: string
          paid_to?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          voucher_number?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          expense_type?: string
          id?: string
          paid_to?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          voucher_number?: string
        }
        Relationships: []
      }
      external_imports: {
        Row: {
          created_at: string | null
          id: string
          imported_at: string | null
          imported_by: string | null
          raw_data: Json | null
          records_processed: number | null
          source: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          raw_data?: Json | null
          records_processed?: number | null
          source: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          imported_at?: string | null
          imported_by?: string | null
          raw_data?: Json | null
          records_processed?: number | null
          source?: string
          status?: string | null
        }
        Relationships: []
      }
      geofence_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          latitude: number
          longitude: number
          user_id: string
          zone_id: string
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          latitude: number
          longitude: number
          user_id: string
          zone_id: string
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          latitude?: number
          longitude?: number
          user_id?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "geofence_events_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "geofence_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      geofence_zones: {
        Row: {
          active: boolean | null
          center_lat: number
          center_lng: number
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          notification_message: string | null
          notify_on_enter: boolean | null
          notify_on_exit: boolean | null
          radius_meters: number
        }
        Insert: {
          active?: boolean | null
          center_lat: number
          center_lng: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          notification_message?: string | null
          notify_on_enter?: boolean | null
          notify_on_exit?: boolean | null
          radius_meters: number
        }
        Update: {
          active?: boolean | null
          center_lat?: number
          center_lng?: number
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          notification_message?: string | null
          notify_on_enter?: boolean | null
          notify_on_exit?: boolean | null
          radius_meters?: number
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          import_type: string
          imported_by: string | null
          records_failed: number | null
          records_imported: number | null
          source: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          import_type: string
          imported_by?: string | null
          records_failed?: number | null
          records_imported?: number | null
          source: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          import_type?: string
          imported_by?: string | null
          records_failed?: number | null
          records_imported?: number | null
          source?: string
          status?: string | null
        }
        Relationships: []
      }
      inventory: {
        Row: {
          category: string | null
          created_at: string | null
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          id: string
          item_code: string | null
          item_name: string
          min_stock_level: number | null
          notes: string | null
          quantity: number
          supplier: string | null
          unit: string
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          id?: string
          item_code?: string | null
          item_name: string
          min_stock_level?: number | null
          notes?: string | null
          quantity?: number
          supplier?: string | null
          unit?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          id?: string
          item_code?: string | null
          item_name?: string
          min_stock_level?: number | null
          notes?: string | null
          quantity?: number
          supplier?: string | null
          unit?: string
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_id: string
          movement_type: string
          new_quantity: number
          notes: string | null
          previous_quantity: number
          quantity: number
          reason: string | null
          reference_number: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id: string
          movement_type: string
          new_quantity: number
          notes?: string | null
          previous_quantity: number
          quantity: number
          reason?: string | null
          reference_number?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_id?: string
          movement_type?: string
          new_quantity?: number
          notes?: string | null
          previous_quantity?: number
          quantity?: number
          reason?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          discount: number | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          net_amount: number | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subscriber_id: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          discount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          net_amount?: number | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subscriber_id: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          discount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          net_amount?: number | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subscriber_id?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      location_tracking_settings: {
        Row: {
          created_at: string | null
          id: string
          tracking_enabled: boolean | null
          update_interval_minutes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          tracking_enabled?: boolean | null
          update_interval_minutes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          tracking_enabled?: boolean | null
          update_interval_minutes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string | null
          email: string
          error_message: string | null
          id: string
          ip_address: unknown
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          error_message?: string | null
          id?: string
          ip_address?: unknown
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      loyalty_points: {
        Row: {
          created_at: string | null
          id: string
          lifetime_points: number
          points: number
          subscriber_id: string
          tier: string | null
          tier_discount_percentage: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          lifetime_points?: number
          points?: number
          subscriber_id: string
          tier?: string | null
          tier_discount_percentage?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          lifetime_points?: number
          points?: number
          subscriber_id?: string
          tier?: string | null
          tier_discount_percentage?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_points_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: true
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_points_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: true
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      loyalty_transactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          points: number
          reason: string | null
          reference_id: string | null
          reference_type: string | null
          subscriber_id: string
          transaction_type: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          points: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          subscriber_id: string
          transaction_type: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          points?: number
          reason?: string | null
          reference_id?: string | null
          reference_type?: string | null
          subscriber_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "loyalty_transactions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loyalty_transactions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      mac_address_history: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          mac_address: string
          notes: string | null
          subscriber_id: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          mac_address: string
          notes?: string | null
          subscriber_id: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          mac_address?: string
          notes?: string | null
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mac_address_history_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mac_address_history_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tickets: {
        Row: {
          agent_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          issue_description: string
          issue_type: string | null
          latitude: number | null
          location_address: string | null
          longitude: number | null
          notes: string | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subscriber_id: string
          technician_id: string | null
          ticket_number: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          issue_description: string
          issue_type?: string | null
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subscriber_id: string
          technician_id?: string | null
          ticket_number: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          issue_description?: string
          issue_type?: string | null
          latitude?: number | null
          location_address?: string | null
          longitude?: number | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subscriber_id?: string
          technician_id?: string | null
          ticket_number?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_rules: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          rule_name: string
          rule_type: string
          template_id: string | null
          trigger_days_before: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          rule_name: string
          rule_type: string
          template_id?: string | null
          trigger_days_before?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          rule_name?: string
          rule_type?: string
          template_id?: string | null
          trigger_days_before?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_rules_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "sms_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      otp_rate_limits: {
        Row: {
          attempts_count: number | null
          blocked_until: string | null
          created_at: string | null
          id: string
          last_sent_at: string | null
          phone_number: string
          updated_at: string | null
        }
        Insert: {
          attempts_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          last_sent_at?: string | null
          phone_number: string
          updated_at?: string | null
        }
        Update: {
          attempts_count?: number | null
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          last_sent_at?: string | null
          phone_number?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      otp_verification_attempts: {
        Row: {
          blocked_until: string | null
          created_at: string | null
          failed_attempts: number | null
          id: string
          last_attempt_at: string | null
          phone_number: string
        }
        Insert: {
          blocked_until?: string | null
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          last_attempt_at?: string | null
          phone_number: string
        }
        Update: {
          blocked_until?: string | null
          created_at?: string | null
          failed_attempts?: number | null
          id?: string
          last_attempt_at?: string | null
          phone_number?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          active: boolean | null
          created_at: string | null
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          description: string | null
          features: Json | null
          id: string
          monthly_price: number
          name: string
          name_en: string | null
          speed_mbps: number
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          features?: Json | null
          id?: string
          monthly_price?: number
          name: string
          name_en?: string | null
          speed_mbps: number
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          features?: Json | null
          id?: string
          monthly_price?: number
          name?: string
          name_en?: string | null
          speed_mbps?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token_hash: string
          used: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token_hash: string
          used?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token_hash?: string
          used?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          gateway_response: Json | null
          id: string
          invoice_id: string | null
          notes: string | null
          paid_at: string | null
          payment_date: string
          payment_gateway: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: string | null
          subscriber_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          gateway_response?: Json | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_date?: string
          payment_gateway?: string | null
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: string | null
          subscriber_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          gateway_response?: Json | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          paid_at?: string | null
          payment_date?: string
          payment_gateway?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: string | null
          subscriber_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      phone_otps: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          otp_code: string
          phone: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          otp_code: string
          phone: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          otp_code?: string
          phone?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      pii_access_logs: {
        Row: {
          access_type: string
          accessed_fields: string[]
          created_at: string | null
          id: string
          ip_address: unknown
          subscriber_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          accessed_fields: string[]
          created_at?: string | null
          id?: string
          ip_address?: unknown
          subscriber_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          accessed_fields?: string[]
          created_at?: string | null
          id?: string
          ip_address?: unknown
          subscriber_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pii_access_logs_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pii_access_logs_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          notification_settings: Json | null
          phone: string | null
          push_token: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          notification_settings?: Json | null
          phone?: string | null
          push_token?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          notification_settings?: Json | null
          phone?: string | null
          push_token?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      promotional_offers: {
        Row: {
          active: boolean | null
          applicable_packages: string[] | null
          auto_apply: boolean | null
          bonus_speed_mbps: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_percentage: number | null
          free_months: number | null
          id: string
          name: string
          offer_type: string
          updated_at: string | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          active?: boolean | null
          applicable_packages?: string[] | null
          auto_apply?: boolean | null
          bonus_speed_mbps?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_percentage?: number | null
          free_months?: number | null
          id?: string
          name: string
          offer_type: string
          updated_at?: string | null
          valid_from?: string
          valid_until: string
        }
        Update: {
          active?: boolean | null
          applicable_packages?: string[] | null
          auto_apply?: boolean | null
          bonus_speed_mbps?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_percentage?: number | null
          free_months?: number | null
          id?: string
          name?: string
          offer_type?: string
          updated_at?: string | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      rate_limit_attempts: {
        Row: {
          attempt_type: string
          attempts: number | null
          blocked_until: string | null
          first_attempt_at: string | null
          id: string
          identifier: string
          last_attempt_at: string | null
        }
        Insert: {
          attempt_type: string
          attempts?: number | null
          blocked_until?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier: string
          last_attempt_at?: string | null
        }
        Update: {
          attempt_type?: string
          attempts?: number | null
          blocked_until?: string | null
          first_attempt_at?: string | null
          id?: string
          identifier?: string
          last_attempt_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          id: string
          referral_code: string
          referred_at: string | null
          referred_id: string | null
          referrer_id: string
          reward_applied: boolean | null
          reward_type: string | null
          reward_value: number | null
          rewarded_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          referral_code: string
          referred_at?: string | null
          referred_id?: string | null
          referrer_id: string
          reward_applied?: boolean | null
          reward_type?: string | null
          reward_value?: number | null
          rewarded_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          referral_code?: string
          referred_at?: string | null
          referred_id?: string | null
          referrer_id?: string
          reward_applied?: boolean | null
          reward_type?: string | null
          reward_value?: number | null
          rewarded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_time: string | null
          id: string
          location: string | null
          priority: string | null
          start_time: string
          status: string | null
          subscriber_id: string | null
          task_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          priority?: string | null
          start_time: string
          status?: string | null
          subscriber_id?: string | null
          task_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          priority?: string | null
          start_time?: string
          status?: string | null
          subscriber_id?: string | null
          task_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sensitive_operations_log: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          resource_id: string | null
          resource_type: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          resource_id?: string | null
          resource_type?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          created_at: string
          device_name: string | null
          expires_at: string
          id: string
          ip_address: unknown
          last_active: string
          metadata: Json | null
          revoked: boolean
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          expires_at: string
          id?: string
          ip_address?: unknown
          last_active?: string
          metadata?: Json | null
          revoked?: boolean
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string | null
          expires_at?: string
          id?: string
          ip_address?: unknown
          last_active?: string
          metadata?: Json | null
          revoked?: boolean
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          created_at: string
          created_by: string | null
          delivered_at: string | null
          error_message: string | null
          id: string
          message: string
          provider: string
          provider_message_id: string | null
          recipient_name: string | null
          recipient_phone: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message: string
          provider: string
          provider_message_id?: string | null
          recipient_name?: string | null
          recipient_phone: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          error_message?: string | null
          id?: string
          message?: string
          provider?: string
          provider_message_id?: string | null
          recipient_name?: string | null
          recipient_phone?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: []
      }
      sms_settings: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          provider: string
          sender_name: string
          sender_number: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          provider?: string
          sender_name: string
          sender_number?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          provider?: string
          sender_name?: string
          sender_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sms_templates: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          message_template: string
          name: string
          template_key: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          message_template: string
          name: string
          template_key: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          message_template?: string
          name?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriber_audit_trail: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          field_name: string | null
          id: string
          ip_address: unknown
          new_value: string | null
          notes: string | null
          old_value: string | null
          subscriber_id: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          field_name?: string | null
          id?: string
          ip_address?: unknown
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          field_name?: string | null
          id?: string
          ip_address?: unknown
          new_value?: string | null
          notes?: string | null
          old_value?: string | null
          subscriber_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_audit_trail_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_audit_trail_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriber_users: {
        Row: {
          created_at: string | null
          id: string
          subscriber_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          subscriber_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          subscriber_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriber_users_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriber_users_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          address: string | null
          address_notes: string | null
          agent_id: string | null
          balance: number | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          mac_address: string | null
          mac_locked: boolean | null
          name: string
          phone: string
          phone_secondary: string | null
          plan: string | null
          status_comment: string | null
          updated_at: string | null
          username: string | null
          version: number | null
        }
        Insert: {
          address?: string | null
          address_notes?: string | null
          agent_id?: string | null
          balance?: number | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          mac_address?: string | null
          mac_locked?: boolean | null
          name: string
          phone: string
          phone_secondary?: string | null
          plan?: string | null
          status_comment?: string | null
          updated_at?: string | null
          username?: string | null
          version?: number | null
        }
        Update: {
          address?: string | null
          address_notes?: string | null
          agent_id?: string | null
          balance?: number | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          mac_address?: string | null
          mac_locked?: boolean | null
          name?: string
          phone?: string
          phone_secondary?: string | null
          plan?: string | null
          status_comment?: string | null
          updated_at?: string | null
          username?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_locations: {
        Row: {
          accuracy: number | null
          created_at: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          speed: number | null
          status: string | null
          technician_id: string
          ticket_id: string | null
          updated_at: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          speed?: number | null
          status?: string | null
          technician_id: string
          ticket_id?: string | null
          updated_at?: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          speed?: number | null
          status?: string | null
          technician_id?: string
          ticket_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: true
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: true
            referencedRelation: "technicians_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_locations_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: true
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_locations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_locations_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_ratings: {
        Row: {
          created_at: string | null
          feedback: string | null
          id: string
          rating: number
          subscriber_id: string
          technician_id: string
          ticket_id: string
        }
        Insert: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating: number
          subscriber_id: string
          technician_id: string
          ticket_id: string
        }
        Update: {
          created_at?: string | null
          feedback?: string | null
          id?: string
          rating?: number
          subscriber_id?: string
          technician_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "technician_ratings_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_ratings_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_ratings_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_ratings_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_ratings_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_ratings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_ratings_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "tickets_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_stats: {
        Row: {
          average_rating: number | null
          completed_jobs: number | null
          created_at: string | null
          id: string
          reputation_level: string | null
          technician_id: string
          total_jobs: number | null
          total_points: number | null
          total_ratings: number | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          completed_jobs?: number | null
          created_at?: string | null
          id?: string
          reputation_level?: string | null
          technician_id: string
          total_jobs?: number | null
          total_points?: number | null
          total_ratings?: number | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          completed_jobs?: number | null
          created_at?: string | null
          id?: string
          reputation_level?: string | null
          technician_id?: string
          total_jobs?: number | null
          total_points?: number | null
          total_ratings?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "technician_stats_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: true
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_stats_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: true
            referencedRelation: "technicians_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "technician_stats_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: true
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians: {
        Row: {
          available: boolean | null
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string
          specialization: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone: string
          specialization?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string
          specialization?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ticket_events: {
        Row: {
          created_at: string
          created_by: string | null
          event_data: Json | null
          event_type: string
          id: string
          latitude: number | null
          longitude: number | null
          ticket_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          ticket_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_events_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      user_dashboard_layout: {
        Row: {
          created_at: string
          id: string
          layout_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          layout_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          layout_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_security_settings: {
        Row: {
          allow_multiple_sessions: boolean
          created_at: string
          id: string
          two_factor_enabled: boolean
          two_factor_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allow_multiple_sessions?: boolean
          created_at?: string
          id?: string
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allow_multiple_sessions?: boolean
          created_at?: string
          id?: string
          two_factor_enabled?: boolean
          two_factor_secret?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      visit_logs: {
        Row: {
          actual_travel_minutes: number | null
          actual_work_minutes: number | null
          after_photos: string[] | null
          arrival_location: Json | null
          arrived_at: string | null
          before_photos: string[] | null
          completed_at: string | null
          completion_location: Json | null
          created_at: string
          customer_feedback: string | null
          customer_rating: number | null
          departed_at: string | null
          departure_location: Json | null
          eta_minutes: number | null
          id: string
          notes: string | null
          technician_id: string
          ticket_id: string
          updated_at: string
          work_started_at: string | null
        }
        Insert: {
          actual_travel_minutes?: number | null
          actual_work_minutes?: number | null
          after_photos?: string[] | null
          arrival_location?: Json | null
          arrived_at?: string | null
          before_photos?: string[] | null
          completed_at?: string | null
          completion_location?: Json | null
          created_at?: string
          customer_feedback?: string | null
          customer_rating?: number | null
          departed_at?: string | null
          departure_location?: Json | null
          eta_minutes?: number | null
          id?: string
          notes?: string | null
          technician_id: string
          ticket_id: string
          updated_at?: string
          work_started_at?: string | null
        }
        Update: {
          actual_travel_minutes?: number | null
          actual_work_minutes?: number | null
          after_photos?: string[] | null
          arrival_location?: Json | null
          arrived_at?: string | null
          before_photos?: string[] | null
          completed_at?: string | null
          completion_location?: Json | null
          created_at?: string
          customer_feedback?: string | null
          customer_rating?: number | null
          departed_at?: string | null
          departure_location?: Json | null
          eta_minutes?: number | null
          id?: string
          notes?: string | null
          technician_id?: string
          ticket_id?: string
          updated_at?: string
          work_started_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visit_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_logs_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          account: string | null
          amount: number
          created_at: string | null
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          description: string | null
          expense_type: string | null
          id: string
          voucher_number: string
          voucher_type: Database["public"]["Enums"]["voucher_type"]
        }
        Insert: {
          account?: string | null
          amount: number
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          expense_type?: string | null
          id?: string
          voucher_number: string
          voucher_type: Database["public"]["Enums"]["voucher_type"]
        }
        Update: {
          account?: string | null
          amount?: number
          created_at?: string | null
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          description?: string | null
          expense_type?: string | null
          id?: string
          voucher_number?: string
          voucher_type?: Database["public"]["Enums"]["voucher_type"]
        }
        Relationships: []
      }
      work_logs: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          ended_at: string | null
          id: string
          notes: string | null
          started_at: string | null
          status: string | null
          technician_id: string
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
          technician_id: string
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          started_at?: string | null
          status?: string | null
          technician_id?: string
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_logs_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_map_view"
            referencedColumns: ["id"]
          },
        ]
      }
      work_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          photo_type: string
          photo_url: string
          technician_id: string
          ticket_id: string
          work_log_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_type: string
          photo_url: string
          technician_id: string
          ticket_id: string
          work_log_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          photo_type?: string
          photo_url?: string
          technician_id?: string
          ticket_id?: string
          work_log_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_photos_work_log_id_fkey"
            columns: ["work_log_id"]
            isOneToOne: false
            referencedRelation: "work_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      work_reports: {
        Row: {
          created_at: string | null
          customer_signature: string | null
          diagnosis: string | null
          id: string
          labor_cost: number | null
          parts_cost: number | null
          parts_used: Json | null
          report_status: string | null
          signed_at: string | null
          subscriber_id: string
          technician_id: string
          ticket_id: string
          total_cost: number | null
          updated_at: string | null
          work_log_id: string
          work_performed: string | null
        }
        Insert: {
          created_at?: string | null
          customer_signature?: string | null
          diagnosis?: string | null
          id?: string
          labor_cost?: number | null
          parts_cost?: number | null
          parts_used?: Json | null
          report_status?: string | null
          signed_at?: string | null
          subscriber_id: string
          technician_id: string
          ticket_id: string
          total_cost?: number | null
          updated_at?: string | null
          work_log_id: string
          work_performed?: string | null
        }
        Update: {
          created_at?: string | null
          customer_signature?: string | null
          diagnosis?: string | null
          id?: string
          labor_cost?: number | null
          parts_cost?: number | null
          parts_used?: Json | null
          report_status?: string | null
          signed_at?: string | null
          subscriber_id?: string
          technician_id?: string
          ticket_id?: string
          total_cost?: number | null
          updated_at?: string | null
          work_log_id?: string
          work_performed?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "work_reports_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_reports_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_reports_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_reports_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_reports_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_reports_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_reports_work_log_id_fkey"
            columns: ["work_log_id"]
            isOneToOne: false
            referencedRelation: "work_logs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      public_packages: {
        Row: {
          active: boolean | null
          description: string | null
          id: string | null
          name: string | null
          name_en: string | null
          speed_mbps: number | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id?: string | null
          name?: string | null
          name_en?: string | null
          speed_mbps?: number | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string | null
          name?: string | null
          name_en?: string | null
          speed_mbps?: number | null
        }
        Relationships: []
      }
      subscribers_map_view: {
        Row: {
          address: string | null
          agent_id: string | null
          id: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          agent_id?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          agent_id?: string | null
          id?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscribers_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      technicians_map_view: {
        Row: {
          available: boolean | null
          heading: number | null
          id: string | null
          last_location_update: string | null
          latitude: number | null
          longitude: number | null
          name: string | null
          phone: string | null
          specialization: string | null
          speed: number | null
          status: string | null
          user_id: string | null
        }
        Relationships: []
      }
      technicians_public: {
        Row: {
          available: boolean | null
          id: string | null
          name: string | null
          specialization: string | null
        }
        Insert: {
          available?: boolean | null
          id?: string | null
          name?: string | null
          specialization?: string | null
        }
        Update: {
          available?: boolean | null
          id?: string | null
          name?: string | null
          specialization?: string | null
        }
        Relationships: []
      }
      tickets_map_view: {
        Row: {
          created_at: string | null
          id: string | null
          issue_description: string | null
          latitude: number | null
          location_address: string | null
          longitude: number | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subscriber_address: string | null
          subscriber_name: string | null
          subscriber_phone: string | null
          technician_id: string | null
          technician_name: string | null
          ticket_number: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_map_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "technicians_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_discount_coupon: {
        Args: {
          p_coupon_code: string
          p_invoice_amount: number
          p_subscriber_id: string
        }
        Returns: {
          discount_amount: number
          message: string
          success: boolean
        }[]
      }
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      calculate_loyalty_points: {
        Args: { p_amount: number; p_subscriber_id: string }
        Returns: number
      }
      check_expired_contracts: { Args: never; Returns: undefined }
      check_otp_rate_limit: {
        Args: { p_phone: string }
        Returns: {
          can_send: boolean
          message: string
          wait_seconds: number
        }[]
      }
      check_password_reset_rate_limit: {
        Args: { p_identifier: string }
        Returns: boolean
      }
      check_verification_attempts: {
        Args: { p_phone: string }
        Returns: {
          attempts_left: number
          can_verify: boolean
          message: string
        }[]
      }
      check_version: {
        Args: {
          p_expected_version: number
          p_record_id: string
          p_table_name: string
        }
        Returns: boolean
      }
      cleanup_expired_otps: { Args: never; Returns: undefined }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_old_data: { Args: never; Returns: undefined }
      cleanup_old_location_data: { Args: never; Returns: undefined }
      clear_verification_attempts: {
        Args: { p_phone: string }
        Returns: undefined
      }
      find_nearest_technician: {
        Args: {
          max_distance_km?: number
          target_lat: number
          target_lng: number
        }
        Returns: {
          distance_km: number
          latitude: number
          longitude: number
          phone: string
          status: string
          technician_id: string
          technician_name: string
        }[]
      }
      generate_complaint_number: { Args: never; Returns: string }
      generate_contract_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_referral_code: {
        Args: { p_subscriber_id: string }
        Returns: string
      }
      generate_ticket_number: { Args: never; Returns: string }
      generate_voucher_number: { Args: never; Returns: string }
      has_permission: {
        Args: { _permission_name: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_login_attempt: {
        Args: {
          p_email: string
          p_error_message?: string
          p_ip_address: unknown
          p_success: boolean
          p_user_agent: string
          p_user_id: string
        }
        Returns: string
      }
      insert_sms_log: {
        Args: {
          p_message: string
          p_phone: string
          p_status?: string
          p_subscriber_id?: string
          p_template_id?: string
        }
        Returns: string
      }
      log_admin_pii_access: {
        Args: {
          p_access_reason?: string
          p_accessed_fields: string[]
          p_accessed_record_id: string
          p_accessed_table: string
        }
        Returns: string
      }
      log_employee_location_access: {
        Args: {
          p_accessed_user_id?: string
          p_accessor_id: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_query_type?: string
          p_records_count?: number
          p_user_agent?: string
        }
        Returns: string
      }
      log_login_attempt: {
        Args: {
          p_email: string
          p_error_message?: string
          p_ip_address: unknown
          p_success: boolean
          p_user_agent: string
          p_user_id: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_action: string
          p_ip_address?: unknown
          p_metadata?: Json
          p_resource_id?: string
          p_resource_type?: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: string
      }
      log_sensitive_operation: {
        Args: {
          p_action: string
          p_ip_address?: unknown
          p_new_data?: Json
          p_old_data?: Json
          p_resource_id?: string
          p_resource_type: string
          p_user_agent?: string
        }
        Returns: string
      }
      manage_otp_rate_limit: {
        Args: { p_action: string; p_phone: string }
        Returns: Json
      }
      manage_password_reset_token: {
        Args: { p_action: string; p_token_hash: string; p_user_id: string }
        Returns: Json
      }
      manage_session: {
        Args: {
          p_action: string
          p_ip_address?: unknown
          p_session_token: string
          p_user_agent?: string
          p_user_id: string
        }
        Returns: Json
      }
      process_payment_transaction: {
        Args: {
          p_amount: number
          p_invoice_id: string
          p_notes: string
          p_payment_date: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_subscriber_id: string
          p_user_id: string
        }
        Returns: string
      }
      record_failed_verification: {
        Args: { p_phone: string }
        Returns: undefined
      }
      record_otp_sent: { Args: { p_phone: string }; Returns: undefined }
      refresh_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          permission_description: string
          permission_name: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      update_sms_log_status: {
        Args: { p_id: string; p_provider_response?: Json; p_status: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "accountant"
        | "technician"
        | "user"
        | "client"
        | "agent"
        | "super_admin"
        | "technical_manager"
        | "finance_manager"
      contract_status:
        | "active"
        | "expired"
        | "suspended"
        | "cancelled"
        | "pending"
      currency_type: "IQD" | "USD"
      invoice_status: "pending" | "paid" | "overdue" | "cancelled"
      payment_method: "cash" | "bank_transfer" | "card" | "other"
      ticket_priority: "low" | "medium" | "high" | "urgent"
      ticket_status:
        | "open"
        | "in_progress"
        | "resolved"
        | "closed"
        | "new"
        | "accepted_by_agent"
        | "tech_assigned"
        | "tech_on_the_way"
        | "tech_arrived"
      voucher_type: "receipt" | "expense"
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
      app_role: [
        "admin",
        "accountant",
        "technician",
        "user",
        "client",
        "agent",
        "super_admin",
        "technical_manager",
        "finance_manager",
      ],
      contract_status: [
        "active",
        "expired",
        "suspended",
        "cancelled",
        "pending",
      ],
      currency_type: ["IQD", "USD"],
      invoice_status: ["pending", "paid", "overdue", "cancelled"],
      payment_method: ["cash", "bank_transfer", "card", "other"],
      ticket_priority: ["low", "medium", "high", "urgent"],
      ticket_status: [
        "open",
        "in_progress",
        "resolved",
        "closed",
        "new",
        "accepted_by_agent",
        "tech_assigned",
        "tech_on_the_way",
        "tech_arrived",
      ],
      voucher_type: ["receipt", "expense"],
    },
  },
} as const
