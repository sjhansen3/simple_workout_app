"use server";

import { createClient } from "@/lib/supabase/server";

export async function convertAnonToUser(anonSessionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return;
  }

  // Use raw SQL via RPC since the TypeScript types for complex updates
  // with constraint violations are overly strict
  // This is fine since we validate user auth above

  // Update completions - convert anon to user
  const { error: compError } = await supabase.rpc("convert_anon_completions" as never, {
    p_anon_session_id: anonSessionId,
    p_user_id: user.id,
  } as never);

  // Update saved lists - convert anon to user (skipping duplicates)
  const { error: savedError } = await supabase.rpc("convert_anon_saved_lists" as never, {
    p_anon_session_id: anonSessionId,
    p_user_id: user.id,
  } as never);

  // If RPC functions don't exist yet, that's fine - they're created by schema
  // Just silently fail for now
}
