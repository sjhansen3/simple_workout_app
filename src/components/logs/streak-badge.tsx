import { Card, CardContent } from "@/components/ui/card";

type StreakBadgeProps = {
  daysThisWeek: number;
  currentStreak: number;
  streakThreshold?: number;
};

function getEncouragement(currentStreak: number, hitThreshold: boolean, daysNeeded: number): string {
  if (currentStreak >= 4) {
    return "Amazing consistency — keep it going!";
  }
  if (currentStreak >= 2) {
    return "Nice streak! Don't break the chain.";
  }
  if (currentStreak === 1) {
    return "Good start! One more week to build momentum.";
  }
  // No streak
  if (hitThreshold) {
    return "Great week! Do it again next week to start a streak.";
  }
  if (daysNeeded === 1) {
    return "Just one more workout to hit your goal!";
  }
  return "Get moving — a streak starts with one workout.";
}

export function StreakBadge({
  daysThisWeek,
  currentStreak,
  streakThreshold = 3,
}: StreakBadgeProps) {
  const hitThreshold = daysThisWeek >= streakThreshold;
  const daysNeeded = Math.max(0, streakThreshold - daysThisWeek);
  const encouragement = getEncouragement(currentStreak, hitThreshold, daysNeeded);

  return (
    <Card className={hitThreshold ? "border-orange-500/50 bg-orange-500/5" : ""}>
      <CardContent className="py-4 space-y-1">
        <p className="text-base">
          You've worked out{" "}
          <span className="font-bold">{daysThisWeek}</span>{" "}
          day{daysThisWeek !== 1 ? "s" : ""} this week.
          {hitThreshold ? (
            <span className="text-orange-500"> 🔥</span>
          ) : (
            <span className="text-muted-foreground">
              {" "}({daysNeeded} more for streak)
            </span>
          )}
        </p>
        <p className="text-base">
          You're on a{" "}
          <span className="font-bold">{currentStreak}</span>{" "}
          week streak.
          {currentStreak > 0 && " 🔥"}
        </p>
        <p className="text-sm text-muted-foreground italic">
          {encouragement}
        </p>
      </CardContent>
    </Card>
  );
}
