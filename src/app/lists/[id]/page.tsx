import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getList } from "@/lib/actions/lists";
import type { Json, Target } from "@/types/database";

function parseTargets(targets: Json): Target[] {
  if (!targets || !Array.isArray(targets)) return [];
  return targets as Target[];
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareButton } from "@/components/lists/share-button";
import { DeleteListButton } from "@/components/lists/delete-list-button";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ListDetailPage({ params }: Props) {
  const { id } = await params;
  const list = await getList(id);

  if (!list) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user && list.owner_user_id === user.id;

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{list.title}</h1>
          {list.description && (
            <p className="text-muted-foreground mt-1">{list.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ShareButton listId={list.id} />
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Actions
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/lists/${list.id}/edit`}>Edit</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/lists/${list.id}/log`}>View Log</Link>
                </DropdownMenuItem>
                <DeleteListButton listId={list.id} />
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          {list.list_items && list.list_items.length > 0 ? (
            <ul className="space-y-4">
              {list.list_items.map((item, index) => {
                const targets = parseTargets(item.targets);
                return (
                  <li key={item.id} className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      )}
                      {targets.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {targets.map((target, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium"
                            >
                              {target.value} {target.unit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-muted-foreground">No exercises in this list.</p>
          )}
        </CardContent>
      </Card>

      {user && (
        <div className="mt-6">
          <Button asChild className="w-full" size="lg">
            <Link href={`/s/${list.id}?direct=1`}>Start Workout</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
