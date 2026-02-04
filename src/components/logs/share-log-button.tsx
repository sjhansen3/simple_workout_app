"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createShareLink } from "@/lib/actions/share";
import { toast } from "sonner";

type ShareLogButtonProps = {
  listId: string;
  userId: string;
};

export function ShareLogButton({ listId, userId }: ShareLogButtonProps) {
  const [open, setOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateLink = async () => {
    setLoading(true);
    try {
      const token = await createShareLink(listId, "log", "log_view", {
        owner_user_id: userId,
      });
      const url = `${window.location.origin}/l/${token}`;
      setShareUrl(url);
    } catch (error) {
      toast.error("Failed to generate share link");
    }
    setLoading(false);
  };

  const handleCopy = async () => {
    if (shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Share Log
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share your log</DialogTitle>
          <DialogDescription>
            Anyone with this link can view your completion history for this
            workout (read-only).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          {shareUrl ? (
            <div className="flex gap-2">
              <Input value={shareUrl} readOnly />
              <Button onClick={handleCopy}>Copy</Button>
            </div>
          ) : (
            <Button
              onClick={handleGenerateLink}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Generating..." : "Generate Share Link"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
