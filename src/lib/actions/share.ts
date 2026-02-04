"use server";

import { createClient } from "@/lib/supabase/server";
import { generateShareToken } from "@/lib/utils/tokens";
import type { Json } from "@/types/database";

export async function createShareLink(
  resourceId: string,
  resourceType: "list" | "log",
  permission: "complete" | "log_view",
  scope?: { owner_user_id: string }
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const token = generateShareToken();

  const { error } = await supabase.from("share_links").insert({
    token,
    resource_type: resourceType,
    resource_id: resourceId,
    permission,
    scope: scope || null,
    created_by_user_id: user?.id || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return token;
}

export async function getShareLink(token: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("share_links")
    .select("*")
    .eq("token", token)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return null;
  }

  // Check expiration
  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return null;
  }

  return data;
}

export async function getListByShareToken(token: string) {
  const shareLink = await getShareLink(token);

  if (!shareLink || shareLink.resource_type !== "list") {
    return null;
  }

  const supabase = await createClient();

  const { data: list, error } = await supabase
    .from("lists")
    .select(
      `
      *,
      list_items (*)
    `
    )
    .eq("id", shareLink.resource_id)
    .single();

  if (error) {
    return null;
  }

  // Sort items by sort_order
  if (list.list_items) {
    list.list_items.sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );
  }

  return list;
}

type ListWithItems = {
  id: string;
  title: string;
  description: string | null;
  owner_user_id: string | null;
  created_at: string;
  updated_at: string;
  list_items: Array<{
    id: string;
    list_id: string;
    sort_order: number;
    name: string;
    description: string | null;
    targets: Json;
    images: Json;
    created_at: string;
  }>;
};

type CompletionWithResults = {
  id: string;
  list_id: string;
  user_id: string | null;
  anon_session_id: string | null;
  completed_at: string;
  week_start: string;
  notes: string | null;
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

type LogShareData = {
  list: ListWithItems;
  completions: CompletionWithResults[];
  owner: { name: string | null; email: string } | null;
};

export async function getLogByShareToken(token: string): Promise<LogShareData | null> {
  const shareLink = await getShareLink(token);

  if (!shareLink || shareLink.resource_type !== "log") {
    return null;
  }

  const scope = shareLink.scope as { owner_user_id?: string } | null;
  if (!scope?.owner_user_id) {
    return null;
  }

  const supabase = await createClient();

  // Get the list
  const { data: list, error: listError } = await supabase
    .from("lists")
    .select(
      `
      *,
      list_items (*)
    `
    )
    .eq("id", shareLink.resource_id)
    .single();

  if (listError || !list) {
    return null;
  }

  // Sort items by sort_order
  if (list.list_items) {
    list.list_items.sort(
      (a: { sort_order: number }, b: { sort_order: number }) =>
        a.sort_order - b.sort_order
    );
  }

  // Get the completions for this user
  const { data: completions, error: completionsError } = await supabase
    .from("list_completions")
    .select(
      `
      *,
      list_item_results (*)
    `
    )
    .eq("list_id", shareLink.resource_id)
    .eq("user_id", scope.owner_user_id)
    .order("completed_at", { ascending: false });

  if (completionsError) {
    return null;
  }

  // Get the profile for display
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, email")
    .eq("id", scope.owner_user_id)
    .single();

  return {
    list,
    completions: completions || [],
    owner: profile as { name: string | null; email: string } | null,
  };
}
