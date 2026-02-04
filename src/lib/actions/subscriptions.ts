"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getWeekStart } from "@/lib/utils/dates";
import type { Json } from "@/types/database";

export type ProgressHighlight = {
  exercise: string;
  previousValue: string;
  currentValue: string;
  unit: string;
  change: number | null; // null for non-numeric
};

export type WeeklySummary = {
  workoutsThisWeek: number;
  progressHighlights: ProgressHighlight[];
  latestNote: string | null;
  latestReaction: string | null;
};

export type SubscribedLog = {
  subscriptionId: string;
  nickname: string | null;
  emailDigest: boolean;
  shareToken: string;
  ownerName: string | null;
  ownerEmail: string;
  listId: string;
  listTitle: string;
  summary: WeeklySummary;
};

// User-level subscription (all activity)
export type SubscribedUser = {
  subscriptionId: string;
  nickname: string | null;
  emailDigest: boolean;
  shareToken: string;
  ownerName: string | null;
  ownerEmail: string;
  ownerId: string;
  summary: UserActivitySummary;
};

export type UserActivitySummary = {
  workoutsThisWeek: number;
  latestReaction: string | null;
  latestNote: string | null;
  recentWorkouts: Array<{
    listTitle: string;
    completedAt: string;
    reaction: string | null;
  }>;
};

/**
 * Subscribe to a log share link
 */
