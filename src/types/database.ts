// Supabase Database Types
// Personal Finance App

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          firebase_uid: string
          email: string
          display_name: string | null
          avatar_url: string | null
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          firebase_uid: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          firebase_uid?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          currency?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          type: 'income' | 'expense'
          category: string
          description?: string | null
          date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          type?: 'income' | 'expense'
          category?: string
          description?: string | null
          date?: string
          updated_at?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          amount: number
          period: 'weekly' | 'monthly' | 'yearly'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          amount: number
          period?: 'weekly' | 'monthly' | 'yearly'
          created_at?: string
          updated_at?: string
        }
        Update: {
          category?: string
          amount?: number
          period?: 'weekly' | 'monthly' | 'yearly'
          updated_at?: string
        }
      }
      savings_goals: {
        Row: {
          id: string
          user_id: string
          name: string
          target_amount: number
          current_amount: number
          deadline: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          target_amount: number
          current_amount?: number
          deadline?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          target_amount?: number
          current_amount?: number
          deadline?: string | null
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          user_id: string | null
          name: string
          icon: string | null
          color: string | null
          type: 'income' | 'expense' | 'both'
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          icon?: string | null
          color?: string | null
          type: 'income' | 'expense' | 'both'
          is_system?: boolean
          created_at?: string
        }
        Update: {
          name?: string
          icon?: string | null
          color?: string | null
          type?: 'income' | 'expense' | 'both'
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      transaction_type: 'income' | 'expense'
      budget_period: 'weekly' | 'monthly' | 'yearly'
      category_type: 'income' | 'expense' | 'both'
    }
  }
}

// Helper types for easier access
export type User = Database['public']['Tables']['users']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type SavingsGoal = Database['public']['Tables']['savings_goals']['Row']
export type Category = Database['public']['Tables']['categories']['Row']

export type NewTransaction = Database['public']['Tables']['transactions']['Insert']
export type UpdateTransaction = Database['public']['Tables']['transactions']['Update']

export type NewBudget = Database['public']['Tables']['budgets']['Insert']
export type UpdateBudget = Database['public']['Tables']['budgets']['Update']

export type NewSavingsGoal = Database['public']['Tables']['savings_goals']['Insert']
export type UpdateSavingsGoal = Database['public']['Tables']['savings_goals']['Update']
