import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://fmvmtzobjbxwmavwwkqx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtdm10em9iamJ4d21hdnd3a3F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MDAzMTcsImV4cCI6MjA5NTA3NjMxN30.0PWiTn8tzp-8h2L4qwCDAgIXd3Ll5qrzQIJaktSOmSc'
);

// Check if developer profile exists with correct role
const { data: profile, error } = await supabase
  .from('profiles')
  .select('id, email, role')
  .eq('email', 'developer@tgpcopcouncil.online')
  .maybeSingle();

console.log('Developer profile:', JSON.stringify(profile, null, 2));
if (error) console.error('Error:', error.message);
