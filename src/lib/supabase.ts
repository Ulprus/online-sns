import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lagltfhpcypkpyjhnqdw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhZ2x0ZmhwY3lwa3B5amhucWR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1NDQ5MjgsImV4cCI6MjA0NzEyMDkyOH0.C7DPJihXdI6MlfEH1TEvXJAMPDi__9eLqwQ2lPNWRIo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);