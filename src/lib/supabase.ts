import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] URL или ключ не настроены в .env');
}

export const supabase = createClient(
  supabaseUrl || 'https://pyframwlnqrzeynqcvle.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5ZnJhbXdsbnFyemV5bnFjdmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1NjE4OTAsImV4cCI6MjA4NzEzNzg5MH0.fFyJyGKmZ4N1My3qsUGLjJJiOLstdcsJUU_rv5cZr3I'
);
