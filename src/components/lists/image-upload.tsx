"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { uploadExerciseImage, deleteExerciseImage } from "@/lib/actions/images";
import { toast } from "sonner";
import { ImagePlus, X, Loader2 } from "lucide-react";
import Image from "next/image";

type ImageUploadProps = {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
};

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 3,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const url = await uploadExerciseImage(formData);
      onImagesChange([...images, url]);
      toast.success("Image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload image");
    }
    setUploading(false);
  };

  const handleDelete = async (url: string) => {
    setDeletingUrl(url);
    try {
      await deleteExerciseImage(url);
      onImagesChange(images.filter((img) => img !== url));
      toast.success("Image deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete image");
    }
    setDeletingUrl(null);
  };

  return (
    <div className="space-y-2">
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url) => (
            <div
              key={url}
              className="relative group w-20 h-20 rounded-md overflow-hidden border"
            >
              <Image
                src={url}
                alt="Exercise image"
                fill
                className="object-cover"
                sizes="80px"
              />
              <button
                type="button"
                onClick={() => handleDelete(url)}
                disabled={deletingUrl === url}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 disabled:opacity-50"
              >
                {deletingUrl === url ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <X className="w-3 h-3" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-muted-foreground"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ImagePlus className="w-4 h-4 mr-2" />
            )}
            {uploading ? "Uploading..." : "Add Image"}
          </Button>
        </>
      )}
    </div>
  );
}
