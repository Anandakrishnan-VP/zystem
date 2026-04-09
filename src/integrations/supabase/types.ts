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
      body_metrics: {
        Row: {
          age: number
          created_at: string
          height_cm: number
          hip_cm: number | null
          id: string
          neck_cm: number | null
          sex: string
          updated_at: string
          user_id: string
          waist_cm: number | null
          weight_kg: number
        }
        Insert: {
          age: number
          created_at?: string
          height_cm: number
          hip_cm?: number | null
          id?: string
          neck_cm?: number | null
          sex: string
          updated_at?: string
          user_id: string
          waist_cm?: number | null
          weight_kg: number
        }
        Update: {
          age?: number
          created_at?: string
          height_cm?: number
          hip_cm?: number | null
          id?: string
          neck_cm?: number | null
          sex?: string
          updated_at?: string
          user_id?: string
          waist_cm?: number | null
          weight_kg?: number
        }
        Relationships: []
      }
      bucket_list: {
        Row: {
          completed: boolean
          created_at: string
          id: string
          text: string
          user_id: string
          year: number
        }
        Insert: {
          completed?: boolean
          created_at?: string
          id?: string
          text: string
          user_id: string
          year: number
        }
        Update: {
          completed?: boolean
          created_at?: string
          id?: string
          text?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      challenge_checkins: {
        Row: {
          challenge_id: string
          checkin_date: string
          completed: boolean
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          checkin_date?: string
          completed?: boolean
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          checkin_date?: string
          completed?: boolean
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_checkins_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_participants: {
        Row: {
          challenge_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_participants_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_task_completions: {
        Row: {
          challenge_id: string
          completion_date: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          challenge_id: string
          completion_date?: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          challenge_id?: string
          completion_date?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_task_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "challenge_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_tasks: {
        Row: {
          challenge_id: string
          created_at: string
          created_by: string
          id: string
          name: string
        }
        Insert: {
          challenge_id: string
          created_at?: string
          created_by: string
          id?: string
          name: string
        }
        Update: {
          challenge_id?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_tasks_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          creator_id: string
          description: string
          end_date: string
          goal: string
          id: string
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string
          end_date: string
          goal?: string
          id?: string
          start_date: string
          title: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string
          end_date?: string
          goal?: string
          id?: string
          start_date?: string
          title?: string
        }
        Relationships: []
      }
      countdown_targets: {
        Row: {
          created_at: string
          id: string
          label: string
          target_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label?: string
          target_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          target_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      friend_codes: {
        Row: {
          created_at: string
          friend_code: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_code: number
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_code?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      friend_requests: {
        Row: {
          created_at: string
          id: string
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          id: string
          user_id_1: string
          user_id_2: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id_1: string
          user_id_2: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id_1?: string
          user_id_2?: string
        }
        Relationships: []
      }
      habit_completions: {
        Row: {
          completed: boolean
          completion_date: string | null
          created_at: string
          day_of_week: string
          habit_id: string
          id: string
          user_id: string
          week_start: string
        }
        Insert: {
          completed?: boolean
          completion_date?: string | null
          created_at?: string
          day_of_week: string
          habit_id: string
          id?: string
          user_id: string
          week_start: string
        }
        Update: {
          completed?: boolean
          completion_date?: string | null
          created_at?: string
          day_of_week?: string
          habit_id?: string
          id?: string
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_completions_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          created_at: string
          day_of_week: string | null
          id: string
          name: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: string | null
          id?: string
          name: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: string | null
          id?: string
          name?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      link_groups: {
        Row: {
          created_at: string
          id: string
          name: string
          sort_order: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          sort_order?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          sort_order?: number
          user_id?: string
        }
        Relationships: []
      }
      muscle_training: {
        Row: {
          created_at: string
          id: string
          muscle_group: string
          trained_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          muscle_group: string
          trained_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          muscle_group?: string
          trained_date?: string
          user_id?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      revived_dates: {
        Row: {
          created_at: string
          id: string
          revived_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          revived_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          revived_date?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_links: {
        Row: {
          created_at: string
          group_id: string
          id: string
          notes: string | null
          sort_order: number
          tags: string[] | null
          title: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          notes?: string | null
          sort_order?: number
          tags?: string[] | null
          title: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          notes?: string | null
          sort_order?: number
          tags?: string[] | null
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_links_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "link_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      streak_revivals: {
        Row: {
          created_at: string
          id: string
          revivals_available: number
          revivals_earned_total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          revivals_available?: number
          revivals_earned_total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          revivals_available?: number
          revivals_earned_total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      todos: {
        Row: {
          completed: boolean
          created_at: string
          deadline: string
          id: string
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          deadline: string
          id?: string
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          deadline?: string
          id?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      water_intake: {
        Row: {
          bottles_drunk: number
          created_at: string
          id: string
          intake_date: string
          target_bottles: number
          updated_at: string
          user_id: string
        }
        Insert: {
          bottles_drunk?: number
          created_at?: string
          id?: string
          intake_date?: string
          target_bottles?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          bottles_drunk?: number
          created_at?: string
          id?: string
          intake_date?: string
          target_bottles?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
