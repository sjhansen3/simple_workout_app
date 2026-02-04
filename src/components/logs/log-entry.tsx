import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils/dates";

type LogEntryProps = {
  completion: {
    id: string;
    completed_at: string;
    notes: string | null;
    reaction: string | null;
    list_item_results: Array<{
      id: string;
      list_item_id: string;
      is_checked: boolean;
      result_value: string | null;
      result_unit: string | null;
      notes: string | null;
    }>;
  };
  listItems?: Array<{
    id: string;
    name: string;
  }>;
};

export function LogEntry({ completion, listItems }: LogEntryProps) {
  const checkedCount = completion.list_item_results.filter(
    (r) => r.is_checked
  ).length;
  const totalCount = completion.list_item_results.length;
  const isPerfect = checkedCount === totalCount && totalCount > 0;

  const getItemName = (itemId: string) => {
    return listItems?.find((i) => i.id === itemId)?.name || "Unknown exercise";
  };

  return (
    <Card className={isPerfect ? "border-green-500/30 bg-green-500/5" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-medium">
              {formatDateTime(completion.completed_at)}
            </CardTitle>
            {completion.reaction && (
              <span className="text-lg">{completion.reaction}</span>
            )}
          </div>
          <span className={`text-sm ${isPerfect ? "text-green-600 font-medium" : "text-muted-foreground"}`}>
            {isPerfect ? "✅ " : ""}{checkedCount}/{totalCount}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {completion.list_item_results.map((result) => (
          <div
            key={result.id}
            className={`flex items-center justify-between text-sm ${
              result.is_checked ? "" : "text-muted-foreground"
            }`}
          >
            <span className={result.is_checked ? "" : "line-through"}>
              {listItems ? getItemName(result.list_item_id) : "Exercise"}
            </span>
            <span className="font-medium">
              {result.result_value || "-"}
            </span>
          </div>
        ))}
        {completion.notes && (
          <p className="text-sm text-muted-foreground pt-2 border-t">
            {completion.notes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
