// GENERATED dari skema Supabase (MCP generate_typescript_types), difilter ke tabel SC Games. Jangan diedit tangan.
// Project "20FIT ALL DATA" berisi tabel produk lain; hanya bagian SC Games yang disimpan di sini.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {

      admins: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }

      app_settings: {
        Row: {
          allowed_email_domains: string[]
          id: number
          registration_deadline: string | null
          registration_open: boolean
          updated_at: string
        }
        Insert: {
          allowed_email_domains?: string[]
          id?: number
          registration_deadline?: string | null
          registration_open?: boolean
          updated_at?: string
        }
        Update: {
          allowed_email_domains?: string[]
          id?: number
          registration_deadline?: string | null
          registration_open?: boolean
          updated_at?: string
        }
        Relationships: []
      }

      cheers: {
        Row: {
          client_id: string
          created_at: string
          id: number
          ip_hash: string | null
          message: string
          sender_name: string
          sport_slug: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: never
          ip_hash?: string | null
          message: string
          sender_name: string
          sport_slug?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: never
          ip_hash?: string | null
          message?: string
          sender_name?: string
          sport_slug?: string | null
        }
        Relationships: []
      }

      participants: {
        Row: {
          birth_date: string | null
          branch: string | null
          created_at: string
          display_name: string
          email: string
          full_name: string | null
          gender: string | null
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          branch?: string | null
          created_at?: string
          display_name: string
          email: string
          full_name?: string | null
          gender?: string | null
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          branch?: string | null
          created_at?: string
          display_name?: string
          email?: string
          full_name?: string | null
          gender?: string | null
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }

      registrations: {
        Row: {
          admin_note: string | null
          created_at: string
          division_id: number
          id: string
          participant_id: string | null
          status: string
          team_id: string | null
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          division_id: number
          id?: string
          participant_id?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          division_id?: number
          id?: string
          participant_id?: string | null
          status?: string
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registrations_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "sport_divisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registrations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "registrations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }

      sport_divisions: {
        Row: {
          entry_type: string
          gender_rule: string
          id: number
          max_players: number
          max_substitutes: number
          min_per_gender: number | null
          min_players: number
          nama: string
          needs_verification: boolean
          registration_deadline: string | null
          required_roles: string[]
          sport_id: number
        }
        Insert: {
          entry_type: string
          gender_rule?: string
          id?: never
          max_players?: number
          max_substitutes?: number
          min_per_gender?: number | null
          min_players?: number
          nama: string
          needs_verification?: boolean
          registration_deadline?: string | null
          required_roles?: string[]
          sport_id: number
        }
        Update: {
          entry_type?: string
          gender_rule?: string
          id?: never
          max_players?: number
          max_substitutes?: number
          min_per_gender?: number | null
          min_players?: number
          nama?: string
          needs_verification?: boolean
          registration_deadline?: string | null
          required_roles?: string[]
          sport_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "sport_divisions_sport_id_fkey"
            columns: ["sport_id"]
            isOneToOne: false
            referencedRelation: "sports"
            referencedColumns: ["id"]
          },
        ]
      }

      sports: {
        Row: {
          id: number
          kategori: string
          nama: string
          rulebook_path: string
          slug: string
          urutan: number
        }
        Insert: {
          id?: never
          kategori: string
          nama: string
          rulebook_path: string
          slug: string
          urutan: number
        }
        Update: {
          id?: never
          kategori?: string
          nama?: string
          rulebook_path?: string
          slug?: string
          urutan?: number
        }
        Relationships: []
      }

      team_members: {
        Row: {
          created_at: string
          id: string
          invited_email: string
          is_substitute: boolean
          participant_id: string | null
          role: string | null
          status: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_email: string
          is_substitute?: boolean
          participant_id?: string | null
          role?: string | null
          status?: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_email?: string
          is_substitute?: boolean
          participant_id?: string | null
          role?: string | null
          status?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }

      teams: {
        Row: {
          captain_id: string
          created_at: string
          division_id: number
          id: string
          nama: string
        }
        Insert: {
          captain_id: string
          created_at?: string
          division_id: number
          id?: string
          nama: string
        }
        Update: {
          captain_id?: string
          created_at?: string
          division_id?: number
          id?: string
          nama?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_captain_id_fkey"
            columns: ["captain_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "teams_division_id_fkey"
            columns: ["division_id"]
            isOneToOne: false
            referencedRelation: "sport_divisions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {

      cheer_board: {
        Row: {
          created_at: string | null
          id: number | null
          message: string | null
          sender_name: string | null
          sport_slug: string | null
        }
        Relationships: []
      }

      public_roster: {
        Row: {
          branch: string | null
          display_name: string | null
          division_id: number | null
          entry_type: string | null
          sport_id: number | null
          team_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {

      is_sc_admin: { Args: never; Returns: boolean }

      post_cheer: {
        Args: {
          p_client_id: string
          p_message: string
          p_name: string
          p_sport?: string
        }
        Returns: number
      }

      team_roster: {
        Args: { p_team: string }
        Returns: {
          display_name: string
          gender: string
          invited_email: string
          is_captain: boolean
          is_substitute: boolean
          member_id: string
          role: string
          status: string
        }[]
      }

      is_team_captain: { Args: { p_team: string }; Returns: boolean }

      is_team_member: { Args: { p_team: string }; Returns: boolean }

      validate_roster: { Args: { p_team: string }; Returns: undefined }
    }
  }
}
