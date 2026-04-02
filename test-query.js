const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase.from('memories').select('id, memory_comments(id, profiles(*))').limit(1);
  console.log("TEST 1 (profiles(*)):", error ? error.message : "Success");

  const { data: d2, error: e2 } = await supabase.from('memories').select('id, memory_comments(id, profiles:user_id(*))').limit(1);
  console.log("TEST 2 (profiles:user_id(*)):", e2 ? e2.message : "Success");

  const { data: d3, error: e3 } = await supabase.from('memories').select('id, profiles!memories_created_by_fkey(*)').limit(1);
  console.log("TEST 3 (profiles!memories_created_by_fkey):", e3 ? e3.message : "Success");
}
test();
