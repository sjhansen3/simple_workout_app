import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserLists, getSavedLists } from "@/lib/actions/lists";
import { getSubscribedLogs } from "@/lib/actions/subscriptions";
import { getWeeklyCompletions } from "@/lib/actions/completions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FollowedLogCard } from "@/components/logs/followed-log-card";
import { WorkoutCalendar } from "@/components/logs/workout-calendar";
import { StreakBadge } from "@/components/logs/streak-badge";
import { ShareAllListsButton } from "@/components/profile/share-all-lists-button";
import { ShareActivityButton } from "@/components/profile/share-activity-button";
import {
  formatDateTime,
  getWeekRangeString,
  getWeekStart,
  toDateKey,
  calculateStreaks,
  countWorkoutDays,
} from "@/lib/utils/dates";
import { Plus, ChevronRight } from "lucide-react";

const STREAK_THRESHOLD = 3;

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  const [myLists, savedLists, followedLogs, completions] = await Promise.all([
    getUserLists(),
    getSavedLists(),
    getSubscribedLogs(),
    getWeeklyCompletions(),
  ]);

  // Group completions by week
  const completionsByWeek = completions.reduce(
    (acc, completion) => {
      const week = completion.week_start;
      if (!acc[week]) {
        acc[week] = [];
      }
      acc[week].push(completion);
      return acc;
    },
    {} as Record<string, typeof completions>
  );

  const weeks = Object.keys(completionsByWeek).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // Calculate workout dates for calendar
  const workoutDates = new Set<string>();
  for (const completion of completions) {
    const date = new Date(completion.completed_at);
    workoutDates.add(toDateKey(date));
  }

  // Calculate streaks
  const currentWeekStart = getWeekStart(new Date());
  const currentWeekCompletions = completionsByWeek[currentWeekStart] || [];
  const daysThisWeek = countWorkoutDays(currentWeekCompletions);

  const streakData = calculateStreaks(completionsByWeek, STREAK_THRESHOLD);
  const streakWeeksSet = new Set(streakData.streakWeeks);

  // All plans combined (deduplicated - my lists first, then saved that aren't already in my lists)
  const myListIds = new Set(myLists.map((l) => l.id));
  const allPlans = [...myLists, ...savedLists.filter((l) => !myListIds.has(l.id))];

  return (
    <div className="container mx-auto max-w-2xl py-6 px-4 space-y-6">
      {/* Streak Badge - Top of page for motivation */}
      {completions.length > 0 && (
        <StreakBadge
          daysThisWeek={daysThisWeek}
          currentStreak={streakData.currentStreak}
          streakThreshold={STREAK_THRESHOLD}
        />
      )}

      {/* Quick Start Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Start Workout</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/lists/new">
              <Plus className="w-4 h-4 mr-1" />
              New
            </Link>
          </Button>
        </div>

        {allPlans.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground mb-4">
                Create your first workout plan to get started.
              </p>
              <Button asChild>
                <Link href="/lists/new">Create Plan</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {allPlans.slice(0, 3).map((list) => (
              <Link
                key={list.id}
                href={`/s/${list.id}?direct=1`}
                className="block"
              >
                <Card className="hover:border-primary/50 hover:bg-muted/30 transition-colors">
                  <CardContent className="py-3 px-4 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{list.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {list.list_items?.length || 0} exercises
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
            {allPlans.length > 3 && (
              <Button asChild variant="outline" className="w-full">
                <Link href="/plans">View All Plans ({allPlans.length})</Link>
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Calendar */}
      {completions.length > 0 && (
        <WorkoutCalendar
          workoutDates={workoutDates}
          streakWeeks={streakWeeksSet}
        />
      )}

      {/* Recent Activity */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>

        {completions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                Complete a workout to see your history here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {weeks.slice(0, 2).map((week) => {
              const weekWorkouts = completionsByWeek[week];
              const isStreakWeek = weekWorkouts.length >= STREAK_THRESHOLD;

              return (
                <div key={week}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium text-muted-foreground">
                      {getWeekRangeString(week)}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        isStreakWeek
                          ? "bg-orange-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {weekWorkouts.length}
                      {isStreakWeek ? " 🔥" : ""}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {weekWorkouts.slice(0, 3).map((completion) => {
                      const exercisesCompleted =
                        completion.list_item_results.filter(
                          (r: { is_checked: boolean }) => r.is_checked
                        ).length;
                      const totalExercises = completion.list_item_results.length;
                      const isPerfect =
                        exercisesCompleted === totalExercises &&
                        totalExercises > 0;

                      return (
                        <Card
                          key={completion.id}
                          className={
                            isPerfect ? "border-green-500/30 bg-green-500/5" : ""
                          }
                        >
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-medium truncate">
                                  {completion.lists?.title || "Workout"}
                                </span>
                                {completion.reaction && (
                                  <span>{completion.reaction}</span>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                {formatDateTime(completion.completed_at)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-sm">
                              <span
                                className={
                                  isPerfect
                                    ? "text-green-600"
                                    : "text-muted-foreground"
                                }
                              >
                                {isPerfect ? "✅ " : ""}
                                {exercisesCompleted}/{totalExercises} exercises
                              </span>
                              <Link
                                href={`/lists/${completion.list_id}/log`}
                                className="text-primary text-xs hover:underline"
                              >
                                Details
                              </Link>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Following Section */}
      {followedLogs.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">Following</h2>
          <div className="grid gap-3">
            {followedLogs.slice(0, 2).map((log) => (
              <FollowedLogCard key={log.subscriptionId} log={log} />
            ))}
            {followedLogs.length > 2 && (
              <Button asChild variant="outline" size="sm">
                <Link href="/following">View All ({followedLogs.length})</Link>
              </Button>
            )}
          </div>
        </section>
      )}

      {/* Share Section - Bottom */}
      <section className="pt-4 border-t">
        <div className="flex flex-wrap gap-2 justify-center">
          <ShareAllListsButton />
          <ShareActivityButton />
        </div>
      </section>
    </div>
  );
}

function LandingPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Workout Plans
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        Create workout plans. Share with anyone. Log your progress.
        Simple as that.
      </p>
      <div className="mt-8">
        <Button asChild size="lg">
          <Link href="/login">Get Started</Link>
        </Button>
      </div>
      <div className="mt-16 max-w-2xl text-left">
        <h2 className="text-xl font-semibold mb-4">How it works</h2>
        <ol className="space-y-4 text-muted-foreground">
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
              1
            </span>
            <div>
              <p className="font-medium text-foreground">Create a workout plan</p>
              <p>Add exercises with target weights and reps.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
              2
            </span>
            <div>
              <p className="font-medium text-foreground">Share with anyone</p>
              <p>Generate a link. Anyone can follow your plan.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
              3
            </span>
            <div>
              <p className="font-medium text-foreground">Log your workouts</p>
              <p>Track results and see your progress over time.</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
