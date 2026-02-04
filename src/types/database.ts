export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Target = {
  value: number | string;
  unit: "lbs" | "reps" | "freetext";
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      lists: {
        Row: {
          id: string;
          owner_user_id: string | null;
          title: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id?: string | null;
          title: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_user_id?: string | null;
          title?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lists_owner_user_id_fkey";
            columns: ["owner_user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      list_items: {
        Row: {
          id: string;
          list_id: string;
          sort_order: number;
          name: string;
          description: string | null;
          targets: Json;
          images: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          sort_order: number;
          name: string;
          description?: string | null;
          targets?: Json;
          images?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          sort_order?: number;
          name?: string;
          description?: string | null;
          targets?: Json;
          images?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "list_items_list_id_fkey";
            columns: ["list_id"];
            referencedRelation: "lists";
            referencedColumns: ["id"];
          }
        ];
      };
      list_completions: {
        Row: {
          id: string;
          list_id: string;
          user_id: string | null;
          anon_session_id: string | null;
          completed_at: string;
          week_start: string;
          notes: string | null;
        };
        Insert: {
          id?: string;
          list_id: string;
          user_id?: string | null;
          anon_session_id?: string | null;
          completed_at?: string;
          week_start: string;
          notes?: string | null;
        };
        Update: {
          id?: string;
          list_id?: string;
          user_id?: string | null;
          anon_session_id?: string | null;
          completed_at?: string;
          week_start?: string;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "list_completions_list_id_fkey";
            columns: ["list_id"];
            referencedRelation: "lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "list_completions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      list_item_results: {
        Row: {
          id: string;
          completion_id: string;
          list_item_id: string;
          is_checked: boolean;
          result_value: string | null;
          result_unit: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          completion_id: string;
          list_item_id: string;
          is_checked?: boolean;
          result_value?: string | null;
          result_unit?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          completion_id?: string;
          list_item_id?: string;
          is_checked?: boolean;
          result_value?: string | null;
          result_unit?: string | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "list_item_results_completion_id_fkey";
            columns: ["completion_id"];
            referencedRelation: "list_completions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "list_item_results_list_item_id_fkey";
            columns: ["list_item_id"];
            referencedRelation: "list_items";
            referencedColumns: ["id"];
          }
        ];
      };
      saved_lists: {
        Row: {
          id: string;
          list_id: string;
          user_id: string | null;
          anon_session_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          user_id?: string | null;
          anon_session_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          user_id?: string | null;
          anon_session_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_lists_list_id_fkey";
            columns: ["list_id"];
            referencedRelation: "lists";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_lists_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      share_links: {
        Row: {
          id: string;
          token: string;
          resource_type: string;
          resource_id: string;
          permission: string;
          scope: Json | null;
          is_active: boolean;
          expires_at: string | null;
          created_by_user_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          token: string;
          resource_type: string;
          resource_id: string;
          permission: string;
          scope?: Json | null;
          is_active?: boolean;
          expires_at?: string | null;
          created_by_user_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          token?: string;
          resource_type?: string;
          resource_id?: string;
          permission?: string;
          scope?: Json | null;
          is_active?: boolean;
          expires_at?: string | null;
          created_by_user_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "share_links_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      convert_anon_to_user: {
        Args: {
          p_anon_session_id: string;
          p_user_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
