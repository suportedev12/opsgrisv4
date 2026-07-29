import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabase2.losungexpress.app';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4NTI1MDU2MCwiZXhwIjo0OTQwOTI0MTYwLCJyb2xlIjoiYW5vbiJ9.2rEw5mthDPimaVEeQaj8YZfYF9KyWBCub2rEAi6yx0Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
