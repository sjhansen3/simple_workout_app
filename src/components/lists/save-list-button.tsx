"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { copyList } from "@/lib/actions/lists";
import { toast } from "sonner";
import { Copy, LogIn, Check } from "lucide-react";
import Link from "next/link";

type SaveListButtonProps = {
  listId: string;
  isSignedIn: boolean;
};

export function SaveListButton({ listId, isSignedIn }: SaveListButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!isSignedIn) {
      return;
    }

    setLoading(true);
    try {
      const newListId = await copyList(listId);
      setSaved(true);
      toast.success("Workout plan saved to your account!");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save workout"
      );
    }
    setLoading(false);
  };

  if (!isSignedIn) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">
          <LogIn className="w-4 h-4 mr-2" />
          Sign in to save
        </Link>
      </Button>
    );
  }

  if (saved) {
    return (
      <Button variant="outline" size="sm" disabled className="text-green-600">
        <Check className="w-4 h-4 mr-2" />
        Saved
      </Button>
    );
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSave}
      disabled={loading}
    >
      <Copy className="w-4 h-4 mr-2" />
      {loading ? "Saving..." : "Save Plan"}
    </Button>
  );
}
