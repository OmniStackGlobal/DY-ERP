export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          address: string | null;
          bank_account_id: string | null;
          chain: Database["public"]["Enums"]["wallet_chain"] | null;
          company_id: string;
          created_at: string;
          currency: string;
          holder_name: string;
          id: string;
          identifier: string;
          is_active: boolean;
          name: string;
          note: string;
          provider: Database["public"]["Enums"]["account_provider"];
          updated_at: string;
          wallet_account_id: string | null;
        };
        ComputedFields: never;
        Insert: {
          address?: string | null;
          bank_account_id?: string | null;
          chain?: Database["public"]["Enums"]["wallet_chain"] | null;
          company_id: string;
          created_at?: string;
          currency?: string;
          holder_name?: string;
          id?: string;
          identifier?: string;
          is_active?: boolean;
          name: string;
          note?: string;
          provider: Database["public"]["Enums"]["account_provider"];
          updated_at?: string;
          wallet_account_id?: string | null;
        };
        Update: {
          address?: string | null;
          bank_account_id?: string | null;
          chain?: Database["public"]["Enums"]["wallet_chain"] | null;
          company_id?: string;
          created_at?: string;
          currency?: string;
          holder_name?: string;
          id?: string;
          identifier?: string;
          is_active?: boolean;
          name?: string;
          note?: string;
          provider?: Database["public"]["Enums"]["account_provider"];
          updated_at?: string;
          wallet_account_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_bank_account_id_fkey";
            columns: ["bank_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accounts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "accounts_wallet_account_id_fkey";
            columns: ["wallet_account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_log: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          detail: NonNullable<Json>;
          entity: string;
          entity_id: string | null;
          id: number;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          detail?: NonNullable<Json>;
          entity: string;
          entity_id?: string | null;
          id?: never;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          detail?: NonNullable<Json>;
          entity?: string;
          entity_id?: string | null;
          id?: never;
        };
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      companies: {
        Row: {
          code: string;
          color: string;
          created_at: string;
          id: string;
          is_active: boolean;
          kind: Database["public"]["Enums"]["company_kind"];
          name: string;
          note: string;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          code: string;
          color?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["company_kind"];
          name: string;
          note?: string;
          updated_at?: string;
        };
        Update: {
          code?: string;
          color?: string;
          created_at?: string;
          id?: string;
          is_active?: boolean;
          kind?: Database["public"]["Enums"]["company_kind"];
          name?: string;
          note?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_access: {
        Row: {
          company_id: string;
          created_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          company_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          company_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_access_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "company_access_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_attachments: {
        Row: {
          created_at: string;
          expense_id: string;
          file_name: string;
          id: string;
          mime_type: string;
          size_bytes: number;
          storage_path: string;
          uploaded_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          expense_id: string;
          file_name: string;
          id?: string;
          mime_type?: string;
          size_bytes?: number;
          storage_path: string;
          uploaded_by?: string | null;
        };
        Update: {
          created_at?: string;
          expense_id?: string;
          file_name?: string;
          id?: string;
          mime_type?: string;
          size_bytes?: number;
          storage_path?: string;
          uploaded_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expense_attachments_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_attachments_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      expense_categories: {
        Row: {
          created_at: string;
          id: string;
          is_active: boolean;
          name: string;
          scope: Database["public"]["Enums"]["expense_scope"];
          sort: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name: string;
          scope: Database["public"]["Enums"]["expense_scope"];
          sort?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          scope?: Database["public"]["Enums"]["expense_scope"];
          sort?: number;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          amount: number;
          category_id: string | null;
          company_id: string | null;
          created_at: string;
          created_by: string;
          currency: string;
          expense_date: string;
          handler_id: string | null;
          handler_name: string;
          id: string;
          note: string;
          scope: Database["public"]["Enums"]["expense_scope"];
          share_ratio: number | null;
          sharing: Database["public"]["Enums"]["expense_sharing"];
          updated_at: string;
          can_view_expense: boolean | null;
        };
        ComputedFields: "can_view_expense";
        Insert: {
          amount: number;
          category_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          created_by: string;
          currency?: string;
          expense_date?: string;
          handler_id?: string | null;
          handler_name?: string;
          id?: string;
          note?: string;
          scope: Database["public"]["Enums"]["expense_scope"];
          share_ratio?: number | null;
          sharing?: Database["public"]["Enums"]["expense_sharing"];
          updated_at?: string;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          company_id?: string | null;
          created_at?: string;
          created_by?: string;
          currency?: string;
          expense_date?: string;
          handler_id?: string | null;
          handler_name?: string;
          id?: string;
          note?: string;
          scope?: Database["public"]["Enums"]["expense_scope"];
          share_ratio?: number | null;
          sharing?: Database["public"]["Enums"]["expense_sharing"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "expense_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_handler_id_fkey";
            columns: ["handler_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      fx_rates: {
        Row: {
          base: string;
          fetched_at: string;
          quote: string;
          rate: number;
          rate_date: string;
          source: string;
        };
        ComputedFields: never;
        Insert: {
          base: string;
          fetched_at?: string;
          quote: string;
          rate: number;
          rate_date: string;
          source?: string;
        };
        Update: {
          base?: string;
          fetched_at?: string;
          quote?: string;
          rate?: number;
          rate_date?: string;
          source?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          is_active: boolean;
          name: string;
          role: Database["public"]["Enums"]["user_role"];
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          is_active?: boolean;
          name?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          role?: Database["public"]["Enums"]["user_role"];
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_access_company: { Args: { cid: string }; Returns: boolean };
      can_view_expense: {
        Args: {
          e: Omit<
            Database["public"]["Tables"]["expenses"]["Row"],
            Database["public"]["Tables"]["expenses"]["ComputedFields"]
          >;
        };
        Returns: boolean;
      };
      dearmor: { Args: { "": string }; Returns: string };
      gen_random_uuid: { Args: Record<PropertyKey, never>; Returns: string };
      gen_salt: { Args: { "": string }; Returns: string };
      is_active_user: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      is_finance: { Args: Record<PropertyKey, never>; Returns: boolean };
      log_action: {
        Args: { p_action: string; p_detail?: Json; p_entity: string; p_entity_id: string };
        Returns: undefined;
      };
      my_role: { Args: Record<PropertyKey, never>; Returns: Database["public"]["Enums"]["user_role"] };
      pgp_armor_headers: { Args: { "": string }; Returns: Record<string, unknown>[] };
    };
    Enums: {
      account_provider: "paypal" | "airwallex" | "wallet";
      company_kind: "client" | "management";
      expense_scope: "business" | "company";
      expense_sharing: "pending" | "client" | "management" | "shared" | "individual";
      user_role: "admin" | "finance" | "staff" | "viewer";
      wallet_chain: "tron" | "ethereum" | "base";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      account_provider: ["paypal", "airwallex", "wallet"],
      company_kind: ["client", "management"],
      expense_scope: ["business", "company"],
      expense_sharing: ["pending", "client", "management", "shared", "individual"],
      user_role: ["admin", "finance", "staff", "viewer"],
      wallet_chain: ["tron", "ethereum", "base"],
    },
  },
} as const;
