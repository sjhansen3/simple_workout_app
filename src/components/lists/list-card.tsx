import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/dates";

type ListCardProps = {
  list: {
    id: string;
    title: string;
    description: string | null;
    updated_at: string;
  };
};

export function ListCard({ list }: ListCardProps) {
  return (
    <Link href={`/lists/${list.id}`}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">{list.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {list.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {list.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Updated {formatDate(list.updated_at)}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
