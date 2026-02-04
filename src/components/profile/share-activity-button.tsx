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
import { createUserActivityShareLink } from "@/lib/actions/share";
import { toast } from "sonner";
import { Activity, Copy, Check } from "lucide-react";

export function ShareActivityButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOpen = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !shareUrl) {
      setLoading(true);
      try {
        const token = await createUserActivityShareLink();
        const url = `${window.location.origin}/a/${token}`;
        setShareUrl(url);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Failed to create share link"
        );
        setOpen(false);
      }
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Activity className="w-4 h-4 mr-2" />
          Share Logs
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Your Workout Log</DialogTitle>
          <DialogDescription>
            Anyone with this link can view your workout log and follow you
            to see your progress.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-4 text-center text-muted-foreground">
            Creating share link...
          </div>
        ) : (
          <div className="flex gap-2">
            <Input value={shareUrl || ""} readOnly className="flex-1" />
            <Button onClick={handleCopy} variant="outline">
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
