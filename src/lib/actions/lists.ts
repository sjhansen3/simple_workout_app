"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Json, Target } from "@/types/database";

export type ListItemInput = {
  id?: string;
  name: string;
  description?: string;
  targets: Target[];
  images?: string[];
  sort_order: number;
};

export type CreateListInput = {
  title: string;
  description?: string;
  items: ListItemInput[];
};

export async function createList(input: CreateListInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to create a list");
  }

  // Create the list
  const { data: list, error: listError } = await supabase
    .from("lists")
    .insert({
      title: input.title,
      description: input.description || null,
      owner_user_id: user.id,
    })
    .select()
    .single();

  if (listError) {
    throw new Error(listError.message);
  }

  // Create list items
  if (input.items.length > 0) {
    const itemsToInsert = input.items.map((item, index) => ({
      list_id: list.id,
      name: item.name,
      description: item.description || null,
      targets: item.targets,
      images: item.images || [],
      sort_order: index,
    }));

    const { error: itemsError } = await supabase
      .from("list_items")
      .insert(itemsToInsert);

    if (itemsError) {
      throw new Error(itemsError.message);
    }
  }

  revalidatePath("/");
  redirect(`/lists/${list.id}`);
}

export async function updateList(
  listId: string,
  input: CreateListInput,
  itemsToDelete: string[]
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to update a list");
  }

  // Verify ownership
  const { data: existingList } = await supabase
    .from("lists")
    .select("owner_user_id")
    .eq("id", listId)
    .single();

  if (!existingList || existingList.owner_user_id !== user.id) {
    throw new Error("You do not have permission to edit this list");
  }

  // Update the list
  const { error: listError } = await supabase
    .from("lists")
    .update({
      title: input.title,
      description: input.description || null,
    })
    .eq("id", listId);

  if (listError) {
    throw new Error(listError.message);
  }

  // Delete removed items
  if (itemsToDelete.length > 0) {
    await supabase.from("list_items").delete().in("id", itemsToDelete);
  }

  // Upsert items
  for (const item of input.items) {
    if (item.id) {
      // Update existing item
      await supabase
        .from("list_items")
        .update({
          name: item.name,
          description: item.description || null,
          targets: item.targets,
          images: item.images || [],
          sort_order: item.sort_order,
        })
        .eq("id", item.id);
    } else {
      // Insert new item
      await supabase.from("list_items").insert({
        list_id: listId,
        name: item.name,
        description: item.description || null,
        targets: item.targets,
        images: item.images || [],
        sort_order: item.sort_order,
      });
    }
  }

  revalidatePath(`/lists/${listId}`);
  revalidatePath("/");
}

export async function deleteList(listId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to delete a list");
  }

  // Verify ownership
  const { data: existingList } = await supabase
    .from("lists")
    .select("owner_user_id")
    .eq("id", listId)
    .single();

  if (!existingList || existingList.owner_user_id !== user.id) {
    throw new Error("You do not have permission to delete this list");
  }

  const { error } = await supabase.from("lists").delete().eq("id", listId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/");
  redirect("/");
}

export type ListWithItems = {
  id: string;
  owner_user_id: string | null;
  title: string;
  description: string | null;
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

export async function getList(listId: string): Promise<ListWithItems | null> {
  const supabase = await createClient();

  const { data: list, error } = await supabase
    .from("lists")
    .select(
      `
      *,
      list_items (*)
    `
    )
    .eq("id", listId)
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

export type ListSummary = {
  id: string;
  owner_user_id: string | null;
  title: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  list_items: { id: string }[];
};

export async function getUserLists(): Promise<ListSummary[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: lists, error } = await supabase
    .from("lists")
    .select("*, list_items(id)")
    .eq("owner_user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    return [];
  }

  return lists;
}

export async function getSavedLists(): Promise<ListSummary[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: savedLists, error } = await supabase
    .from("saved_lists")
    .select(
      `
      list_id,
      created_at,
      lists (*, list_items(id))
    `
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return [];
  }

  return savedLists.map((sl) => sl.lists).filter(Boolean) as ListSummary[];
}

/**
 * Copy a list to the current user's account
 */
export async function copyList(listId: string): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to copy a workout");
  }

  // Get the original list with items
  const { data: originalList, error: listError } = await supabase
    .from("lists")
    .select(
      `
      *,
      list_items (*)
    `
    )
    .eq("id", listId)
    .single();

  if (listError || !originalList) {
    throw new Error("Could not find the workout to copy");
  }

  // Create a new list for the current user
  const { data: newList, error: createError } = await supabase
    .from("lists")
    .insert({
      title: originalList.title,
      description: originalList.description,
      owner_user_id: user.id,
    })
    .select()
    .single();

  if (createError || !newList) {
    throw new Error("Failed to copy workout");
  }

  // Copy all list items
  if (originalList.list_items && originalList.list_items.length > 0) {
    const itemsToInsert = originalList.list_items.map(
      (item: {
        name: string;
        description: string | null;
        targets: Json;
        sort_order: number;
      }) => ({
        list_id: newList.id,
        name: item.name,
        description: item.description,
        targets: item.targets,
        sort_order: item.sort_order,
      })
    );

    const { error: itemsError } = await supabase
      .from("list_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // Clean up the list if items failed
      await supabase.from("lists").delete().eq("id", newList.id);
      throw new Error("Failed to copy workout exercises");
    }
  }

  revalidatePath("/");
  return newList.id;
}
