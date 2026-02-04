import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSubscribedLogs } from "@/lib/actions/subscriptions";
import { Card, CardContent } from "@/components/ui/card";
import { FollowedUserCard } from "@/components/logs/followed-user-card";
import { Users } from "lucide-react";

export default async function FollowingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const followedLogs = await getSubscribedLogs();

  // Group by owner email (to combine multiple subscriptions for same person)
  const byOwner = new Map<string, typeof followedLogs>();
  for (const log of followedLogs) {
    const existing = byOwner.get(log.ownerEmail) || [];
    existing.push(log);
    byOwner.set(log.ownerEmail, existing);
  }

  const owners = Array.from(byOwner.entries()).map(([email, logs]) => ({
    email,
    name: logs[0].ownerName,
    logs,
    totalWorkoutsThisWeek: logs.reduce((sum, l) => sum + l.summary.workoutsThisWeek, 0),
  }));

  // Sort by activity (most active first)
  owners.sort((a, b) => b.totalWorkoutsThisWeek - a.totalWorkoutsThisWeek);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Following</h1>
        <p className="text-muted-foreground">
          Monitor workout activity from people you follow
        </p>
      </div>

      {owners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-lg font-medium mb-2">Not following anyone yet</h2>
            <p className="text-muted-foreground mb-4">
              When someone shares their workout log or activity feed with you,
              click &quot;Follow&quot; to see their progress here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold">{owners.length}</p>
                <p className="text-sm text-muted-foreground">
                  {owners.length === 1 ? "Person" : "People"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold">
                  {owners.filter((o) => o.totalWorkoutsThisWeek > 0).length}
                </p>
                <p className="text-sm text-muted-foreground">Active this week</p>
              </CardContent>
            </Card>
            <Card className="col-span-2 sm:col-span-1">
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold">
                  {owners.reduce((sum, o) => sum + o.totalWorkoutsThisWeek, 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total workouts</p>
              </CardContent>
            </Card>
          </div>

          {/* People list */}
          <div className="space-y-4">
            {owners.map((owner) => (
              <FollowedUserCard
                key={owner.email}
                name={owner.name}
                email={owner.email}
                logs={owner.logs}
                totalWorkoutsThisWeek={owner.totalWorkoutsThisWeek}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
