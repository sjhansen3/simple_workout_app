import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getList } from "@/lib/actions/lists";
import { getCompletionsForList } from "@/lib/actions/completions";
import { createShareLink } from "@/lib/actions/share";
import { Button } from "@/components/ui/button";
import { LogEntry } from "@/components/logs/log-entry";
import { ShareLogButton } from "@/components/logs/share-log-button";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ListLogPage({ params }: Props) {
  const { id } = await params;
  const list = await getList(id);

  if (!list) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const completions = await getCompletionsForList(id);

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <Link
            href={`/lists/${id}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to list
          </Link>
          <h1 className="text-2xl font-bold mt-2">{list.title}</h1>
          <p className="text-muted-foreground">Your completion history</p>
        </div>
        {user && <ShareLogButton listId={id} userId={user.id} />}
      </div>

      {completions.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-lg font-medium mb-2">No completions yet</h2>
          <p className="text-muted-foreground mb-4">
            Complete this workout to see your history here.
          </p>
          <Button asChild>
            <Link href={`/s/${id}?direct=1`}>Start Workout</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {completions.map((completion) => (
            <LogEntry
              key={completion.id}
              completion={completion}
              listItems={list.list_items}
            />
          ))}
        </div>
      )}
    </div>
  );
}
