import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          role: 'buyer' | 'vendor' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          role?: 'buyer' | 'vendor' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          role?: 'buyer' | 'vendor' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      vendor_profiles: {
        Row: {
          id: string;
          user_id: string;
          store_name: string;
          store_description: string | null;
          commission_rate: number;
          status: 'pending' | 'active' | 'suspended';
          total_sales: number;
          created_at: string;
          updated_at: string;
        };
      };
      products: {
        Row: {
          id: string;
          vendor_id: string;
          name: string;
          description: string | null;
          price: number;
          stock_quantity: number;
          category: string;
          image_url: string | null;
          status: 'draft' | 'active' | 'out_of_stock';
          created_at: string;
          updated_at: string;
        };
      };
      orders: {
        Row: {
          id: string;
          buyer_id: string;
          total_amount: number;
          status: 'pending' | 'processing' | 'completed' | 'cancelled';
          created_at: string;
          updated_at: string;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          vendor_id: string;
          quantity: number;
          price: number;
          commission_amount: number;
          vendor_amount: number;
          created_at: string;
        };
      };
      cart_items: {
        Row: {
          id: string;
          user_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
        };
      };
    };
  };
};
