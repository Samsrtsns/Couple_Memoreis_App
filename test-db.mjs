import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://xktadrdupgkxppgzkcpf.supabase.co";
const supabaseAnonKey = "sb_publishable_YCYvUPZgypXDDrmO75vXhA_Cx0vJnMJ";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
    const { data, error } = await supabase.from("profiles").select("*").limit(1);
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Profile Data:", data);
    }
}

main();
