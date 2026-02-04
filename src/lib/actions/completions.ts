"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/utils/dates";

export type ItemResult = {
  list_item_id: string;
  is_checked: boolean;
  result_value?: string;
  result_unit?: "lbs" | "reps" | "freetext";
  notes?: string;
};

export type CreateCompletionInput = {
  list_id: string;
  notes?: string;
  reaction?: string;
  results: ItemResult[];
};

export type CompletionWithResults = {
  id: string;
  list_id: string;
  user_id: string | null;
  anon_session_id: string | null;
  completed_at: string;
  week_start: string;
  notes: string | null;
  reaction: string | null;
  list_item_results: Array<{
    id: string;
    completion_id: string;
    list_item_id: string;
    is_checked: boolean;
    result_value: string | null;
    result_unit: string | null;
    notes: string | null;
  }>;
};

export type WeeklyCompletion = CompletionWithResults & {
  lists: { id: string; title: string } | null;
};

export async function createCompletion(input: CreateCompletionInput) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const anonSessionId = cookieStore.get("anon_session_id")?.value;

  if (!user && !anonSessionId) {
    throw new Error("No user or session found");
  }

  const weekStart = getWeekStart();

  // Create the completion
  const { data: completion, error: completionError } = await supabase
    .from("list_completions")
    .insert({
      list_id: input.list_id,
      user_id: user?.id || null,
      anon_session_id: user ? null : anonSessionId,
      week_start: weekStart,
      notes: input.notes || null,
      reaction: input.reaction || null,
    })
    .select()
    .single();

  if (completionError) {
    throw new Error(completionError.message);
  }

  // Create the item results
  if (input.results.length > 0) {
    const resultsToInsert = input.results.map((result) => ({
      completion_id: completion.id,
      list_item_id: result.list_item_id,
      is_checked: result.is_checked,
      result_value: result.result_value || null,
      result_unit: result.result_unit || null,
      notes: result.notes || null,
    }));

    const { error: resultsError } = await supabase
      .from("list_item_results")
      .insert(resultsToInsert);

    if (resultsError) {
      throw new Error(resultsError.message);
    }
  }

  revalidatePath(`/lists/${input.list_id}/log`);
  revalidatePath("/log");

  return completion;
}

export async function getCompletionsForList(listId: string): Promise<CompletionWithResults[]> {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const anonSessionId = cookieStore.get("anon_session_id")?.value;

  let query = supabase
    .from("list_completions")
    .select(
      `
      *,
      list_item_results (*)
    `
    )
    .eq("list_id", listId)
    .order("completed_at", { ascending: false });

  if (user) {
    query = query.eq("user_id", user.id);
  } else if (anonSessionId) {
    query = query.eq("anon_session_id", anonSessionId);
  } else {
    return [];
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data as CompletionWithResults[];
}

export async function getWeeklyCompletions(): Promise<WeeklyCompletion[]> {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const anonSessionId = cookieStore.get("anon_session_id")?.value;

  let query = supabase
    .from("list_completions")
    .select(
      `
      *,
      lists (id, title),
      list_item_results (*)
    `
    )
    .order("completed_at", { ascending: false });

  if (user) {
    query = query.eq("user_id", user.id);
  } else if (anonSessionId) {
    query = query.eq("anon_session_id", anonSessionId);
  } else {
    return [];
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data as WeeklyCompletion[];
}

export async function getCompletionCount() {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const anonSessionId = cookieStore.get("anon_session_id")?.value;

  let query = supabase
    .from("list_completions")
    .select("id", { count: "exact", head: true });

  if (user) {
    query = query.eq("user_id", user.id);
  } else if (anonSessionId) {
    query = query.eq("anon_session_id", anonSessionId);
  } else {
    return 0;
  }

  const { count, error } = await query;

  if (error) {
    return 0;
  }

  return count || 0;
}

export async function saveList(listId: string) {
  const supabase = await createClient();
  const cookieStore = await cookies();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const anonSessionId = cookieStore.get("anon_session_id")?.value;

  if (!user && !anonSessionId) {
    return;
  }

  // Check if already saved
  let existsQuery = supabase
    .from("saved_lists")
    .select("id")
    .eq("list_id", listId);

  if (user) {
    existsQuery = existsQuery.eq("user_id", user.id);
  } else if (anonSessionId) {
    existsQuery = existsQuery.eq("anon_session_id", anonSessionId);
  } else {
    return;
  }

  const { data: existing } = await existsQuery.single();

  if (existing) {
    return; // Already saved
  }

  // Save the list
  await supabase.from("saved_lists").insert({
    list_id: listId,
    user_id: user?.id || null,
    anon_session_id: user ? null : anonSessionId,
  });

  revalidatePath("/");
}
