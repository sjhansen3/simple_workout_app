"use server";

import { createClient } from "@/lib/supabase/server";
import { generateShareToken } from "@/lib/utils/tokens";
import type { Json } from "@/types/database";

export async function createShareLink(
  resourceId: string,
  resourceType: "list" | "log" | "user_lists" | "user_activity",
  permission: "complete" | "log_view" | "view_lists" | "view_activity",
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
    completions: (completions || []) as CompletionWithResults[],
    owner: profile as { name: string | null; email: string } | null,
  };
}

/**
 * Create a share link for all of a user's workout lists
 */
export async function createUserListsShareLink() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to share your workouts");
  }

  // Check if user already has an active share link for their lists
  const { data: existing } = await supabase
    .from("share_links")
    .select("token")
    .eq("resource_type", "user_lists")
    .eq("resource_id", user.id)
    .eq("is_active", true)
    .single();

  if (existing) {
    return existing.token;
  }

  return createShareLink(user.id, "user_lists", "view_lists", {
    owner_user_id: user.id,
  });
}

/**
 * Create a share link for all of a user's activity
 */
export async function createUserActivityShareLink() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to share your activity");
  }

  // Check if user already has an active share link for their activity
  const { data: existing } = await supabase
    .from("share_links")
    .select("token")
    .eq("resource_type", "user_activity")
    .eq("resource_id", user.id)
    .eq("is_active", true)
    .single();

  if (existing) {
    return existing.token;
  }

  return createShareLink(user.id, "user_activity", "view_activity", {
    owner_user_id: user.id,
  });
}

type UserListsShareData = {
  lists: ListWithItems[];
  owner: { id: string; name: string | null; email: string };
};

/**
 * Get all lists for a user by share token
 */
export async function getUserListsByShareToken(
  token: string
): Promise<UserListsShareData | null> {
  const shareLink = await getShareLink(token);

  if (!shareLink || shareLink.resource_type !== "user_lists") {
    return null;
  }

  const scope = shareLink.scope as { owner_user_id?: string } | null;
  const userId = scope?.owner_user_id || shareLink.resource_id;

  const supabase = await createClient();

  // Get all lists owned by this user
  const { data: lists, error: listsError } = await supabase
    .from("lists")
    .select(
      `
      *,
      list_items (*)
    `
    )
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });

  if (listsError || !lists) {
    return null;
  }

  // Sort items within each list
  for (const list of lists) {
    if (list.list_items) {
      list.list_items.sort(
        (a: { sort_order: number }, b: { sort_order: number }) =>
          a.sort_order - b.sort_order
      );
    }
  }

  // Get the profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", userId)
    .single();

  if (!profile) {
    return null;
  }

  return {
    lists: lists as ListWithItems[],
    owner: profile as { id: string; name: string | null; email: string },
  };
}

type ActivityCompletion = CompletionWithResults & {
  list_title: string;
  list_id: string;
};

type UserActivityShareData = {
  completions: ActivityCompletion[];
  owner: { id: string; name: string | null; email: string };
};

/**
 * Get all activity for a user by share token (unified timeline)
 */
export async function getUserActivityByShareToken(
  token: string
): Promise<UserActivityShareData | null> {
  const shareLink = await getShareLink(token);

  if (!shareLink || shareLink.resource_type !== "user_activity") {
    return null;
  }

  const scope = shareLink.scope as { owner_user_id?: string } | null;
  const userId = scope?.owner_user_id || shareLink.resource_id;

  const supabase = await createClient();

  // Get all completions for this user across all lists
  const { data: completions, error: completionsError } = await supabase
    .from("list_completions")
    .select(
      `
      *,
      list_item_results (*),
      lists!inner (
        id,
        title
      )
    `
    )
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(50);

  if (completionsError) {
    return null;
  }

  // Get the profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, email")
    .eq("id", userId)
    .single();

  if (!profile) {
    return null;
  }

  // Transform completions to include list title
  const activityCompletions: ActivityCompletion[] = (completions || []).map(
    (c) => {
      const completion = c as unknown as {
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
        lists: { id: string; title: string };
      };
      return {
        id: completion.id,
        list_id: completion.lists.id,
        list_title: completion.lists.title,
        user_id: completion.user_id,
        anon_session_id: completion.anon_session_id,
        completed_at: completion.completed_at,
        week_start: completion.week_start,
        notes: completion.notes,
        reaction: completion.reaction,
        list_item_results: completion.list_item_results || [],
      };
    }
  );

  return {
    completions: activityCompletions,
    owner: profile as { id: string; name: string | null; email: string },
  };
}
