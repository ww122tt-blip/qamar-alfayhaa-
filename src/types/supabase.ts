export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      client_prices: {
        Row: {
          id: string
          client_id: string
          warehouse_id: string
          pricing_type: string
          price: number | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          warehouse_id: string
          pricing_type: string
          price?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          warehouse_id?: string
          pricing_type?: string
          price?: number | null
          created_at?: string
        }
      }
      client_pricing_rules: {
        Row: {
          id: string
          client_id: string
          warehouse_id: string
          pricing_type: string
          min_weight: number | null
          max_weight: number | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          warehouse_id: string
          pricing_type: string
          min_weight?: number | null
          max_weight?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          warehouse_id?: string
          pricing_type?: string
          min_weight?: number | null
          max_weight?: number | null
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          code: string
          name: string
          phones: string[]
          governorate: string
          district: string | null
          pricing_type: string
          delivery_price: number
          is_active: boolean
          created_at: string
          updated_at: string
          password?: string | null
          shipping_tag?: string | null
          warehouse_id?: string | null
          address?: string | null
        }
        Insert: {
          id?: string
          code: string
          name: string
          phones?: string[]
          governorate: string
          district?: string | null
          pricing_type?: string
          delivery_price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          password?: string | null
          shipping_tag?: string | null
          warehouse_id?: string | null
          address?: string | null
        }
        Update: {
          id?: string
          code?: string
          name?: string
          phones?: string[]
          governorate?: string
          district?: string | null
          pricing_type?: string
          delivery_price?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
          password?: string | null
          shipping_tag?: string | null
          warehouse_id?: string | null
          address?: string | null
        }
      }
      shipments: {
        Row: {
          id: string
          code: string
          client_id: string
          recipient_name: string
          recipient_phone: string
          recipient_phone2: string | null
          governorate: string
          district: string | null
          address: string | null
          amount: number
          delivery_fee: number
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          client_id: string
          recipient_name: string
          recipient_phone: string
          recipient_phone2?: string | null
          governorate: string
          district?: string | null
          address?: string | null
          amount?: number
          delivery_fee?: number
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          client_id?: string
          recipient_name?: string
          recipient_phone?: string
          recipient_phone2?: string | null
          governorate?: string
          district?: string | null
          address?: string | null
          amount?: number
          delivery_fee?: number
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      status_history: {
        Row: {
          id: string
          shipment_id: string
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          shipment_id: string
          status: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          shipment_id?: string
          status?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          name: string
          value: string
          type: string
          description: string | null
        }
        Insert: {
          id?: string
          key: string
          name: string
          value: string
          type?: string
          description?: string | null
        }
        Update: {
          id?: string
          key?: string
          name?: string
          value?: string
          type?: string
          description?: string | null
        }
      }
      warehouses: {
        Row: {
          id: string
          name: string
          country: string
          governorate: string | null
          address: string | null
          phone: string | null
          features: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          country: string
          governorate?: string | null
          address?: string | null
          phone?: string | null
          features?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          country?: string
          governorate?: string | null
          address?: string | null
          phone?: string | null
          features?: Json
          created_at?: string
          updated_at?: string
        }
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
  }
}
