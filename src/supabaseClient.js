import { createClient } from "@supabase/supabase-js";

const supabaseUrl = 'https://shuovldqemjrgvjuecyc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNodW92bGRxZW1qcmd2anVlY3ljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4ODI1NzQsImV4cCI6MjA1NzQ1ODU3NH0.yZDPWpakhuy-Jg5V8RufngkWvAQMS3VCyPYc5tL4djI';

export const supabase = createClient(supabaseUrl, supabaseKey);