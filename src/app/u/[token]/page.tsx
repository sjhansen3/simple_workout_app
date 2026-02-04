import { notFound } from "next/navigation";
import { getUserListsByShareToken } from "@/lib/actions/share";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SaveListButton } from "@/components/lists/save-list-button";
import type { Json, Target } from "@/types/database";
import Link from "next/link";

type Props = {
  params: Promise<{ token: string }>;
};

function parseTargets(targets: Json): Target[] {
  if (!targets || !Array.isArray(targets)) return [];
  return targets as Target[];
}

export default async function SharedUserListsPage({ params }: Props) {
  const { token } = await params;

  const data = await getUserListsByShareToken(token);

  if (!data) {
    notFound();
  }

  const { lists, owner } = data;
  const ownerName = owner.name || owner.email;

  // Check auth status
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isSignedIn = !!user;
  const isOwnProfile = user?.id === owner.id;

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-1">Workout plans from</p>
        <h1 className="text-2xl font-bold">{ownerName}</h1>
        <p className="text-muted-foreground mt-1">
          {lists.length} workout plan{lists.length !== 1 ? "s" : ""}
        </p>
      </div>

      {lists.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No workout plans shared yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lists.map((list) => (
            <Card key={list.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">{list.title}</CardTitle>
                    {list.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {list.description}
                      </p>
                    )}
                  </div>
                  {!isOwnProfile && (
                    <SaveListButton listId={list.id} isSignedIn={isSignedIn} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  {list.list_items.length} exercise{list.list_items.length !== 1 ? "s" : ""}
                </p>
                <ul className="space-y-2">
                  {list.list_items.slice(0, 4).map((item, index) => {
                    const targets = parseTargets(item.targets);
                    return (
                      <li key={item.id} className="flex items-start gap-3 text-sm">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <span>{item.name}</span>
                          {targets.length > 0 && (
                            <span className="text-muted-foreground ml-2">
                              ({targets.map((t) => `${t.value} ${t.unit}`).join(", ")})
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                  {list.list_items.length > 4 && (
                    <li className="text-sm text-muted-foreground pl-9">
                      + {list.list_items.length - 4} more exercises
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isSignedIn && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-2">
            Want to save these workout plans to your account?
          </p>
          <Link
            href="/login"
            className="text-primary hover:underline font-medium"
          >
            Sign in or create an account
          </Link>
        </div>
      )}
    </div>
  );
}
