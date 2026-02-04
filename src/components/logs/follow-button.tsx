"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { subscribeToLog, unsubscribeFromLog } from "@/lib/actions/subscriptions";
import { toast } from "sonner";
import { Heart, HeartOff, LogIn } from "lucide-react";
import Link from "next/link";

type FollowButtonProps = {
  shareToken: string;
  isSignedIn: boolean;
  existingSubscription: {
    id: string;
    nickname: string | null;
  } | null;
};

export function FollowButton({
  shareToken,
  isSignedIn,
  existingSubscription,
}: FollowButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(!!existingSubscription);
  const [subscriptionId, setSubscriptionId] = useState(existingSubscription?.id);

  const handleFollow = async () => {
    if (!isSignedIn) {
      return;
    }

    setLoading(true);
    try {
      await subscribeToLog(shareToken);
      setIsFollowing(true);
      toast.success("You're now following this workout log!");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to follow");
    }
    setLoading(false);
  };

  const handleUnfollow = async () => {
    if (!subscriptionId) return;

    setLoading(true);
    try {
      await unsubscribeFromLog(subscriptionId);
      setIsFollowing(false);
      setSubscriptionId(undefined);
      toast.success("Unfollowed");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unfollow");
    }
    setLoading(false);
  };

  if (!isSignedIn) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">
          <LogIn className="w-4 h-4 mr-2" />
          Sign in to follow
        </Link>
      </Button>
    );
  }

  if (isFollowing) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={handleUnfollow}
        disabled={loading}
        className="text-muted-foreground"
      >
        <HeartOff className="w-4 h-4 mr-2" />
        {loading ? "Unfollowing..." : "Following ✓"}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleFollow}
      disabled={loading}
    >
      <Heart className="w-4 h-4 mr-2" />
      {loading ? "Following..." : "Follow"}
    </Button>
  );
}
