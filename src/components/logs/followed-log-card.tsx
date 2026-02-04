"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { unsubscribeFromLog } from "@/lib/actions/subscriptions";
import type { SubscribedLog } from "@/lib/actions/subscriptions";
import { toast } from "sonner";
import { ExternalLink, X, TrendingUp, TrendingDown, Minus } from "lucide-react";

type FollowedLogCardProps = {
  log: SubscribedLog;
};

export function FollowedLogCard({ log }: FollowedLogCardProps) {
  const [loading, setLoading] = useState(false);
  const [removed, setRemoved] = useState(false);

  const handleUnfollow = async () => {
    setLoading(true);
    try {
      await unsubscribeFromLog(log.subscriptionId);
      setRemoved(true);
      toast.success("Unfollowed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to unfollow");
    }
    setLoading(false);
  };

  if (removed) {
    return null;
  }

  const displayName = log.nickname || log.ownerName || log.ownerEmail;
  const { summary } = log;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              {displayName}&apos;s {log.listTitle}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={handleUnfollow}
            disabled={loading}
            title="Unfollow"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Workout count */}
        <div className="text-sm flex items-center gap-2">
          {summary.workoutsThisWeek >= 3 ? (
            <span className="text-green-600 font-medium">
              🔥 {summary.workoutsThisWeek} workouts this week!
            </span>
          ) : summary.workoutsThisWeek > 0 ? (
            <span className="text-green-600 font-medium">
              💪 {summary.workoutsThisWeek} workout{summary.workoutsThisWeek !== 1 ? "s" : ""} this week
            </span>
          ) : (
            <span className="text-muted-foreground">
              😴 No workouts logged this week
            </span>
          )}
          {summary.latestReaction && (
            <span className="text-lg" title="Latest workout reaction">
              {summary.latestReaction}
            </span>
          )}
        </div>

        {/* Progress highlights */}
        {summary.progressHighlights.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              📈 Progress
            </p>
            <ul className="text-sm space-y-1">
              {summary.progressHighlights.slice(0, 3).map((highlight, i) => (
                <li key={i} className="flex items-center gap-2">
                  {highlight.change !== null && highlight.change > 0 ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : highlight.change !== null && highlight.change < 0 ? (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  ) : (
                    <Minus className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span>
                    {highlight.exercise}: {highlight.previousValue} →{" "}
                    {highlight.currentValue} {highlight.unit}
                    {highlight.change !== null && (
                      <span
                        className={
                          highlight.change > 0
                            ? "text-green-600 ml-1"
                            : "text-red-600 ml-1"
                        }
                      >
                        ({highlight.change > 0 ? "+" : ""}
                        {highlight.change})
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Latest note */}
        {summary.latestNote && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              📝 Notes
            </p>
            <p className="text-sm italic text-muted-foreground line-clamp-2">
              &ldquo;{summary.latestNote}&rdquo;
            </p>
          </div>
        )}

        {/* View full log link */}
        <div className="pt-2">
          <Button asChild variant="outline" size="sm" className="w-full">
            <Link href={`/a/${log.shareToken}`}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Log
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
