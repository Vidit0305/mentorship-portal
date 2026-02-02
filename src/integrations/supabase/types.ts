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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      active_mentorships: {
        Row: {
          id: string
          mentee_id: string
          mentor_id: string
          started_at: string
        }
        Insert: {
          id?: string
          mentee_id: string
          mentor_id: string
          started_at?: string
        }
        Update: {
          id?: string
          mentee_id?: string
          mentor_id?: string
          started_at?: string
        }
        Relationships: []
      }
      mentee_profiles: {
        Row: {
          career_goals: string | null
          course: string | null
          created_at: string
          id: string
          interests: string[] | null
          section: string | null
          semester: string | null
          specialisation: string | null
          updated_at: string
          user_id: string
          year: string | null
        }
        Insert: {
          career_goals?: string | null
          course?: string | null
          created_at?: string
          id?: string
          interests?: string[] | null
          section?: string | null
          semester?: string | null
          specialisation?: string | null
          updated_at?: string
          user_id: string
          year?: string | null
        }
        Update: {
          career_goals?: string | null
          course?: string | null
          created_at?: string
          id?: string
          interests?: string[] | null
          section?: string | null
          semester?: string | null
          specialisation?: string | null
          updated_at?: string
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
      mentee_queries: {
        Row: {
          course_program_year: string
          created_at: string
          domain_guidance: string
          email: string
          expected_outcome: string
          full_name: string
          id: string
          mentee_id: string
          mentor_id: string
          mentorship_duration: string
          mentorship_type: string
          query_description: string
          share_token: string
          university_name: string
          updated_at: string
          why_this_mentor: string
        }
        Insert: {
          course_program_year: string
          created_at?: string
          domain_guidance: string
          email: string
          expected_outcome: string
          full_name: string
          id?: string
          mentee_id: string
          mentor_id: string
          mentorship_duration: string
          mentorship_type: string
          query_description: string
          share_token?: string
          university_name: string
          updated_at?: string
          why_this_mentor: string
        }
        Update: {
          course_program_year?: string
          created_at?: string
          domain_guidance?: string
          email?: string
          expected_outcome?: string
          full_name?: string
          id?: string
          mentee_id?: string
          mentor_id?: string
          mentorship_duration?: string
          mentorship_type?: string
          query_description?: string
          share_token?: string
          university_name?: string
          updated_at?: string
          why_this_mentor?: string
        }
        Relationships: []
      }
      mentor_profiles: {
        Row: {
          areas_of_guidance: string[] | null
          bio: string | null
          created_at: string
          current_mentees: number | null
          experience: string | null
          expertise: string[] | null
          id: string
          is_available: boolean | null
          max_mentees: number | null
          mentor_type: Database["public"]["Enums"]["mentor_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          areas_of_guidance?: string[] | null
          bio?: string | null
          created_at?: string
          current_mentees?: number | null
          experience?: string | null
          expertise?: string[] | null
          id?: string
          is_available?: boolean | null
          max_mentees?: number | null
          mentor_type?: Database["public"]["Enums"]["mentor_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          areas_of_guidance?: string[] | null
          bio?: string | null
          created_at?: string
          current_mentees?: number | null
          experience?: string | null
          expertise?: string[] | null
          id?: string
          is_available?: boolean | null
          max_mentees?: number | null
          mentor_type?: Database["public"]["Enums"]["mentor_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentorship_requests: {
        Row: {
          created_at: string
          goals: string
          id: string
          introduction: string
          mentee_id: string
          mentor_id: string
          rejection_message: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          goals: string
          id?: string
          introduction: string
          mentee_id: string
          mentor_id: string
          rejection_message?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          goals?: string
          id?: string
          introduction?: string
          mentee_id?: string
          mentor_id?: string
          rejection_message?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
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
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "mentee" | "mentor" | "admin"
      mentor_type: "senior" | "alumni" | "faculty"
      request_status: "pending" | "accepted" | "rejected"
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
      app_role: ["mentee", "mentor", "admin"],
      mentor_type: ["senior", "alumni", "faculty"],
      request_status: ["pending", "accepted", "rejected"],
    },
  },
} as const
