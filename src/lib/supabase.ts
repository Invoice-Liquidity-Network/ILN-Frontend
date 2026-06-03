import { createClient } from "@supabase/supabase-js";

/**
 * SQL Schema for Reminders:
 * 
 * create table reminder_preferences (
 *   address text primary key,
 *   email text not null,
 *   enabled boolean default true,
 *   updated_at timestamptz default now()
 * );
 * 
 * create table sent_reminders (
 *   id uuid default gen_random_uuid() primary key,
 *   invoice_id text not null,
 *   milestone int not null,
 *   sent_at timestamptz default now(),
 *   email text not null
 * );
 * 
 * create index idx_sent_reminders_invoice_milestone on sent_reminders(invoice_id, milestone);
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// For client-side use
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// For server-side use (bypasses RLS)
export const getSupabaseAdmin = () => {
  if (!supabaseServiceKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY is missing. Using anon key.");
    return supabase;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
};
