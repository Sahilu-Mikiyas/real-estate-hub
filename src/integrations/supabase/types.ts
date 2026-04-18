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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_badges: {
        Row: {
          agent_id: string
          badge_id: string
          id: string
          unlocked_at: string
        }
        Insert: {
          agent_id: string
          badge_id: string
          id?: string
          unlocked_at?: string
        }
        Update: {
          agent_id?: string
          badge_id?: string
          id?: string
          unlocked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
          user_id: string
          user_name: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          user_id: string
          user_name?: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          points_awarded: number
          threshold_type: string
          threshold_value: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          points_awarded?: number
          threshold_type?: string
          threshold_value?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          points_awarded?: number
          threshold_type?: string
          threshold_value?: number
        }
        Relationships: []
      }
      closing_documents: {
        Row: {
          closing_id: string
          created_at: string
          doc_type: string
          file_path: string
          file_size: number | null
          id: string
          label: string
          uploaded_by: string
        }
        Insert: {
          closing_id: string
          created_at?: string
          doc_type?: string
          file_path: string
          file_size?: number | null
          id?: string
          label: string
          uploaded_by: string
        }
        Update: {
          closing_id?: string
          created_at?: string
          doc_type?: string
          file_path?: string
          file_size?: number | null
          id?: string
          label?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "closing_documents_closing_id_fkey"
            columns: ["closing_id"]
            isOneToOne: false
            referencedRelation: "closings"
            referencedColumns: ["id"]
          },
        ]
      }
      closings: {
        Row: {
          agent_id: string
          buyer_email: string | null
          buyer_id_number: string | null
          buyer_name: string
          buyer_phone: string | null
          commission_amount: number
          commission_percent: number
          completed_at: string | null
          created_at: string
          deal_length_months: number | null
          deal_price: number
          id: string
          lead_id: string | null
          notes: string | null
          parties: Json | null
          payment_method: string | null
          payment_schedule: Json | null
          property_id: string | null
          property_name: string
          seller_name: string | null
          seller_phone: string | null
          signed_date: string | null
          status: Database["public"]["Enums"]["closing_status"]
          team_id: string | null
          terms: string | null
          updated_at: string
          witnesses: Json | null
        }
        Insert: {
          agent_id: string
          buyer_email?: string | null
          buyer_id_number?: string | null
          buyer_name: string
          buyer_phone?: string | null
          commission_amount?: number
          commission_percent?: number
          completed_at?: string | null
          created_at?: string
          deal_length_months?: number | null
          deal_price?: number
          id?: string
          lead_id?: string | null
          notes?: string | null
          parties?: Json | null
          payment_method?: string | null
          payment_schedule?: Json | null
          property_id?: string | null
          property_name: string
          seller_name?: string | null
          seller_phone?: string | null
          signed_date?: string | null
          status?: Database["public"]["Enums"]["closing_status"]
          team_id?: string | null
          terms?: string | null
          updated_at?: string
          witnesses?: Json | null
        }
        Update: {
          agent_id?: string
          buyer_email?: string | null
          buyer_id_number?: string | null
          buyer_name?: string
          buyer_phone?: string | null
          commission_amount?: number
          commission_percent?: number
          completed_at?: string | null
          created_at?: string
          deal_length_months?: number | null
          deal_price?: number
          id?: string
          lead_id?: string | null
          notes?: string | null
          parties?: Json | null
          payment_method?: string | null
          payment_schedule?: Json | null
          property_id?: string | null
          property_name?: string
          seller_name?: string | null
          seller_phone?: string | null
          signed_date?: string | null
          status?: Database["public"]["Enums"]["closing_status"]
          team_id?: string | null
          terms?: string | null
          updated_at?: string
          witnesses?: Json | null
        }
        Relationships: []
      }
      lead_followups: {
        Row: {
          action: Database["public"]["Enums"]["followup_action"]
          agent_id: string
          created_at: string
          id: string
          lead_id: string
          new_status: string | null
          next_action_date: string | null
          notes: string | null
          old_status: string | null
          team_id: string | null
        }
        Insert: {
          action?: Database["public"]["Enums"]["followup_action"]
          agent_id: string
          created_at?: string
          id?: string
          lead_id: string
          new_status?: string | null
          next_action_date?: string | null
          notes?: string | null
          old_status?: string | null
          team_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["followup_action"]
          agent_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          new_status?: string | null
          next_action_date?: string | null
          notes?: string | null
          old_status?: string | null
          team_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_followups_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          agent_id: string
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string
          potential: Database["public"]["Enums"]["lead_potential"]
          property: string | null
          remarks: string | null
          status: Database["public"]["Enums"]["lead_status"]
          team_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone: string
          potential?: Database["public"]["Enums"]["lead_potential"]
          property?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string
          potential?: Database["public"]["Enums"]["lead_potential"]
          property?: string | null
          remarks?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          team_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profile_preferences: {
        Row: {
          bio: string | null
          created_at: string
          notify_closings: boolean
          notify_email: boolean
          notify_in_app: boolean
          notify_leads: boolean
          phone: string | null
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          notify_closings?: boolean
          notify_email?: boolean
          notify_in_app?: boolean
          notify_leads?: boolean
          phone?: string | null
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          notify_closings?: boolean
          notify_email?: boolean
          notify_in_app?: boolean
          notify_leads?: boolean
          phone?: string | null
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          area_sqft: number | null
          bathrooms: number | null
          bedrooms: number | null
          block: string
          created_at: string
          description: string | null
          features: string[] | null
          gallery_images: string[] | null
          id: string
          location: string
          map_url: string | null
          name: string
          plan_images: string[] | null
          price: number
          price_label: string
          status: Database["public"]["Enums"]["property_status"]
          type: Database["public"]["Enums"]["property_type"]
          updated_at: string
        }
        Insert: {
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          block?: string
          created_at?: string
          description?: string | null
          features?: string[] | null
          gallery_images?: string[] | null
          id?: string
          location?: string
          map_url?: string | null
          name: string
          plan_images?: string[] | null
          price?: number
          price_label?: string
          status?: Database["public"]["Enums"]["property_status"]
          type: Database["public"]["Enums"]["property_type"]
          updated_at?: string
        }
        Update: {
          area_sqft?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          block?: string
          created_at?: string
          description?: string | null
          features?: string[] | null
          gallery_images?: string[] | null
          id?: string
          location?: string
          map_url?: string | null
          name?: string
          plan_images?: string[] | null
          price?: number
          price_label?: string
          status?: Database["public"]["Enums"]["property_status"]
          type?: Database["public"]["Enums"]["property_type"]
          updated_at?: string
        }
        Relationships: []
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          threshold_points: number
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          threshold_points?: number
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          threshold_points?: number
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      scoring_rules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          points_per_action: number
          rule_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          points_per_action?: number
          rule_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          points_per_action?: number
          rule_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          notes: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          post_date: string
          property: string | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          notes?: string | null
          platform: Database["public"]["Enums"]["social_platform"]
          post_date?: string
          property?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          platform?: Database["public"]["Enums"]["social_platform"]
          post_date?: string
          property?: string | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visits: {
        Row: {
          agent_id: string
          client_name: string
          created_at: string
          id: string
          outcome: string | null
          property: string | null
          team_id: string | null
          updated_at: string
          visit_date: string
          visit_type: Database["public"]["Enums"]["visit_type"]
        }
        Insert: {
          agent_id: string
          client_name: string
          created_at?: string
          id?: string
          outcome?: string | null
          property?: string | null
          team_id?: string | null
          updated_at?: string
          visit_date?: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
        }
        Update: {
          agent_id?: string
          client_name?: string
          created_at?: string
          id?: string
          outcome?: string | null
          property?: string | null
          team_id?: string | null
          updated_at?: string
          visit_date?: string
          visit_type?: Database["public"]["Enums"]["visit_type"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_team: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "agent" | "supervisor" | "admin"
      closing_status: "draft" | "pending" | "completed" | "cancelled"
      followup_action:
        | "status_change"
        | "note"
        | "call"
        | "email"
        | "meeting"
        | "reminder"
      lead_potential: "high" | "medium" | "low"
      lead_status:
        | "new"
        | "contacted"
        | "potential"
        | "negotiating"
        | "closed"
        | "lost"
      notification_type: "success" | "info" | "warning"
      property_status: "available" | "sold" | "reserved"
      property_type: "plot" | "villa" | "shop" | "flat"
      social_platform:
        | "facebook"
        | "instagram"
        | "telegram"
        | "tiktok"
        | "linkedin"
        | "twitter"
      visit_type: "site" | "office"
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
      app_role: ["agent", "supervisor", "admin"],
      closing_status: ["draft", "pending", "completed", "cancelled"],
      followup_action: [
        "status_change",
        "note",
        "call",
        "email",
        "meeting",
        "reminder",
      ],
      lead_potential: ["high", "medium", "low"],
      lead_status: [
        "new",
        "contacted",
        "potential",
        "negotiating",
        "closed",
        "lost",
      ],
      notification_type: ["success", "info", "warning"],
      property_status: ["available", "sold", "reserved"],
      property_type: ["plot", "villa", "shop", "flat"],
      social_platform: [
        "facebook",
        "instagram",
        "telegram",
        "tiktok",
        "linkedin",
        "twitter",
      ],
      visit_type: ["site", "office"],
    },
  },
} as const
