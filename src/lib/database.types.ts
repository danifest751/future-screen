// Сгенерированные типы Supabase (ручная генерация на основе схемы)
// Для автогенерации: npx supabase gen types typescript --project-id pyframwlnqrzeynqcvle

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      cases: {
        Row: {
          slug: string;
          title: string;
          city: string;
          date: string;
          format: string;
          services: string[];
          summary: string;
          metrics: string | null;
          images: string[] | null;
          videos: string[] | null;
          created_at: string;
        };
        Insert: {
          slug: string;
          title: string;
          city?: string;
          date?: string;
          format?: string;
          services?: string[];
          summary?: string;
          metrics?: string | null;
          images?: string[] | null;
          videos?: string[] | null;
          created_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          city?: string;
          date?: string;
          format?: string;
          services?: string[];
          summary?: string;
          metrics?: string | null;
          images?: string[] | null;
          videos?: string[] | null;
          created_at?: string;
        };
      };
      packages: {
        Row: {
          id: number;
          name: string;
          for_formats: string[];
          includes: string[];
          options: string[] | null;
          price_hint: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          name: string;
          for_formats?: string[];
          includes?: string[];
          options?: string[] | null;
          price_hint?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          name?: string;
          for_formats?: string[];
          includes?: string[];
          options?: string[] | null;
          price_hint?: string;
          created_at?: string;
        };
      };
      categories: {
        Row: {
          id: number;
          title: string;
          short_description: string;
          bullets: string[];
          page_path: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          short_description?: string;
          bullets?: string[];
          page_path?: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          short_description?: string;
          bullets?: string[];
          page_path?: string;
          created_at?: string;
        };
      };
      contacts: {
        Row: {
          id: number;
          phones: string[] | null;
          emails: string[] | null;
          address: string | null;
          working_hours: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          phones?: string[] | null;
          emails?: string[] | null;
          address?: string | null;
          working_hours?: string | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          phones?: string[] | null;
          emails?: string[] | null;
          address?: string | null;
          working_hours?: string | null;
          created_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          created_at: string;
          source: string;
          name: string;
          phone: string;
          email: string | null;
          telegram: string | null;
          city: string | null;
          date: string | null;
          format: string | null;
          comment: string | null;
          extra: Json | null;
          page_path: string | null;
          referrer: string | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          source?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          telegram?: string | null;
          city?: string | null;
          date?: string | null;
          format?: string | null;
          comment?: string | null;
          extra?: Json | null;
          page_path?: string | null;
          referrer?: string | null;
          status?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          source?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          telegram?: string | null;
          city?: string | null;
          date?: string | null;
          format?: string | null;
          comment?: string | null;
          extra?: Json | null;
          page_path?: string | null;
          referrer?: string | null;
          status?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
};
