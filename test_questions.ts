import { supabase } from './src/lib/supabase.js';

async function checkQuestions() {
  console.log("Fetching questions...");
  const { data, error } = await supabase.from('questions').select('*').limit(5);
  console.log("Data:", data);
  console.log("Error:", error);
}

checkQuestions();
