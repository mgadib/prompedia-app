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
      ai_models: {
        Row: {
          description: string | null
          free: boolean | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          provider: string
          type: string
        }
        Insert: {
          description?: string | null
          free?: boolean | null
          icon?: string | null
          id: string
          is_active?: boolean | null
          name: string
          provider: string
          type: string
        }
        Update: {
          description?: string | null
          free?: boolean | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          provider?: string
          type?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          created_at: string
          id: string
          is_guest: boolean
          last_used_at: string | null
          session_id: string | null
          updated_at: string | null
          usage_count: number
          usage_date: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_guest?: boolean
          last_used_at?: string | null
          session_id?: string | null
          updated_at?: string | null
          usage_count?: number
          usage_date?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_guest?: boolean
          last_used_at?: string | null
          session_id?: string | null
          updated_at?: string | null
          usage_count?: number
          usage_date?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_sessions: {
        Row: {
          created_at: string | null
          daily_limit: number | null
          id: string
          ip_address: string | null
          last_used_at: string | null
          session_id: string
          usage_count: number | null
          usage_date: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          ip_address?: string | null
          last_used_at?: string | null
          session_id: string
          usage_count?: number | null
          usage_date?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          daily_limit?: number | null
          id?: string
          ip_address?: string | null
          last_used_at?: string | null
          session_id?: string
          usage_count?: number | null
          usage_date?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      prompt_tags: {
        Row: {
          prompt_id: string
          tag_id: string
        }
        Insert: {
          prompt_id: string
          tag_id: string
        }
        Update: {
          prompt_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_tags_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          color: string | null
          content: string
          created_at: string
          description: string | null
          id: string
          is_featured: boolean
          is_public: boolean
          mode_id: string
          model_id: string
          original_prompt_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          content: string
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_public?: boolean
          mode_id: string
          model_id: string
          original_prompt_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean
          is_public?: boolean
          mode_id?: string
          model_id?: string
          original_prompt_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_mode_id_fkey"
            columns: ["mode_id"]
            isOneToOne: false
            referencedRelation: "thinking_modes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_model_id_fkey"
            columns: ["model_id"]
            isOneToOne: false
            referencedRelation: "ai_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_original_prompt_id_fkey1"
            columns: ["original_prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          color: string | null
          description: string | null
          id: string
          is_system: boolean
          name: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tags_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      thinking_modes: {
        Row: {
          description: string
          icon: string
          id: string
          instructions: string
          name: string
          output_structure: string[] | null
          purpose: string | null
          thinking_pattern: string | null
        }
        Insert: {
          description: string
          icon: string
          id: string
          instructions: string
          name: string
          output_structure?: string[] | null
          purpose?: string | null
          thinking_pattern?: string | null
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          instructions?: string
          name?: string
          output_structure?: string[] | null
          purpose?: string | null
          thinking_pattern?: string | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          ended_at: string | null
          id: string
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          display_name: string | null
          id: string
          username: string
        }
        Insert: {
          display_name?: string | null
          id: string
          username: string
        }
        Update: {
          display_name?: string | null
          id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_usage: {
        Args: {
          p_is_guest?: boolean
          p_session_id?: string
          p_user_id?: string
        }
        Returns: Json
      }
      get_guest_usage: { Args: { p_session_id: string }; Returns: Json }
      get_user_usage: { Args: { p_user_id: string }; Returns: Json }
      increment_ai_usage: {
        Args: {
          p_is_guest?: boolean
          p_session_id?: string
          p_user_id?: string
        }
        Returns: Json
      }
      increment_guest_usage: { Args: { p_session_id: string }; Returns: Json }
      increment_user_usage: { Args: { p_user_id: string }; Returns: Json }
      reset_daily_usage: { Args: never; Returns: number }
      track_guest_usage: {
        Args: {
          p_ip_address?: string
          p_session_id: string
          p_user_agent?: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
