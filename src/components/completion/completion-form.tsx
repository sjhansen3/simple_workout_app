"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  createCompletion,
  saveList,
  type ItemResult,
} from "@/lib/actions/completions";
import type { Json, Target } from "@/types/database";
import { toast } from "sonner";

type ListItem = {
  id: string;
  name: string;
  description: string | null;
  targets: Json;
  sort_order: number;
};

type CompletionFormProps = {
  list: {
    id: string;
    title: string;
    description: string | null;
    list_items: ListItem[];
  };
  showSignupPrompt?: boolean;
};

function parseTargets(targets: Json): Target[] {
  if (!targets || !Array.isArray(targets)) return [];
  return targets as Target[];
}

type ItemState = {
  is_checked: boolean;
  results: { value: string; unit: "lbs" | "reps" | "freetext" }[];
  notes: string;
};

export function CompletionForm({ list, showSignupPrompt }: CompletionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<Record<string, ItemState>>(() => {
    const initial: Record<string, ItemState> = {};
    for (const item of list.list_items) {
      const targets = parseTargets(item.targets);
      initial[item.id] = {
        is_checked: false,
        results: targets.map((t) => ({
          value: String(t.value),
          unit: t.unit,
        })),
        notes: "",
      };
    }
    return initial;
  });

  const toggleItem = (itemId: string) => {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        is_checked: !prev[itemId].is_checked,
      },
    }));
  };

  const updateResult = (
    itemId: string,
    resultIndex: number,
    value: string
  ) => {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        results: prev[itemId].results.map((r, i) =>
          i === resultIndex ? { ...r, value } : r
        ),
      },
    }));
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setItems((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes,
      },
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Save the list first (auto-save on completion)
      await saveList(list.id);

      // Build results array
      const results: ItemResult[] = list.list_items.map((item) => {
        const state = items[item.id];
        // Combine all results into a single result_value string
        const resultValue = state.results
          .map((r) => `${r.value} ${r.unit}`)
          .join(", ");

        return {
          list_item_id: item.id,
          is_checked: state.is_checked,
          result_value: resultValue || undefined,
          result_unit: state.results[0]?.unit,
          notes: state.notes || undefined,
        };
      });

      await createCompletion({
        list_id: list.id,
        notes: notes || undefined,
        results,
      });

      toast.success("Workout completed!");
      router.push(`/lists/${list.id}/log`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save workout"
      );
    }

    setLoading(false);
  };

  const completedCount = Object.values(items).filter((i) => i.is_checked).length;
  const totalCount = list.list_items.length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{list.title}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completedCount}/{totalCount} done
            </span>
          </CardTitle>
          {list.description && (
            <p className="text-sm text-muted-foreground">{list.description}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {list.list_items.map((item, index) => (
            <div
              key={item.id}
              className={`space-y-3 p-4 rounded-lg border transition-colors ${
                items[item.id].is_checked
                  ? "bg-primary/5 border-primary/20"
                  : "bg-background"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={items[item.id].is_checked}
                    onCheckedChange={() => toggleItem(item.id)}
                  />
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {index + 1}
                  </span>
                </div>
                <div className="flex-1">
                  <label
                    htmlFor={`item-${item.id}`}
                    className={`font-medium cursor-pointer ${
                      items[item.id].is_checked
                        ? "line-through text-muted-foreground"
                        : ""
                    }`}
                  >
                    {item.name}
                  </label>
                  {item.description && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {item.description}
                    </p>
                  )}
                </div>
              </div>

              {parseTargets(item.targets).length > 0 && (
                <div className="ml-14 space-y-2">
                  <p className="text-xs text-muted-foreground">Your results:</p>
                  <div className="flex flex-wrap gap-2">
                    {items[item.id].results.map((result, i) => (
                      <div key={i} className="flex items-center gap-1">
                        <Input
                          type={result.unit === "freetext" ? "text" : "number"}
                          value={result.value}
                          onChange={(e) =>
                            updateResult(item.id, i, e.target.value)
                          }
                          className="w-20 h-8 text-sm"
                          placeholder={String(parseTargets(item.targets)[i]?.value || "")}
                        />
                        <span className="text-sm text-muted-foreground">
                          {result.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="ml-14">
                <Input
                  placeholder="Add notes for this exercise..."
                  value={items[item.id].notes}
                  onChange={(e) => updateItemNotes(item.id, e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Workout Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="How did the workout go? Any notes for next time..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? "Saving..." : "Complete Workout"}
        </Button>

        {showSignupPrompt && (
          <p className="text-center text-sm text-muted-foreground">
            <a href="/signup" className="text-primary hover:underline">
              Create an account
            </a>{" "}
            to save your progress and view your history.
          </p>
        )}
      </div>
    </div>
  );
}
