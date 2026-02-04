import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWeeklyCompletions } from "@/lib/actions/completions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime, getWeekRangeString } from "@/lib/utils/dates";

export default async function WeeklyLogPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const completions = await getWeeklyCompletions();

  // Group completions by week
  const completionsByWeek = completions.reduce((acc, completion) => {
    const week = completion.week_start;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(completion);
    return acc;
  }, {} as Record<string, typeof completions>);

  const weeks = Object.keys(completionsByWeek).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Weekly Log</h1>
        <p className="text-muted-foreground">Your workout history by week</p>
      </div>

      {completions.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-lg font-medium mb-2">No workouts logged yet</h2>
          <p className="text-muted-foreground">
            Complete a workout to see your history here.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {weeks.map((week) => (
            <div key={week}>
              <h2 className="text-lg font-semibold mb-4">
                {getWeekRangeString(week)}
              </h2>
              <div className="space-y-3">
                {completionsByWeek[week].map((completion) => (
                  <Card key={completion.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          <Link
                            href={`/lists/${completion.list_id}`}
                            className="hover:underline"
                          >
                            {completion.lists?.title || "Workout"}
                          </Link>
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(completion.completed_at)}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {
                            completion.list_item_results.filter(
                              (r: { is_checked: boolean }) => r.is_checked
                            ).length
                          }
                          /{completion.list_item_results.length} exercises
                          completed
                        </span>
                        <Link
                          href={`/lists/${completion.list_id}/log`}
                          className="text-primary hover:underline"
                        >
                          View details
                        </Link>
                      </div>
                      {completion.notes && (
                        <p className="text-sm text-muted-foreground mt-2 pt-2 border-t">
                          {completion.notes}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
