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
      artist_items: {
        Row: {
          active: boolean
          artist_id: string
          claimed_count: number
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          kind: Database["public"]["Enums"]["artist_item_kind"]
          price_grv: number
          supply: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          artist_id: string
          claimed_count?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          kind: Database["public"]["Enums"]["artist_item_kind"]
          price_grv?: number
          supply?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          artist_id?: string
          claimed_count?: number
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          kind?: Database["public"]["Enums"]["artist_item_kind"]
          price_grv?: number
          supply?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      item_claims: {
        Row: {
          artist_id: string
          created_at: string
          id: string
          item_id: string
          price_paid: number
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          id?: string
          item_id: string
          price_paid?: number
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          id?: string
          item_id?: string
          price_paid?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_claims_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "artist_items"
            referencedColumns: ["id"]
          },
        ]
      }
      live_drop_claims: {
        Row: {
          artist_id: string
          created_at: string
          drop_id: string
          id: string
          price_paid: number
          user_id: string
        }
        Insert: {
          artist_id: string
          created_at?: string
          drop_id: string
          id?: string
          price_paid?: number
          user_id: string
        }
        Update: {
          artist_id?: string
          created_at?: string
          drop_id?: string
          id?: string
          price_paid?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_drop_claims_drop_id_fkey"
            columns: ["drop_id"]
            isOneToOne: false
            referencedRelation: "live_drops"
            referencedColumns: ["id"]
          },
        ]
      }
      live_drops: {
        Row: {
          active: boolean
          artist_id: string
          claimed_count: number
          created_at: string
          description: string | null
          ends_at: string
          id: string
          image_url: string | null
          kind: Database["public"]["Enums"]["artist_item_kind"]
          price_grv: number
          starts_at: string
          supply: number
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          artist_id: string
          claimed_count?: number
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          image_url?: string | null
          kind: Database["public"]["Enums"]["artist_item_kind"]
          price_grv?: number
          starts_at: string
          supply?: number
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          artist_id?: string
          claimed_count?: number
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          image_url?: string | null
          kind?: Database["public"]["Enums"]["artist_item_kind"]
          price_grv?: number
          starts_at?: string
          supply?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          points: number
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          points: number
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          points?: number
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          id: string
          likes_count: number
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          id?: string
          likes_count?: number
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          id?: string
          likes_count?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          grv_points: number
          id: string
          level: string
          name: string
          photo_url: string | null
          profile_type: Database["public"]["Enums"]["profile_type"]
          selected_genres: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          grv_points?: number
          id?: string
          level?: string
          name: string
          photo_url?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"]
          selected_genres?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          grv_points?: number
          id?: string
          level?: string
          name?: string
          photo_url?: string | null
          profile_type?: Database["public"]["Enums"]["profile_type"]
          selected_genres?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_missions: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          mission_key: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_key: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          mission_key?: string
          user_id?: string
        }
        Relationships: []
      }
      vip_claims: {
        Row: {
          cost_paid: number
          created_at: string
          id: string
          perk_id: string
          user_id: string
        }
        Insert: {
          cost_paid?: number
          created_at?: string
          id?: string
          perk_id: string
          user_id: string
        }
        Update: {
          cost_paid?: number
          created_at?: string
          id?: string
          perk_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vip_claims_perk_id_fkey"
            columns: ["perk_id"]
            isOneToOne: false
            referencedRelation: "vip_perks"
            referencedColumns: ["id"]
          },
        ]
      }
      vip_perks: {
        Row: {
          active: boolean
          claimed_count: number
          cost_grv: number
          created_at: string
          description: string
          icon: string
          id: string
          required_level: string
          required_points: number
          supply: number
          title: string
        }
        Insert: {
          active?: boolean
          claimed_count?: number
          cost_grv?: number
          created_at?: string
          description: string
          icon?: string
          id?: string
          required_level: string
          required_points?: number
          supply?: number
          title: string
        }
        Update: {
          active?: boolean
          claimed_count?: number
          cost_grv?: number
          created_at?: string
          description?: string
          icon?: string
          id?: string
          required_level?: string
          required_points?: number
          supply?: number
          title?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      become_artist: { Args: never; Returns: Json }
      claim_artist_item: { Args: { _item_id: string }; Returns: Json }
      claim_live_drop: { Args: { _drop_id: string }; Returns: Json }
      claim_mission: { Args: { _mission_key: string }; Returns: Json }
      claim_vip_perk: { Args: { _perk_id: string }; Returns: Json }
      compute_level: { Args: { points: number }; Returns: string }
      create_artist_item: {
        Args: {
          _description: string
          _image_url: string
          _kind: Database["public"]["Enums"]["artist_item_kind"]
          _price_grv: number
          _supply: number
          _title: string
        }
        Returns: Json
      }
      create_comment: {
        Args: { _content: string; _post_id: string }
        Returns: Json
      }
      create_live_drop: {
        Args: {
          _description: string
          _ends_at: string
          _image_url: string
          _kind: Database["public"]["Enums"]["artist_item_kind"]
          _price_grv: number
          _starts_at: string
          _supply: number
          _title: string
        }
        Returns: Json
      }
      create_post: { Args: { _content: string }; Returns: Json }
      get_explorer_feed: {
        Args: { _filter?: string; _limit?: number }
        Returns: {
          action: string
          created_at: string
          description: string
          id: string
          points: number
          tx_hash: string
          user_id: string
          user_level: string
          user_name: string
        }[]
      }
      get_explorer_stats: { Args: never; Returns: Json }
      get_live_drops: {
        Args: never
        Returns: {
          artist_id: string
          artist_name: string
          claimed_by_me: boolean
          claimed_count: number
          description: string
          ends_at: string
          id: string
          image_url: string
          kind: Database["public"]["Enums"]["artist_item_kind"]
          price_grv: number
          starts_at: string
          status: string
          supply: number
          title: string
        }[]
      }
      toggle_like: { Args: { _post_id: string }; Returns: Json }
    }
    Enums: {
      artist_item_kind: "nft" | "experience"
      profile_type: "fan" | "musician"
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
      artist_item_kind: ["nft", "experience"],
      profile_type: ["fan", "musician"],
    },
  },
} as const
