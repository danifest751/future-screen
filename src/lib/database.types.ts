// Auto-generated Supabase types. Do not edit manually.
// Generated at: 2026-04-03T19:40:00.000Z
// Command: npx supabase gen types typescript --project-id pyframwlnqrzeynqcvle --schema public

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
      calculator_config: {
        Row: {
          cost_params: Json | null
          id: number
          pitch_options: Json | null
          screen_products: Json | null
          size_presets: Json | null
          updated_at: string | null
        }
        Insert: {
          cost_params?: Json | null
          id?: number
          pitch_options?: Json | null
          screen_products?: Json | null
          size_presets?: Json | null
          updated_at?: string | null
        }
        Update: {
          cost_params?: Json | null
          id?: number
          pitch_options?: Json | null
          screen_products?: Json | null
          size_presets?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      case_media_links: {
        Row: {
          case_id: number
          created_at: string
          id: string
          media_id: string
          sort_order: number
        }
        Insert: {
          case_id: number
          created_at?: string
          id?: string
          media_id: string
          sort_order?: number
        }
        Update: {
          case_id?: number
          created_at?: string
          id?: string
          media_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "case_media_links_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_media_links_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_items"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          city: string | null
          city_en: string | null
          created_at: string | null
          date: string | null
          date_en: string | null
          format: string | null
          format_en: string | null
          id: number
          images: string[] | null
          metrics: string | null
          metrics_en: string | null
          services: string[] | null
          slug: string
          summary: string | null
          summary_en: string | null
          title: string
          title_en: string | null
          updated_at: string | null
          videos: string[] | null
        }
        Insert: {
          city?: string | null
          city_en?: string | null
          created_at?: string | null
          date?: string | null
          date_en?: string | null
          format?: string | null
          format_en?: string | null
          id?: number
          images?: string[] | null
          metrics?: string | null
          metrics_en?: string | null
          services?: string[] | null
          slug: string
          summary?: string | null
          summary_en?: string | null
          title: string
          title_en?: string | null
          updated_at?: string | null
          videos?: string[] | null
        }
        Update: {
          city?: string | null
          city_en?: string | null
          created_at?: string | null
          date?: string | null
          date_en?: string | null
          format?: string | null
          format_en?: string | null
          id?: number
          images?: string[] | null
          metrics?: string | null
          metrics_en?: string | null
          services?: string[] | null
          slug?: string
          summary?: string | null
          summary_en?: string | null
          title?: string
          title_en?: string | null
          updated_at?: string | null
          videos?: string[] | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          bullets: string[] | null
          bullets_en: string[] | null
          created_at: string | null
          id: number
          page_path: string | null
          short_description: string | null
          short_description_en: string | null
          title: string
          title_en: string | null
        }
        Insert: {
          bullets?: string[] | null
          bullets_en?: string[] | null
          created_at?: string | null
          id?: number
          page_path?: string | null
          short_description?: string | null
          short_description_en?: string | null
          title: string
          title_en?: string | null
        }
        Update: {
          bullets?: string[] | null
          bullets_en?: string[] | null
          created_at?: string | null
          id?: number
          page_path?: string | null
          short_description?: string | null
          short_description_en?: string | null
          title?: string
          title_en?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: string | null
          address_en: string | null
          emails: string[] | null
          id: number
          phones: string[] | null
          updated_at: string | null
          working_hours: string | null
          working_hours_en: string | null
        }
        Insert: {
          address?: string | null
          address_en?: string | null
          emails?: string[] | null
          id?: number
          phones?: string[] | null
          updated_at?: string | null
          working_hours?: string | null
          working_hours_en?: string | null
        }
        Update: {
          address?: string | null
          address_en?: string | null
          emails?: string[] | null
          id?: number
          phones?: string[] | null
          updated_at?: string | null
          working_hours?: string | null
          working_hours_en?: string | null
        }
        Relationships: []
      }
      file_materials: {
        Row: {
          file_id: string | null
          id: string
          material_id: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          file_id?: string | null
          id?: string
          material_id: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          file_id?: string | null
          id?: string
          material_id?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_materials_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "workspace_files"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          city: string | null
          comment: string | null
          created_at: string | null
          date: string | null
          deleted_at: string | null
          delivery_log: Json | null
          email: string | null
          extra: Json | null
          format: string | null
          id: string
          name: string
          page_path: string | null
          phone: string
          read_at: string | null
          referrer: string | null
          request_id: string | null
          source: string
          status: string | null
          telegram: string | null
        }
        Insert: {
          city?: string | null
          comment?: string | null
          created_at?: string | null
          date?: string | null
          deleted_at?: string | null
          delivery_log?: Json | null
          email?: string | null
          extra?: Json | null
          format?: string | null
          id?: string
          name: string
          page_path?: string | null
          phone: string
          read_at?: string | null
          referrer?: string | null
          request_id?: string | null
          source: string
          status?: string | null
          telegram?: string | null
        }
        Update: {
          city?: string | null
          comment?: string | null
          created_at?: string | null
          date?: string | null
          deleted_at?: string | null
          delivery_log?: Json | null
          email?: string | null
          extra?: Json | null
          format?: string | null
          id?: string
          name?: string
          page_path?: string | null
          phone?: string
          read_at?: string | null
          referrer?: string | null
          request_id?: string | null
          source?: string
          status?: string | null
          telegram?: string | null
        }
        Relationships: []
      }
      media_items: {
        Row: {
          created_at: string
          duration: number | null
          height: number | null
          id: string
          mime_type: string
          name: string
          public_url: string
          size_bytes: number
          storage_path: string
          tags: string[] | null
          telegram_message_id: number | null
          thumbnail_url: string | null
          type: string
          updated_at: string
          uploaded_by: string
          width: number | null
        }
        Insert: {
          created_at?: string
          duration?: number | null
          height?: number | null
          id?: string
          mime_type: string
          name: string
          public_url: string
          size_bytes?: number
          storage_path: string
          tags?: string[] | null
          telegram_message_id?: number | null
          thumbnail_url?: string | null
          type: string
          updated_at?: string
          uploaded_by?: string
          width?: number | null
        }
        Update: {
          created_at?: string
          duration?: number | null
          height?: number | null
          id?: string
          mime_type?: string
          name?: string
          public_url?: string
          size_bytes?: number
          storage_path?: string
          tags?: string[] | null
          telegram_message_id?: number | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
          uploaded_by?: string
          width?: number | null
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string | null
          for_formats: string[] | null
          for_formats_en: string[] | null
          id: number
          includes: string[] | null
          includes_en: string[] | null
          name: string
          name_en: string | null
          options: string[] | null
          options_en: string[] | null
          price_hint: string | null
          price_hint_en: string | null
        }
        Insert: {
          created_at?: string | null
          for_formats?: string[] | null
          for_formats_en?: string[] | null
          id?: number
          includes?: string[] | null
          includes_en?: string[] | null
          name: string
          name_en?: string | null
          options?: string[] | null
          options_en?: string[] | null
          price_hint?: string | null
          price_hint_en?: string | null
        }
        Update: {
          created_at?: string | null
          for_formats?: string[] | null
          for_formats_en?: string[] | null
          id?: number
          includes?: string[] | null
          includes_en?: string[] | null
          name?: string
          name_en?: string | null
          options?: string[] | null
          options_en?: string[] | null
          price_hint?: string | null
          price_hint_en?: string | null
        }
        Relationships: []
      }
      rental_categories: {
        Row: {
          about: Json
          about_en: Json
          benefits: Json
          benefits_en: Json
          bottom_cta: Json
          bottom_cta_en: Json
          created_at: string
          faq: Json
          faq_en: Json
          gallery: Json
          gallery_en: Json
          hero: Json
          hero_en: Json
          id: number
          is_published: boolean
          name: string
          name_en: string | null
          seo: Json
          seo_en: Json
          service_includes: Json
          service_includes_en: Json
          short_name: string
          short_name_en: string | null
          slug: string
          sort_order: number
          updated_at: string
          use_cases: Json
          use_cases_en: Json
        }
        Insert: {
          about?: Json
          about_en?: Json
          benefits?: Json
          benefits_en?: Json
          bottom_cta?: Json
          bottom_cta_en?: Json
          created_at?: string
          faq?: Json
          faq_en?: Json
          gallery?: Json
          gallery_en?: Json
          hero?: Json
          hero_en?: Json
          id?: number
          is_published?: boolean
          name: string
          name_en?: string | null
          seo?: Json
          seo_en?: Json
          service_includes?: Json
          service_includes_en?: Json
          short_name: string
          short_name_en?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
          use_cases?: Json
          use_cases_en?: Json
        }
        Update: {
          about?: Json
          about_en?: Json
          benefits?: Json
          benefits_en?: Json
          bottom_cta?: Json
          bottom_cta_en?: Json
          created_at?: string
          faq?: Json
          faq_en?: Json
          gallery?: Json
          gallery_en?: Json
          hero?: Json
          hero_en?: Json
          id?: number
          is_published?: boolean
          name?: string
          name_en?: string | null
          seo?: Json
          seo_en?: Json
          service_includes?: Json
          service_includes_en?: Json
          short_name?: string
          short_name_en?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
          use_cases?: Json
          use_cases_en?: Json
        }
        Relationships: []
      }
      shared_sheets: {
        Row: {
          created_at: string
          hash: string
          sheet_index: number
          single_result: Json
        }
        Insert: {
          created_at?: string
          hash: string
          sheet_index?: number
          single_result: Json
        }
        Update: {
          created_at?: string
          hash?: string
          sheet_index?: number
          single_result?: Json
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: string | null
          content_en: string | null
          content_html: string | null
          content_html_en: string | null
          created_at: string | null
          font_size: string | null
          font_size_en: string | null
          id: string
          is_published: boolean | null
          key: string
          meta_description: string | null
          meta_description_en: string | null
          meta_title: string | null
          meta_title_en: string | null
          title: string | null
          title_en: string | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_en?: string | null
          content_html?: string | null
          content_html_en?: string | null
          created_at?: string | null
          font_size?: string | null
          font_size_en?: string | null
          id?: string
          is_published?: boolean | null
          key: string
          meta_description?: string | null
          meta_description_en?: string | null
          meta_title?: string | null
          meta_title_en?: string | null
          title?: string | null
          title_en?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_en?: string | null
          content_html?: string | null
          content_html_en?: string | null
          created_at?: string | null
          font_size?: string | null
          font_size_en?: string | null
          id?: string
          is_published?: boolean | null
          key?: string
          meta_description?: string | null
          meta_description_en?: string | null
          meta_title?: string | null
          meta_title_en?: string | null
          title?: string | null
          title_en?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          background: string | null
          background_settings: Json | null
          id: string
          star_border_settings: Json | null
          updated_at: string | null
        }
        Insert: {
          background?: string | null
          background_settings?: Json | null
          id?: string
          star_border_settings?: Json | null
          updated_at?: string | null
        }
        Update: {
          background?: string | null
          background_settings?: Json | null
          id?: string
          star_border_settings?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      test: {
        Row: {
          created_at: string | null
          email: string | null
          id: number
          name: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: number
          name: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: number
          name?: string
        }
        Relationships: []
      }
      workspace_catalogs: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: []
      }
      workspace_files: {
        Row: {
          catalog_id: string | null
          checked: boolean
          created_at: string
          id: string
          name: string
          quantity: number
          size_bytes: number
          storage_path: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          catalog_id?: string | null
          checked?: boolean
          created_at?: string
          id?: string
          name: string
          quantity?: number
          size_bytes?: number
          storage_path: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          catalog_id?: string | null
          checked?: boolean
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          size_bytes?: number
          storage_path?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_files_catalog_id_fkey"
            columns: ["catalog_id"]
            isOneToOne: false
            referencedRelation: "workspace_catalogs"
            referencedColumns: ["id"]
          },
        ]
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
