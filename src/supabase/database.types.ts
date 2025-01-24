
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
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
  public: {
    Tables: {
      actions: {
        Row: {
          action_category: number
          action_combo: number
          action_proc_status: number
          action_timeline_hit: number
          additional_cooldown_group: number
          affects_position: boolean
          animation_end: number
          animation_start: number
          aspect: number
          attack_type: number
          behaviour_type: number
          can_target_dead: boolean
          can_target_friendly: boolean
          can_target_hostile: boolean
          can_target_party: boolean
          can_target_self: boolean
          cast_type: number
          cast100ms: number
          class_job: number
          class_job_category: number
          class_job_level: number
          cooldown_group: number
          effect_range: number
          icon: number
          id: number
          is_player_action: boolean
          is_pvp: boolean
          is_role_action: boolean
          max_charges: number
          name: string
          omen: number
          preserves_combo: boolean
          primary_cost_type: number
          primary_cost_value: number
          range: number
          recast100ms: number
          secondary_cost_type: number
          secondary_cost_value: number
          status_gain_self: number
          target_area: boolean
          unlock_link: number
          vfx: number
          xaxis_modifier: number
        }
        Insert: {
          action_category: number
          action_combo: number
          action_proc_status: number
          action_timeline_hit: number
          additional_cooldown_group: number
          affects_position: boolean
          animation_end: number
          animation_start: number
          aspect: number
          attack_type: number
          behaviour_type: number
          can_target_dead: boolean
          can_target_friendly: boolean
          can_target_hostile: boolean
          can_target_party: boolean
          can_target_self: boolean
          cast_type: number
          cast100ms: number
          class_job: number
          class_job_category: number
          class_job_level: number
          cooldown_group: number
          effect_range: number
          icon: number
          id: number
          is_player_action: boolean
          is_pvp: boolean
          is_role_action: boolean
          max_charges: number
          name: string
          omen: number
          preserves_combo: boolean
          primary_cost_type: number
          primary_cost_value: number
          range: number
          recast100ms: number
          secondary_cost_type: number
          secondary_cost_value: number
          status_gain_self: number
          target_area: boolean
          unlock_link: number
          vfx: number
          xaxis_modifier: number
        }
        Update: {
          action_category?: number
          action_combo?: number
          action_proc_status?: number
          action_timeline_hit?: number
          additional_cooldown_group?: number
          affects_position?: boolean
          animation_end?: number
          animation_start?: number
          aspect?: number
          attack_type?: number
          behaviour_type?: number
          can_target_dead?: boolean
          can_target_friendly?: boolean
          can_target_hostile?: boolean
          can_target_party?: boolean
          can_target_self?: boolean
          cast_type?: number
          cast100ms?: number
          class_job?: number
          class_job_category?: number
          class_job_level?: number
          cooldown_group?: number
          effect_range?: number
          icon?: number
          id?: number
          is_player_action?: boolean
          is_pvp?: boolean
          is_role_action?: boolean
          max_charges?: number
          name?: string
          omen?: number
          preserves_combo?: boolean
          primary_cost_type?: number
          primary_cost_value?: number
          range?: number
          recast100ms?: number
          secondary_cost_type?: number
          secondary_cost_value?: number
          status_gain_self?: number
          target_area?: boolean
          unlock_link?: number
          vfx?: number
          xaxis_modifier?: number
        }
        Relationships: []
      }
      actions2: {
        Row: {
          _unknown_10: number
          _unknown_2: boolean
          _unknown_20: boolean
          _unknown_21: boolean
          _unknown_23: boolean
          _unknown_24: boolean
          _unknown_25: number
          _unknown_27: boolean
          _unknown_31: boolean
          _unknown_39: number
          _unknown_47: number
          _unknown_5: number
          _unknown_51: number
          _unknown_52: boolean
          _unknown_55: number
          _unknown_57: boolean
          _unknown_58: boolean
          _unknown_59: boolean
          _unknown_60: boolean
          _unknown_61: boolean
          _unknown_62: boolean
          _unknown_63: boolean
          _unknown_64: boolean
          _unknown_65: number
          _unknown_66: boolean
          _unknown_67: boolean
          _unknown_69: number
          action_category: number
          action_combo: number
          action_proc_status: number
          action_timeline_hit: number
          additional_cooldown_group: number
          affects_position: boolean
          animation_end: number
          animation_start: number
          aspect: number
          attack_type: number
          behaviour_type: number
          can_target_dead: boolean
          can_target_friendly: boolean
          can_target_hostile: boolean
          can_target_party: boolean
          can_target_self: boolean
          cast_type: number
          cast100ms: number
          class_job: number
          class_job_category: number
          class_job_level: number
          cooldown_group: number
          effect_range: number
          icon: number
          id: number
          is_player_action: boolean
          is_pvp: boolean
          is_role_action: boolean
          max_charges: number
          name: string
          omen: number
          preserves_combo: boolean
          primary_cost_type: number
          primary_cost_value: number
          range: number
          recast100ms: number
          secondary_cost_type: number
          secondary_cost_value: number
          status_gain_self: number
          target_area: boolean
          unlock_link: number
          vfx: number
          xaxis_modifier: number
        }
        Insert: {
          _unknown_10: number
          _unknown_2: boolean
          _unknown_20: boolean
          _unknown_21: boolean
          _unknown_23: boolean
          _unknown_24: boolean
          _unknown_25: number
          _unknown_27: boolean
          _unknown_31: boolean
          _unknown_39: number
          _unknown_47: number
          _unknown_5: number
          _unknown_51: number
          _unknown_52: boolean
          _unknown_55: number
          _unknown_57: boolean
          _unknown_58: boolean
          _unknown_59: boolean
          _unknown_60: boolean
          _unknown_61: boolean
          _unknown_62: boolean
          _unknown_63: boolean
          _unknown_64: boolean
          _unknown_65: number
          _unknown_66: boolean
          _unknown_67: boolean
          _unknown_69: number
          action_category: number
          action_combo: number
          action_proc_status: number
          action_timeline_hit: number
          additional_cooldown_group: number
          affects_position: boolean
          animation_end: number
          animation_start: number
          aspect: number
          attack_type: number
          behaviour_type: number
          can_target_dead: boolean
          can_target_friendly: boolean
          can_target_hostile: boolean
          can_target_party: boolean
          can_target_self: boolean
          cast_type: number
          cast100ms: number
          class_job: number
          class_job_category: number
          class_job_level: number
          cooldown_group: number
          effect_range: number
          icon: number
          id: number
          is_player_action: boolean
          is_pvp: boolean
          is_role_action: boolean
          max_charges: number
          name: string
          omen: number
          preserves_combo: boolean
          primary_cost_type: number
          primary_cost_value: number
          range: number
          recast100ms: number
          secondary_cost_type: number
          secondary_cost_value: number
          status_gain_self: number
          target_area: boolean
          unlock_link: number
          vfx: number
          xaxis_modifier: number
        }
        Update: {
          _unknown_10?: number
          _unknown_2?: boolean
          _unknown_20?: boolean
          _unknown_21?: boolean
          _unknown_23?: boolean
          _unknown_24?: boolean
          _unknown_25?: number
          _unknown_27?: boolean
          _unknown_31?: boolean
          _unknown_39?: number
          _unknown_47?: number
          _unknown_5?: number
          _unknown_51?: number
          _unknown_52?: boolean
          _unknown_55?: number
          _unknown_57?: boolean
          _unknown_58?: boolean
          _unknown_59?: boolean
          _unknown_60?: boolean
          _unknown_61?: boolean
          _unknown_62?: boolean
          _unknown_63?: boolean
          _unknown_64?: boolean
          _unknown_65?: number
          _unknown_66?: boolean
          _unknown_67?: boolean
          _unknown_69?: number
          action_category?: number
          action_combo?: number
          action_proc_status?: number
          action_timeline_hit?: number
          additional_cooldown_group?: number
          affects_position?: boolean
          animation_end?: number
          animation_start?: number
          aspect?: number
          attack_type?: number
          behaviour_type?: number
          can_target_dead?: boolean
          can_target_friendly?: boolean
          can_target_hostile?: boolean
          can_target_party?: boolean
          can_target_self?: boolean
          cast_type?: number
          cast100ms?: number
          class_job?: number
          class_job_category?: number
          class_job_level?: number
          cooldown_group?: number
          effect_range?: number
          icon?: number
          id?: number
          is_player_action?: boolean
          is_pvp?: boolean
          is_role_action?: boolean
          max_charges?: number
          name?: string
          omen?: number
          preserves_combo?: boolean
          primary_cost_type?: number
          primary_cost_value?: number
          range?: number
          recast100ms?: number
          secondary_cost_type?: number
          secondary_cost_value?: number
          status_gain_self?: number
          target_area?: boolean
          unlock_link?: number
          vfx?: number
          xaxis_modifier?: number
        }
        Relationships: []
      }
      fight_events: {
        Row: {
          action_id: number
          fight_id: number
          id: number
          source_id: number | null
          source_instance: number | null
          target_id: number | null
          target_instance: number | null
          timestamp: number
          type: string
        }
        Insert: {
          action_id: number
          fight_id: number
          id?: number
          source_id?: number | null
          source_instance?: number | null
          target_id?: number | null
          target_instance?: number | null
          timestamp: number
          type: string
        }
        Update: {
          action_id?: number
          fight_id?: number
          id?: number
          source_id?: number | null
          source_instance?: number | null
          target_id?: number | null
          target_instance?: number | null
          timestamp?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "fight_events_fight_id_fkey"
            columns: ["fight_id"]
            isOneToOne: false
            referencedRelation: "report_fights"
            referencedColumns: ["id"]
          },
        ]
      }
      flogs: {
        Row: {
          created_at: string
          data: Json | null
          id: number
          level: number
          message: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: number
          level?: number
          message?: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: number
          level?: number
          message?: string
        }
        Relationships: []
      }
      macros: {
        Row: {
          body: string
          created: string | null
          deleted: boolean
          id: number
          name: string
          owner: string | null
          short_id: string
          thumbnail: string | null
          thumbnail_base64: string | null
          updated: string | null
        }
        Insert: {
          body: string
          created?: string | null
          deleted?: boolean
          id?: number
          name: string
          owner?: string | null
          short_id?: string
          thumbnail?: string | null
          thumbnail_base64?: string | null
          updated?: string | null
        }
        Update: {
          body?: string
          created?: string | null
          deleted?: boolean
          id?: number
          name?: string
          owner?: string | null
          short_id?: string
          thumbnail?: string | null
          thumbnail_base64?: string | null
          updated?: string | null
        }
        Relationships: []
      }
      notes: {
        Row: {
          body: string
          created: string | null
          deleted: boolean
          id: number
          name: string
          owner: string | null
          short_id: string
          updated: string | null
        }
        Insert: {
          body: string
          created?: string | null
          deleted?: boolean
          id?: number
          name: string
          owner?: string | null
          short_id?: string
          updated?: string | null
        }
        Update: {
          body?: string
          created?: string | null
          deleted?: boolean
          id?: number
          name?: string
          owner?: string | null
          short_id?: string
          updated?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created: string | null
          deleted: boolean
          id: number
          name: string
          owner: string | null
          plan: Json
          short_id: string
          thumbnail: string | null
          thumbnail_base64: string | null
          updated: string | null
        }
        Insert: {
          created?: string | null
          deleted?: boolean
          id?: number
          name: string
          owner?: string | null
          plan: Json
          short_id?: string
          thumbnail?: string | null
          thumbnail_base64?: string | null
          updated?: string | null
        }
        Update: {
          created?: string | null
          deleted?: boolean
          id?: number
          name?: string
          owner?: string | null
          plan?: Json
          short_id?: string
          thumbnail?: string | null
          thumbnail_base64?: string | null
          updated?: string | null
        }
        Relationships: []
      }
      report_actors: {
        Row: {
          game_id: number | null
          id: number
          name: string
          report_id: number
          subtype: string
          type: string
        }
        Insert: {
          game_id?: number | null
          id: number
          name: string
          report_id: number
          subtype: string
          type: string
        }
        Update: {
          game_id?: number | null
          id?: number
          name?: string
          report_id?: number
          subtype?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_actors_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_actors_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      report_fights: {
        Row: {
          actions: number[]
          actors: number[]
          boss_percentage: number | null
          combat_time: number | null
          encounter_id: number
          end_time: string
          fight_number: number
          id: number
          in_progress: boolean
          locator_data: Json | null
          name: string
          report_id: number
          start_time: string
          zone_id: number
          zone_name: string
        }
        Insert: {
          actions: number[]
          actors: number[]
          boss_percentage?: number | null
          combat_time?: number | null
          encounter_id: number
          end_time: string
          fight_number: number
          id?: number
          in_progress: boolean
          locator_data?: Json | null
          name: string
          report_id: number
          start_time: string
          zone_id: number
          zone_name: string
        }
        Update: {
          actions?: number[]
          actors?: number[]
          boss_percentage?: number | null
          combat_time?: number | null
          encounter_id?: number
          end_time?: string
          fight_number?: number
          id?: number
          in_progress?: boolean
          locator_data?: Json | null
          name?: string
          report_id?: number
          start_time?: string
          zone_id?: number
          zone_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_fights_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "report_summary"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_fights_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          code: string
          created_at: string
          end_time: string
          id: number
          owner: string | null
          start_time: string
          title: string | null
        }
        Insert: {
          code: string
          created_at?: string
          end_time: string
          id?: number
          owner?: string | null
          start_time: string
          title?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          end_time?: string
          id?: number
          owner?: string | null
          start_time?: string
          title?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      report_summary: {
        Row: {
          code: string | null
          created_at: string | null
          end_time: string | null
          fights: number | null
          id: number | null
          owner: string | null
          start_time: string | null
          title: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          end_time?: string | null
          fights?: never
          id?: number | null
          owner?: string | null
          start_time?: string | null
          title?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          end_time?: string | null
          fights?: never
          id?: number | null
          owner?: string | null
          start_time?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      bytea_test: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      f_insert_test: {
        Args: {
          value: string
        }
        Returns: number
      }
      get_access_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      import_fflogs_fight: {
        Args: {
          report_code: string
          fight_number: number
        }
        Returns: Json
      }
      import_fflogs_report: {
        Args: {
          report_code: string
        }
        Returns: Json
      }
      stdid_decode: {
        Args: {
          short_id: number
        }
        Returns: number
      }
      stdid_encode: {
        Args: {
          id: number
        }
        Returns: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
