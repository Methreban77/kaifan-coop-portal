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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      ho_requirements: {
        Row: {
          category: string | null
          category_id: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string
          description_ar: string | null
          id: string
          status: Database["public"]["Enums"]["requirement_status"]
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description: string
          description_ar?: string | null
          id?: string
          status?: Database["public"]["Enums"]["requirement_status"]
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string
          description_ar?: string | null
          id?: string
          status?: Database["public"]["Enums"]["requirement_status"]
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ho_requirements_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "partner_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      partner_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          name: string
          name_ar: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name: string
          name_ar?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          name_ar?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      partner_contracts: {
        Row: {
          contract_file_path: string | null
          contract_number: string
          contract_value: number | null
          created_at: string
          currency: string | null
          end_date: string
          id: string
          notes: string | null
          partner_id: string
          proposal_id: string | null
          renewal_notice_days: number | null
          request_id: string | null
          responsible_department: string | null
          start_date: string
          status: Database["public"]["Enums"]["contract_status"]
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          contract_file_path?: string | null
          contract_number: string
          contract_value?: number | null
          created_at?: string
          currency?: string | null
          end_date: string
          id?: string
          notes?: string | null
          partner_id: string
          proposal_id?: string | null
          renewal_notice_days?: number | null
          request_id?: string | null
          responsible_department?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["contract_status"]
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          contract_file_path?: string | null
          contract_number?: string
          contract_value?: number | null
          created_at?: string
          currency?: string | null
          end_date?: string
          id?: string
          notes?: string | null
          partner_id?: string
          proposal_id?: string | null
          renewal_notice_days?: number | null
          request_id?: string | null
          responsible_department?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["contract_status"]
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "partner_proposals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_contracts_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "partner_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_profiles: {
        Row: {
          approval_status: Database["public"]["Enums"]["partner_status"]
          approved_at: string | null
          approved_by: string | null
          avg_rating: number
          category_ids: string[]
          commercial_register: string | null
          contact_mobile: string | null
          contact_person: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          established_year: number | null
          id: string
          partner_id: string
          primary_category_id: string | null
          ratings_count: number
          services_provided: string | null
          services_provided_ar: string | null
          status: string
          suspension_reason: string | null
          tax_number: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          approval_status?: Database["public"]["Enums"]["partner_status"]
          approved_at?: string | null
          approved_by?: string | null
          avg_rating?: number
          category_ids?: string[]
          commercial_register?: string | null
          contact_mobile?: string | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          established_year?: number | null
          id?: string
          partner_id: string
          primary_category_id?: string | null
          ratings_count?: number
          services_provided?: string | null
          services_provided_ar?: string | null
          status?: string
          suspension_reason?: string | null
          tax_number?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          approval_status?: Database["public"]["Enums"]["partner_status"]
          approved_at?: string | null
          approved_by?: string | null
          avg_rating?: number
          category_ids?: string[]
          commercial_register?: string | null
          contact_mobile?: string | null
          contact_person?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          established_year?: number | null
          id?: string
          partner_id?: string
          primary_category_id?: string | null
          ratings_count?: number
          services_provided?: string | null
          services_provided_ar?: string | null
          status?: string
          suspension_reason?: string | null
          tax_number?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendor_profiles_primary_category_id_fkey"
            columns: ["primary_category_id"]
            isOneToOne: false
            referencedRelation: "partner_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_proposal_documents: {
        Row: {
          doc_type: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          proposal_id: string
          size_bytes: number | null
          uploaded_at: string
        }
        Insert: {
          doc_type?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          proposal_id: string
          size_bytes?: number | null
          uploaded_at?: string
        }
        Update: {
          doc_type?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          proposal_id?: string
          size_bytes?: number | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_proposal_documents_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "partner_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_proposals: {
        Row: {
          created_at: string
          currency: string
          delivery_period_days: number | null
          exceptions: string | null
          financial_offer: number
          financial_score: number | null
          id: string
          notes: string | null
          partner_id: string
          request_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          sla: string | null
          status: Database["public"]["Enums"]["proposal_status"]
          technical_offer: string | null
          technical_score: number | null
          updated_at: string
          warranty_period_months: number | null
        }
        Insert: {
          created_at?: string
          currency?: string
          delivery_period_days?: number | null
          exceptions?: string | null
          financial_offer: number
          financial_score?: number | null
          id?: string
          notes?: string | null
          partner_id: string
          request_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          sla?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          technical_offer?: string | null
          technical_score?: number | null
          updated_at?: string
          warranty_period_months?: number | null
        }
        Update: {
          created_at?: string
          currency?: string
          delivery_period_days?: number | null
          exceptions?: string | null
          financial_offer?: number
          financial_score?: number | null
          id?: string
          notes?: string | null
          partner_id?: string
          request_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          sla?: string | null
          status?: Database["public"]["Enums"]["proposal_status"]
          technical_offer?: string | null
          technical_score?: number | null
          updated_at?: string
          warranty_period_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_proposals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "partner_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_ratings: {
        Row: {
          comment: string | null
          communication: number
          created_at: string
          deadline_commit: number | null
          delivery: number
          id: string
          partner_id: string
          price_score: number
          quality: number
          quotation_id: string | null
          rated_by: string
          requirement_compliance: number | null
          response_time: number | null
          technical_capab: number | null
          updated_at: string
        }
        Insert: {
          comment?: string | null
          communication: number
          created_at?: string
          deadline_commit?: number | null
          delivery: number
          id?: string
          partner_id: string
          price_score: number
          quality: number
          quotation_id?: string | null
          rated_by: string
          requirement_compliance?: number | null
          response_time?: number | null
          technical_capab?: number | null
          updated_at?: string
        }
        Update: {
          comment?: string | null
          communication?: number
          created_at?: string
          deadline_commit?: number | null
          delivery?: number
          id?: string
          partner_id?: string
          price_score?: number
          quality?: number
          quotation_id?: string | null
          rated_by?: string
          requirement_compliance?: number | null
          response_time?: number | null
          technical_capab?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_ratings_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          created_at: string
          created_by: string | null
          currency: string
          deadline: string | null
          description: string
          description_ar: string | null
          id: string
          priority: string
          published_at: string | null
          request_type: Database["public"]["Enums"]["request_type"]
          status: string
          title: string
          title_ar: string | null
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deadline?: string | null
          description: string
          description_ar?: string | null
          id?: string
          priority?: string
          published_at?: string | null
          request_type?: Database["public"]["Enums"]["request_type"]
          status?: string
          title: string
          title_ar?: string | null
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          deadline?: string | null
          description?: string
          description_ar?: string | null
          id?: string
          priority?: string
          published_at?: string | null
          request_type?: Database["public"]["Enums"]["request_type"]
          status?: string
          title?: string
          title_ar?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "partner_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_review_history: {
        Row: {
          actor_id: string | null
          created_at: string
          from_status: Database["public"]["Enums"]["proposal_status"] | null
          id: string
          notes: string | null
          proposal_id: string
          to_status: Database["public"]["Enums"]["proposal_status"]
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["proposal_status"] | null
          id?: string
          notes?: string | null
          proposal_id: string
          to_status: Database["public"]["Enums"]["proposal_status"]
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          from_status?: Database["public"]["Enums"]["proposal_status"] | null
          id?: string
          notes?: string | null
          proposal_id?: string
          to_status?: Database["public"]["Enums"]["proposal_status"]
        }
        Relationships: [
          {
            foreignKeyName: "partner_review_history_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "partner_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      quotation_documents: {
        Row: {
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          quotation_id: string
          size_bytes: number | null
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          quotation_id: string
          size_bytes?: number | null
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          quotation_id?: string
          size_bytes?: number | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotation_documents_quotation_id_fkey"
            columns: ["quotation_id"]
            isOneToOne: false
            referencedRelation: "quotations"
            referencedColumns: ["id"]
          },
        ]
      }
      quotations: {
        Row: {
          created_at: string
          currency: string
          id: string
          notes: string | null
          price: number
          requirement_id: string
          status: Database["public"]["Enums"]["quotation_status"]
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          price: number
          requirement_id: string
          status?: Database["public"]["Enums"]["quotation_status"]
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          price?: number
          requirement_id?: string
          status?: Database["public"]["Enums"]["quotation_status"]
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotations_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "ho_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      has_any_role: {
        Args: {
          _roles: Database["public"]["Enums"]["app_role"][]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      primary_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "employee"
        | "shareholder"
        | "vendor"
        | "manager"
        | "partner"
        | "hr_admin"
        | "procurement_admin"
        | "shareholder_admin"
        | "partner_admin"
        | "it_admin"
      contract_status: "draft" | "active" | "expired" | "terminated" | "renewed"
      partner_status: "pending" | "active" | "suspended" | "rejected"
      proposal_status:
        | "submitted"
        | "under_review"
        | "technical_eval"
        | "financial_eval"
        | "approved"
        | "rejected"
        | "awarded"
      quotation_status: "pending" | "approved" | "rejected"
      request_type:
        | "tender"
        | "price_quotation"
        | "maintenance"
        | "service"
        | "project"
        | "contract_renewal"
        | "technical_evaluation"
        | "emergency"
      requirement_status: "open" | "closed" | "awarded"
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
      app_role: [
        "admin",
        "employee",
        "shareholder",
        "vendor",
        "manager",
        "partner",
        "hr_admin",
        "procurement_admin",
        "shareholder_admin",
        "partner_admin",
        "it_admin",
      ],
      contract_status: ["draft", "active", "expired", "terminated", "renewed"],
      partner_status: ["pending", "active", "suspended", "rejected"],
      proposal_status: [
        "submitted",
        "under_review",
        "technical_eval",
        "financial_eval",
        "approved",
        "rejected",
        "awarded",
      ],
      quotation_status: ["pending", "approved", "rejected"],
      request_type: [
        "tender",
        "price_quotation",
        "maintenance",
        "service",
        "project",
        "contract_renewal",
        "technical_evaluation",
        "emergency",
      ],
      requirement_status: ["open", "closed", "awarded"],
    },
  },
} as const