export async function subscribeToLog(shareToken: string, nickname?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in to follow logs");
  }

  // Get the share link
  const { data: shareLink, error: shareLinkError } = await supabase
    .from("share_links")
    .select("id, resource_type, is_active")
    .eq("token", shareToken)
    .single();

  if (shareLinkError || !shareLink) {
    throw new Error("Share link not found");
  }

  if (!shareLink.is_active) {
    throw new Error("This share link is no longer active");
  }

  if (shareLink.resource_type !== "log" && shareLink.resource_type !== "user_activity") {
    throw new Error("This share link is not for a log or activity feed");
  }

  // Check if already subscribed
  const { data: existing } = await supabase
    .from("log_subscriptions")
    .select("id")
    .eq("user_id", user.id)
    .eq("share_link_id", shareLink.id)
    .single();

  if (existing) {
    throw new Error("You are already following this log");
  }

  // Create subscription
  const { error } = await supabase.from("log_subscriptions").insert({
    user_id: user.id,
    share_link_id: shareLink.id,
    nickname: nickname || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

/**
 * Unsubscribe from a log
 */
export async function unsubscribeFromLog(subscriptionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be signed in");
  }

  const { error } = await supabase
    .from("log_subscriptions")
    .delete()
    .eq("id", subscriptionId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
}

/**
 * Check if user is subscribed to a share link
 */
export async function getSubscriptionForToken(shareToken: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get the share link first
  const { data: shareLink } = await supabase
    .from("share_links")
    .select("id")
    .eq("token", shareToken)
    .single();

  if (!shareLink) {
    return null;
  }

  // Check subscription
  const { data: subscription } = await supabase
    .from("log_subscriptions")
    .select("id, nickname, email_digest")
    .eq("user_id", user.id)
    .eq("share_link_id", shareLink.id)
    .single();

  return subscription;
}

/**
 * Get all subscribed logs with weekly summaries
 */
export async function getSubscribedLogs(): Promise<SubscribedLog[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Get all subscriptions with share link details
  const { data: subscriptions, error } = await supabase
    .from("log_subscriptions")
    .select(
      `
      id,
      nickname,
      email_digest,
      share_links!inner (
        token,
        resource_type,
        resource_id,
        scope
      )
    `
    )
    .eq("user_id", user.id);

  if (error || !subscriptions) {
    return [];
  }

  // Process each subscription to build the summary
  const results: SubscribedLog[] = [];

  for (const sub of subscriptions) {
    const shareLink = sub.share_links as unknown as {
      token: string;
      resource_type: string;
      resource_id: string;
      scope: Json | null;
    };

    const scope = shareLink.scope as { owner_user_id?: string } | null;
    if (!scope?.owner_user_id) continue;

    // Get owner profile
    const { data: owner } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", scope.owner_user_id)
      .single();

    if (!owner) continue;

    // Get completions for this week and last week
    const thisWeekStart = getWeekStart(new Date());
    const lastWeekDate = new Date();
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeekStart = getWeekStart(lastWeekDate);

    // Handle user_activity subscriptions (all lists)
    if (shareLink.resource_type === "user_activity") {
      // Get ALL completions for this user across all lists
      const { data: completions } = await supabase
        .from("list_completions")
        .select("*, list_item_results(*), lists!inner(id, title, list_items(*))")
        .eq("user_id", scope.owner_user_id)
        .gte("week_start", lastWeekStart)
        .order("completed_at", { ascending: false });

      // Calculate summary across all lists
      type CompletionWithReaction = {
        week_start: string;
        reaction: string | null;
        notes: string | null;
      };
      const thisWeekCompletions = (completions || []).filter(
        (c) => c.week_start === thisWeekStart
      ) as unknown as CompletionWithReaction[];

      // Get latest reaction and note
      let latestReaction: string | null = null;
      let latestNote: string | null = null;
      for (const completion of thisWeekCompletions) {
        if (!latestReaction && completion.reaction) latestReaction = completion.reaction;
        if (!latestNote && completion.notes) latestNote = completion.notes;
        if (latestReaction && latestNote) break;
      }

      // Create a unified entry showing "All Activity"
      results.push({
        subscriptionId: sub.id,
        nickname: sub.nickname,
        emailDigest: sub.email_digest,
        shareToken: shareLink.token,
        ownerName: owner.name,
        ownerEmail: owner.email,
        listId: "", // Empty for user-level subscriptions
        listTitle: "All Activity",
        summary: {
          workoutsThisWeek: thisWeekCompletions.length,
          progressHighlights: [], // Skip for user-level
          latestNote,
          latestReaction,
        },
      });
      continue;
    }

    // Handle single-list log subscriptions
    const { data: list } = await supabase
      .from("lists")
      .select("id, title, list_items(*)")
      .eq("id", shareLink.resource_id)
      .single();

    if (!list) continue;

    const { data: completions } = await supabase
      .from("list_completions")
      .select("*, list_item_results(*)")
      .eq("list_id", shareLink.resource_id)
      .eq("user_id", scope.owner_user_id)
      .gte("week_start", lastWeekStart)
      .order("completed_at", { ascending: false });

    // Calculate summary
    const summary = calculateWeeklySummary(
      (completions || []) as unknown as Completion[],
      list.list_items || [],
      thisWeekStart,
      lastWeekStart
    );

    results.push({
      subscriptionId: sub.id,
      nickname: sub.nickname,
      emailDigest: sub.email_digest,
      shareToken: shareLink.token,
      ownerName: owner.name,
      ownerEmail: owner.email,
      listId: list.id,
      listTitle: list.title,
      summary,
    });
  }

  return results;
}

type Completion = {
  id: string;
  completed_at: string;
  week_start: string;
  notes: string | null;
  reaction: string | null;
  list_item_results: Array<{
    list_item_id: string;
    result_value: string | null;
    result_unit: string | null;
  }>;
};

type ListItem = {
  id: string;
  name: string;
  targets: Json;
};

function calculateWeeklySummary(
  completions: Completion[],
  listItems: ListItem[],
  thisWeekStart: string,
  lastWeekStart: string
): WeeklySummary {
  // Filter completions by week
  const thisWeekCompletions = completions.filter(
    (c) => c.week_start === thisWeekStart
  );
  const lastWeekCompletions = completions.filter(
    (c) => c.week_start === lastWeekStart
  );

  // Count workouts this week
  const workoutsThisWeek = thisWeekCompletions.length;

  // Find latest reaction (from most recent completion)
  let latestReaction: string | null = null;
  for (const completion of thisWeekCompletions) {
    if (completion.reaction) {
      latestReaction = completion.reaction;
      break;
    }
  }

  // Find latest note (from most recent completion)
  let latestNote: string | null = null;
  for (const completion of thisWeekCompletions) {
    if (completion.notes) {
      latestNote = completion.notes;
      break;
    }
    // Also check item-level notes
    for (const result of completion.list_item_results) {
      if ((result as unknown as { notes?: string }).notes) {
        latestNote = (result as unknown as { notes?: string }).notes ?? null;
        break;
      }
    }
    if (latestNote) break;
  }

  // Calculate progress highlights
  const progressHighlights: ProgressHighlight[] = [];

  for (const item of listItems) {
    // Get latest result for this item this week
    const thisWeekResult = getLatestResultForItem(thisWeekCompletions, item.id);
    // Get latest result for this item last week
    const lastWeekResult = getLatestResultForItem(lastWeekCompletions, item.id);

    if (thisWeekResult && lastWeekResult) {
      // Parse the targets to get the unit
      const targets = item.targets as Array<{ unit?: string }>;
      const unit = targets?.[0]?.unit || "lbs";

      // Only show progress for numeric values
      const thisVal = parseFloat(thisWeekResult);
      const lastVal = parseFloat(lastWeekResult);

      if (!isNaN(thisVal) && !isNaN(lastVal) && thisVal !== lastVal) {
        progressHighlights.push({
          exercise: item.name,
          previousValue: lastWeekResult,
          currentValue: thisWeekResult,
          unit,
          change: thisVal - lastVal,
        });
      }
    }
  }

  return {
    workoutsThisWeek,
    progressHighlights,
    latestNote,
    latestReaction,
  };
}

function getLatestResultForItem(
  completions: Completion[],
  itemId: string
): string | null {
  for (const completion of completions) {
    const result = completion.list_item_results.find(
      (r) => r.list_item_id === itemId
    );
    if (result?.result_value) {
      return result.result_value;
    }
  }
  return null;
}
