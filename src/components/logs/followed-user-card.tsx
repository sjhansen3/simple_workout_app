"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { unsubscribeFromLog } from "@/lib/actions/subscriptions";
import type { SubscribedLog } from "@/lib/actions/subscriptions";
import { toast } from "sonner";
import { ExternalLink, ChevronDown, ChevronUp, User } from "lucide-react";

type FollowedUserCardProps = {
  name: string | null;
  email: string;
  logs: SubscribedLog[];
  totalWorkoutsThisWeek: number;
};

export function FollowedUserCard({
  name,
  email,
  logs,
  totalWorkoutsThisWeek,
}: FollowedUserCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [removedLogs, setRemovedLogs] = useState<Set<string>>(new Set());

  const displayName = name || email;
  const visibleLogs = logs.filter((l) => !removedLogs.has(l.subscriptionId));

  // If all logs removed, hide the card
  if (visibleLogs.length === 0) {
    return null;
  }

  const handleUnfollow = async (subscriptionId: string) => {
    try {
      await unsubscribeFromLog(subscriptionId);
      setRemovedLogs((prev) => new Set([...prev, subscriptionId]));
      toast.success("Unfollowed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unfollow");
    }
  };

  // Get latest reaction across all logs
  const latestReaction = logs.find((l) => l.summary.latestReaction)?.summary.latestReaction;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{displayName}</CardTitle>
              {name && (
                <p className="text-sm text-muted-foreground">{email}</p>
              )}
            </div>
          </div>
          <div className="text-right">
            {totalWorkoutsThisWeek >= 3 ? (
              <span className="text-lg font-bold text-orange-500">
                🔥 {totalWorkoutsThisWeek}
              </span>
            ) : totalWorkoutsThisWeek > 0 ? (
              <span className="text-lg font-bold text-green-600">
                💪 {totalWorkoutsThisWeek}
              </span>
            ) : (
              <span className="text-lg font-bold text-muted-foreground">
                😴 0
              </span>
            )}
            <p className="text-xs text-muted-foreground">this week</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Latest reaction */}
        {latestReaction && (
          <p className="text-sm text-muted-foreground">
            Latest reaction: <span className="text-lg">{latestReaction}</span>
          </p>
        )}

        {/* Activity summary */}
        <div className="text-sm text-muted-foreground">
          Following {visibleLogs.length} {visibleLogs.length === 1 ? "log" : "logs"}
        </div>

        {/* Expandable logs list */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between"
          onClick={() => setExpanded(!expanded)}
        >
          <span>View logs</span>
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {expanded && (
          <div className="space-y-2 pt-2 border-t">
            {visibleLogs.map((log) => (
              <div
                key={log.subscriptionId}
                className="flex items-center justify-between py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{log.listTitle}</p>
                  <p className="text-sm text-muted-foreground">
                    {log.summary.workoutsThisWeek} workout
                    {log.summary.workoutsThisWeek !== 1 ? "s" : ""} this week
                    {log.summary.latestReaction && (
                      <span className="ml-2">{log.summary.latestReaction}</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/a/${log.shareToken}`}>
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleUnfollow(log.subscriptionId)}
                  >
                    Unfollow
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
