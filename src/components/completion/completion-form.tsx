"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import { Textarea } from "@/components/ui/textarea";
import { fireWorkoutCompleteConfetti } from "@/lib/utils/confetti";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createCompletion,
  saveList,
  type ItemResult,
} from "@/lib/actions/completions";
import type { Json, Target } from "@/types/database";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

type ListItem = {
  id: string;
  name: string;
  description: string | null;
  targets: Json;
  images: Json;
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

const REACTIONS = [
  { emoji: "💪", label: "Crushed it" },
  { emoji: "🔥", label: "On fire" },
  { emoji: "😤", label: "Beast mode" },
  { emoji: "😅", label: "Tough one" },
  { emoji: "🐢", label: "Slow & steady" },
  { emoji: "💀", label: "Barely survived" },
];

export function CompletionForm({ list, showSignupPrompt }: CompletionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [reaction, setReaction] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ListItem | null>(null);
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

  const handleItemClick = (item: ListItem) => {
    setSelectedItem(item);
  };

  const handleDialogSave = () => {
    if (selectedItem) {
      // Mark as checked when saving from dialog
      setItems((prev) => ({
        ...prev,
        [selectedItem.id]: {
          ...prev[selectedItem.id],
          is_checked: true,
        },
      }));
    }
    setSelectedItem(null);
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
        reaction: reaction || undefined,
        results,
      });

      // Fire confetti celebration!
      fireWorkoutCompleteConfetti();

      toast.success("Workout completed! 🎉");

      // Slight delay to let confetti play before navigating
      setTimeout(() => {
        router.push(`/lists/${list.id}/log`);
      }, 1500);
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
      {/* Exercise List Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{list.title}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completedCount}/{totalCount} 💪
            </span>
          </CardTitle>
          {list.description && (
            <p className="text-sm text-muted-foreground">{list.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {list.list_items.map((item, index) => {
              const targets = parseTargets(item.targets);
              const isChecked = items[item.id].is_checked;

              return (
                <li
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`flex items-start gap-4 p-3 rounded-lg border cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/50 ${
                    isChecked
                      ? "bg-primary/5 border-primary/20"
                      : "bg-background"
                  }`}
                >
                  {/* Checkbox - prevent row click */}
                  <div
                    className="pt-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleItem(item.id);
                    }}
                  >
                    <AnimatedCheckbox
                      id={`item-${item.id}`}
                      checked={isChecked}
                      onCheckedChange={() => toggleItem(item.id)}
                    />
                  </div>

                  {/* Number badge */}
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                    {index + 1}
                  </span>

                  {/* Exercise info */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${isChecked ? "line-through text-muted-foreground" : ""}`}>
                      {item.name}
                    </p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground truncate">
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
                    {/* Show results summary if item has been edited */}
                    {items[item.id].notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic">
                        "{items[item.id].notes}"
                      </p>
                    )}
                  </div>

                  {/* Completed indicator */}
                  {isChecked && (
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  )}
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Workout Notes Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">📝 Workout Notes</CardTitle>
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

      {/* Reaction Picker Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">How did it go?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {REACTIONS.map((r) => (
              <button
                key={r.emoji}
                type="button"
                onClick={() => setReaction(reaction === r.emoji ? null : r.emoji)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  reaction === r.emoji
                    ? "border-primary bg-primary/10 scale-110"
                    : "border-muted hover:border-primary/50 hover:bg-muted"
                }`}
              >
                <span className="text-2xl">{r.emoji}</span>
                <span className="text-xs text-muted-foreground">{r.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex flex-col gap-4">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          size="lg"
          className="w-full"
        >
          {loading ? "Saving..." : "Complete Workout 🎉"}
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

      {/* Exercise Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent>
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                    {list.list_items.findIndex(i => i.id === selectedItem.id) + 1}
                  </span>
                  {selectedItem.name}
                </DialogTitle>
                {selectedItem.description && (
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.description}
                  </p>
                )}
              </DialogHeader>

              {/* Exercise Images */}
              {Array.isArray(selectedItem.images) && selectedItem.images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto py-2">
                  {(selectedItem.images as string[]).map((url, i) => (
                    <div
                      key={i}
                      className="relative w-24 h-24 shrink-0 rounded-md overflow-hidden border"
                    >
                      <Image
                        src={url}
                        alt={`${selectedItem.name} - image ${i + 1}`}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-4 py-4">
                {/* Results inputs */}
                {parseTargets(selectedItem.targets).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Your results:</p>
                    <div className="flex flex-wrap gap-3">
                      {items[selectedItem.id].results.map((result, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            type={result.unit === "freetext" ? "text" : "number"}
                            value={result.value}
                            onChange={(e) =>
                              updateResult(selectedItem.id, i, e.target.value)
                            }
                            className="w-24"
                            placeholder={String(parseTargets(selectedItem.targets)[i]?.value || "")}
                          />
                          <span className="text-sm text-muted-foreground">
                            {result.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes input */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Notes for this exercise:</p>
                  <Input
                    placeholder="How did this exercise feel?"
                    value={items[selectedItem.id].notes}
                    onChange={(e) => updateItemNotes(selectedItem.id, e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2">
                {/* Show "Mark incomplete" only if already completed */}
                {items[selectedItem.id].is_checked && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground sm:mr-auto"
                    onClick={() => {
                      toggleItem(selectedItem.id);
                      setSelectedItem(null);
                    }}
                  >
                    Mark incomplete
                  </Button>
                )}
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={() => setSelectedItem(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleDialogSave}>
                    Save & Close ✓
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
