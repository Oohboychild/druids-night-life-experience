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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          after_data: Json | null
          before_data: Json | null
          club_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          club_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          after_data?: Json | null
          before_data?: Json | null
          club_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      clubs: {
        Row: {
          created_at: string
          currency: string
          id: string
          name: string
          slug: string
          song_priority_price_kes: number | null
          song_queue_public: boolean
          song_requests_enabled: boolean
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          name: string
          slug: string
          song_priority_price_kes?: number | null
          song_queue_public?: boolean
          song_requests_enabled?: boolean
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          name?: string
          slug?: string
          song_priority_price_kes?: number | null
          song_queue_public?: boolean
          song_requests_enabled?: boolean
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      menu_categories: {
        Row: {
          club_id: string
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["menu_kind"]
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["menu_kind"]
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["menu_kind"]
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_categories_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          category_id: string
          club_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          name: string
          price_kes: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          category_id: string
          club_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name: string
          price_kes: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          category_id?: string
          club_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          name?: string
          price_kes?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_category_id_club_id_fkey"
            columns: ["category_id", "club_id"]
            isOneToOne: false
            referencedRelation: "menu_categories"
            referencedColumns: ["id", "club_id"]
          },
          {
            foreignKeyName: "menu_items_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          club_id: string
          created_at: string
          id: string
          read_at: string | null
          ref_id: string
          ref_type: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          club_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          ref_id: string
          ref_type: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          club_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          ref_id?: string
          ref_type?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total_kes: number | null
          menu_item_id: string | null
          name: string
          order_id: string
          quantity: number
          unit_price_kes: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total_kes?: number | null
          menu_item_id?: string | null
          name: string
          order_id: string
          quantity: number
          unit_price_kes: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total_kes?: number | null
          menu_item_id?: string | null
          name?: string
          order_id?: string
          quantity?: number
          unit_price_kes?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          accepted_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          claimed_at: string | null
          claimed_by: string | null
          club_id: string
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          id: string
          notes: string | null
          order_number: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["order_payment_status"]
          preparing_at: string | null
          ready_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          table_id: string | null
          table_label: string
          total_kes: number
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          club_id: string
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_number?: never
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["order_payment_status"]
          preparing_at?: string | null
          ready_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string | null
          table_label: string
          total_kes?: number
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          club_id?: string
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          id?: string
          notes?: string | null
          order_number?: never
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["order_payment_status"]
          preparing_at?: string | null
          ready_at?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          table_id?: string | null
          table_label?: string
          total_kes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_kes: number
          checkout_request_id: string | null
          club_id: string
          created_at: string
          id: string
          merchant_request_id: string | null
          method: Database["public"]["Enums"]["payment_method"]
          mpesa_receipt: string | null
          order_id: string
          phone: string | null
          raw_callback: Json | null
          recorded_by: string | null
          result_code: number | null
          result_desc: string | null
          status: Database["public"]["Enums"]["payment_attempt_status"]
          updated_at: string
        }
        Insert: {
          amount_kes: number
          checkout_request_id?: string | null
          club_id: string
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          method: Database["public"]["Enums"]["payment_method"]
          mpesa_receipt?: string | null
          order_id: string
          phone?: string | null
          raw_callback?: Json | null
          recorded_by?: string | null
          result_code?: number | null
          result_desc?: string | null
          status?: Database["public"]["Enums"]["payment_attempt_status"]
          updated_at?: string
        }
        Update: {
          amount_kes?: number
          checkout_request_id?: string | null
          club_id?: string
          created_at?: string
          id?: string
          merchant_request_id?: string | null
          method?: Database["public"]["Enums"]["payment_method"]
          mpesa_receipt?: string | null
          order_id?: string
          phone?: string | null
          raw_callback?: Json | null
          recorded_by?: string | null
          result_code?: number | null
          result_desc?: string | null
          status?: Database["public"]["Enums"]["payment_attempt_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          is_active: boolean
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      song_requests: {
        Row: {
          accepted_at: string | null
          artist: string
          club_id: string
          created_at: string
          customer_id: string | null
          dedication: string | null
          dj_priority: number
          handled_by: string | null
          id: string
          played_at: string | null
          priority_paid: boolean
          priority_requested: boolean
          rejected_at: string | null
          status: Database["public"]["Enums"]["song_status"]
          table_id: string | null
          table_label: string
          title: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          artist: string
          club_id: string
          created_at?: string
          customer_id?: string | null
          dedication?: string | null
          dj_priority?: number
          handled_by?: string | null
          id?: string
          played_at?: string | null
          priority_paid?: boolean
          priority_requested?: boolean
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["song_status"]
          table_id?: string | null
          table_label: string
          title: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          artist?: string
          club_id?: string
          created_at?: string
          customer_id?: string | null
          dedication?: string | null
          dj_priority?: number
          handled_by?: string | null
          id?: string
          played_at?: string | null
          priority_paid?: boolean
          priority_requested?: boolean
          rejected_at?: string | null
          status?: Database["public"]["Enums"]["song_status"]
          table_id?: string | null
          table_label?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "song_requests_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_requests_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "song_requests_table_id_fkey"
            columns: ["table_id"]
            isOneToOne: false
            referencedRelation: "tables"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_assignments: {
        Row: {
          club_id: string
          created_at: string
          id: string
          is_active: boolean
          profile_id: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          profile_id: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          profile_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_assignments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tables: {
        Row: {
          club_id: string
          created_at: string
          id: string
          is_active: boolean
          label: string
          qr_token: string
          updated_at: string
        }
        Insert: {
          club_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          qr_token?: string
          updated_at?: string
        }
        Update: {
          club_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          qr_token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tables_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_order: {
        Args: {
          p_new_status: Database["public"]["Enums"]["order_status"]
          p_order_id: string
        }
        Returns: {
          accepted_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          claimed_at: string | null
          claimed_by: string | null
          club_id: string
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          id: string
          notes: string | null
          order_number: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["order_payment_status"]
          preparing_at: string | null
          ready_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          table_id: string | null
          table_label: string
          total_kes: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      cancel_order: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: {
          accepted_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          claimed_at: string | null
          claimed_by: string | null
          club_id: string
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          id: string
          notes: string | null
          order_number: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["order_payment_status"]
          preparing_at: string | null
          ready_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          table_id: string | null
          table_label: string
          total_kes: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      claim_order: {
        Args: { p_order_id: string }
        Returns: {
          accepted_at: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          claimed_at: string | null
          claimed_by: string | null
          club_id: string
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          id: string
          notes: string | null
          order_number: number
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["order_payment_status"]
          preparing_at: string | null
          ready_at: string | null
          status: Database["public"]["Enums"]["order_status"]
          table_id: string | null
          table_label: string
          total_kes: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "orders"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_order: {
        Args: {
          p_items: Json
          p_notes?: string
          p_payment_method: Database["public"]["Enums"]["payment_method"]
          p_table_token: string
        }
        Returns: string
      }
      create_song_request: {
        Args: {
          p_artist: string
          p_dedication?: string
          p_priority?: boolean
          p_table_token: string
          p_title: string
        }
        Returns: string
      }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_song_queue: {
        Args: { p_club_id: string }
        Returns: {
          artist: string
          is_mine: boolean
          queue_position: number
          title: string
        }[]
      }
      has_club_role: {
        Args: {
          p_club: string
          p_roles: Database["public"]["Enums"]["app_role"][]
        }
        Returns: boolean
      }
      resolve_table_by_token: {
        Args: { p_token: string }
        Returns: {
          club_id: string
          club_name: string
          table_id: string
          table_label: string
        }[]
      }
      set_song_request_priority: {
        Args: { p_id: string; p_priority: number }
        Returns: {
          accepted_at: string | null
          artist: string
          club_id: string
          created_at: string
          customer_id: string | null
          dedication: string | null
          dj_priority: number
          handled_by: string | null
          id: string
          played_at: string | null
          priority_paid: boolean
          priority_requested: boolean
          rejected_at: string | null
          status: Database["public"]["Enums"]["song_status"]
          table_id: string | null
          table_label: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "song_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      set_song_request_status: {
        Args: {
          p_id: string
          p_status: Database["public"]["Enums"]["song_status"]
        }
        Returns: {
          accepted_at: string | null
          artist: string
          club_id: string
          created_at: string
          customer_id: string | null
          dedication: string | null
          dj_priority: number
          handled_by: string | null
          id: string
          played_at: string | null
          priority_paid: boolean
          priority_requested: boolean
          rejected_at: string | null
          status: Database["public"]["Enums"]["song_status"]
          table_id: string | null
          table_label: string
          title: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "song_requests"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      write_audit: {
        Args: {
          p_action: string
          p_after: Json
          p_before: Json
          p_club: string
          p_entity_id: string
          p_entity_type: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "customer" | "waiter" | "dj" | "admin"
      menu_kind: "food" | "drink"
      notification_type:
        | "order_received"
        | "order_accepted"
        | "order_preparing"
        | "order_ready"
        | "order_delivered"
        | "order_cancelled"
        | "song_received"
        | "song_accepted"
        | "song_rejected"
        | "song_played"
      order_payment_status: "unpaid" | "paid"
      order_status:
        | "pending"
        | "accepted"
        | "preparing"
        | "ready"
        | "delivered"
        | "cancelled"
      payment_attempt_status: "pending" | "succeeded" | "failed" | "cancelled"
      payment_method: "mpesa" | "cash"
      song_status: "pending" | "accepted" | "rejected" | "played"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["customer", "waiter", "dj", "admin"],
      menu_kind: ["food", "drink"],
      notification_type: [
        "order_received",
        "order_accepted",
        "order_preparing",
        "order_ready",
        "order_delivered",
        "order_cancelled",
        "song_received",
        "song_accepted",
        "song_rejected",
        "song_played",
      ],
      order_payment_status: ["unpaid", "paid"],
      order_status: [
        "pending",
        "accepted",
        "preparing",
        "ready",
        "delivered",
        "cancelled",
      ],
      payment_attempt_status: ["pending", "succeeded", "failed", "cancelled"],
      payment_method: ["mpesa", "cash"],
      song_status: ["pending", "accepted", "rejected", "played"],
    },
  },
} as const
