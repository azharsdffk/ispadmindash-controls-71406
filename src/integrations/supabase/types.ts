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
          id: string
          latitude: number
          longitude: number
          recorded_at: string | null
          user_id: string
        }
        Insert: {
          accuracy?: number | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          latitude: number
          longitude: number
          recorded_at?: string | null
          user_id: string
        }
        Update: {
          accuracy?: number | null
          created_at?: string | null
          device_info?: Json | null
          id?: string
          latitude?: number
          longitude?: number
          recorded_at?: string | null
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
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
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
        ]
      }
      maintenance_tickets: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          issue_description: string
          issue_type: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["ticket_status"] | null
          subscriber_id: string
          technician_id: string | null
          ticket_number: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          issue_description: string
          issue_type?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subscriber_id: string
          technician_id?: string | null
          ticket_number: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          issue_description?: string
          issue_type?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["ticket_priority"] | null
          resolved_at?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["ticket_status"] | null
          subscriber_id?: string
          technician_id?: string | null
          ticket_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
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
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
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
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
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
          subscriber_id: string
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
          subscriber_id: string
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
          subscriber_id?: string
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
        ]
      }
      subscribers: {
        Row: {
          address: string | null
          address_notes: string | null
          balance: number | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string
          phone_secondary: string | null
          plan: string | null
          status_comment: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          address?: string | null
          address_notes?: string | null
          balance?: number | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone: string
          phone_secondary?: string | null
          plan?: string | null
          status_comment?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          address?: string | null
          address_notes?: string | null
          balance?: number | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string
          phone_secondary?: string | null
          plan?: string | null
          status_comment?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      technicians: {
        Row: {
          available: boolean | null
          created_at: string | null
          id: string
          name: string
          phone: string
          specialization: string | null
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          phone: string
          specialization?: string | null
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string
          specialization?: string | null
        }
        Relationships: []
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
      calculate_loyalty_points: {
        Args: { p_amount: number; p_subscriber_id: string }
        Returns: number
      }
      check_expired_contracts: { Args: never; Returns: undefined }
      check_password_reset_rate_limit: {
        Args: { p_identifier: string }
        Returns: boolean
      }
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_old_data: { Args: never; Returns: undefined }
      cleanup_old_location_data: { Args: never; Returns: undefined }
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
      refresh_user_permissions: {
        Args: { p_user_id: string }
        Returns: {
          permission_description: string
          permission_name: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "accountant" | "technician" | "user" | "client"
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
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
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
      app_role: ["admin", "accountant", "technician", "user", "client"],
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
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      voucher_type: ["receipt", "expense"],
    },
  },
} as const
