"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadExerciseImage(formData: FormData): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to upload images");
  }

  const file = formData.get("file") as File;
  if (!file) {
    throw new Error("No file provided");
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    throw new Error("Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.");
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 5MB.");
  }

  // Generate unique filename
  const extension = file.name.split(".").pop();
  const filename = `${user.id}/${Date.now()}-${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("exercise-images")
    .upload(filename, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from("exercise-images")
    .getPublicUrl(filename);

  return urlData.publicUrl;
}

export async function deleteExerciseImage(url: string): Promise<void> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to delete images");
  }

  // Extract the path from the URL
  // URL format: https://<project>.supabase.co/storage/v1/object/public/exercise-images/<user_id>/<filename>
  const urlParts = url.split("/exercise-images/");
  if (urlParts.length !== 2) {
    throw new Error("Invalid image URL");
  }

  const filePath = urlParts[1];

  // Verify the user owns this image
  if (!filePath.startsWith(user.id)) {
    throw new Error("You can only delete your own images");
  }

  const { error } = await supabase.storage
    .from("exercise-images")
    .remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }
}
