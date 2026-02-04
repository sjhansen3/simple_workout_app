import { notFound } from "next/navigation";
import { getUserActivityByShareToken } from "@/lib/actions/share";
import { getSubscriptionForToken } from "@/lib/actions/subscriptions";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { FollowButton } from "@/components/logs/follow-button";

type Props = {
  params: Promise<{ token: string }>;
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateString);
}

export default async function SharedActivityPage({ params }: Props) {
  const { token } = await params;

  const data = await getUserActivityByShareToken(token);

  if (!data) {
    notFound();
  }

  const { completions, owner } = data;
  const ownerName = owner.name || owner.email;

  // Check auth status and existing subscription
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignedIn = !!user;
  const isOwnProfile = user?.id === owner.id;
  const existingSubscription = await getSubscriptionForToken(token);

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Workout log from</p>
            <h1 className="text-2xl font-bold">{ownerName}</h1>
            <p className="text-muted-foreground mt-1">
              {completions.length} workout{completions.length !== 1 ? "s" : ""} logged
            </p>
          </div>
          {!isOwnProfile && (
            <FollowButton
              shareToken={token}
              isSignedIn={isSignedIn}
              existingSubscription={existingSubscription}
            />
          )}
        </div>
      </div>

      {completions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No workouts logged yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {completions.map((completion) => {
            const checkedCount = completion.list_item_results.filter(
              (r) => r.is_checked
            ).length;
            const totalCount = completion.list_item_results.length;

            return (
              <Card key={completion.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">
                          {completion.list_title}
                        </span>
                        {completion.reaction && (
                          <span className="text-lg">{completion.reaction}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                        <span>{getRelativeTime(completion.completed_at)}</span>
                        <span>•</span>
                        <span>
                          {checkedCount === totalCount ? (
                            <span className="text-green-600">
                              ✓ {checkedCount}/{totalCount}
                            </span>
                          ) : (
                            `${checkedCount}/${totalCount}`
                          )}
                        </span>
                      </div>
                      {completion.notes && (
                        <p className="mt-2 text-sm italic text-muted-foreground">
                          "{completion.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
