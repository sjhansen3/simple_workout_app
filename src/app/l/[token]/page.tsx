import { notFound } from "next/navigation";
import { getLogByShareToken } from "@/lib/actions/share";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogEntry } from "@/components/logs/log-entry";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function SharedLogPage({ params }: Props) {
  const { token } = await params;

  const data = await getLogByShareToken(token);

  if (!data) {
    notFound();
  }

  const { list, completions, owner } = data;
  const ownerName = owner?.name || owner?.email || "Someone";

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-1">Shared log from</p>
        <h1 className="text-2xl font-bold">{ownerName}</h1>
        <p className="text-muted-foreground mt-1">
          {list.title} - {completions.length} workout
          {completions.length !== 1 ? "s" : ""} logged
        </p>
      </div>

      {completions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No workouts logged yet.
          </CardContent>
        </Card>
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
