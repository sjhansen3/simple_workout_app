"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  createList,
  updateList,
  type ListItemInput,
} from "@/lib/actions/lists";
import type { Json, Target } from "@/types/database";
import { toast } from "sonner";

function parseTargets(targets: Json): Target[] {
  if (!targets || !Array.isArray(targets)) return [];
  return targets as Target[];
}

type ListFormProps = {
  list?: {
    id: string;
    title: string;
    description: string | null;
    list_items: Array<{
      id: string;
      name: string;
      description: string | null;
      targets: Json;
      sort_order: number;
    }>;
  };
};

type FormItem = {
  tempId: string;
  id?: string;
  name: string;
  description: string;
  targets: Target[];
};

export function ListForm({ list }: ListFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState(list?.title || "");
  const [description, setDescription] = useState(list?.description || "");
  const [items, setItems] = useState<FormItem[]>(
    list?.list_items.map((item) => ({
      tempId: crypto.randomUUID(),
      id: item.id,
      name: item.name,
      description: item.description || "",
      targets: parseTargets(item.targets),
    })) || []
  );
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addItem = () => {
    setItems([
      ...items,
      {
        tempId: crypto.randomUUID(),
        name: "",
        description: "",
        targets: [],
      },
    ]);
  };

  const removeItem = (tempId: string) => {
    const item = items.find((i) => i.tempId === tempId);
    if (item?.id) {
      setDeletedItemIds([...deletedItemIds, item.id]);
    }
    setItems(items.filter((i) => i.tempId !== tempId));
  };

  const updateItem = (tempId: string, field: keyof FormItem, value: string | Target[]) => {
    setItems(
      items.map((item) =>
        item.tempId === tempId ? { ...item, [field]: value } : item
      )
    );
  };

  const addTarget = (tempId: string) => {
    const item = items.find((i) => i.tempId === tempId);
    if (item) {
      updateItem(tempId, "targets", [
        ...item.targets,
        { value: "", unit: "reps" as const },
      ]);
    }
  };

  const updateTarget = (
    tempId: string,
    targetIndex: number,
    field: "value" | "unit",
    value: string | number
  ) => {
    const item = items.find((i) => i.tempId === tempId);
    if (item) {
      const newTargets = [...item.targets];
      newTargets[targetIndex] = { ...newTargets[targetIndex], [field]: value };
      updateItem(tempId, "targets", newTargets);
    }
  };

  const removeTarget = (tempId: string, targetIndex: number) => {
    const item = items.find((i) => i.tempId === tempId);
    if (item) {
      updateItem(
        tempId,
        "targets",
        item.targets.filter((_, i) => i !== targetIndex)
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one exercise");
      return;
    }

    const emptyItems = items.filter((item) => !item.name.trim());
    if (emptyItems.length > 0) {
      toast.error("Please fill in all exercise names");
      return;
    }

    setLoading(true);

    try {
      const listItems: ListItemInput[] = items.map((item, index) => ({
        id: item.id,
        name: item.name.trim(),
        description: item.description.trim() || undefined,
        targets: item.targets.map((t) => ({
          value: typeof t.value === "string" ? (t.unit === "freetext" ? t.value : Number(t.value) || 0) : t.value,
          unit: t.unit,
        })),
        sort_order: index,
      }));

      if (list) {
        await updateList(
          list.id,
          {
            title: title.trim(),
            description: description.trim() || undefined,
            items: listItems,
          },
          deletedItemIds
        );
        toast.success("List updated");
      } else {
        await createList({
          title: title.trim(),
          description: description.trim() || undefined,
          items: listItems,
        });
        toast.success("List created");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{list ? "Edit List" : "Create New List"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Upper Body Day"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this workout..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Exercises</h3>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            Add Exercise
          </Button>
        </div>

        {items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No exercises yet. Click &quot;Add Exercise&quot; to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {items.map((item, index) => (
              <Card key={item.tempId}>
                <CardContent className="pt-4 space-y-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <Label>Exercise Name</Label>
                        <Input
                          placeholder="e.g., Bench Press"
                          value={item.name}
                          onChange={(e) =>
                            updateItem(item.tempId, "name", e.target.value)
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Input
                          placeholder="e.g., 3 sets, slow tempo"
                          value={item.description}
                          onChange={(e) =>
                            updateItem(item.tempId, "description", e.target.value)
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Targets</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addTarget(item.tempId)}
                          >
                            + Add Target
                          </Button>
                        </div>
                        {item.targets.length > 0 && (
                          <div className="space-y-2">
                            {item.targets.map((target, targetIndex) => (
                              <div
                                key={targetIndex}
                                className="flex items-center gap-2"
                              >
                                <Input
                                  type={target.unit === "freetext" ? "text" : "number"}
                                  placeholder="Value"
                                  value={target.value}
                                  onChange={(e) =>
                                    updateTarget(
                                      item.tempId,
                                      targetIndex,
                                      "value",
                                      target.unit === "freetext"
                                        ? e.target.value
                                        : Number(e.target.value)
                                    )
                                  }
                                  className="w-24"
                                />
                                <select
                                  value={target.unit}
                                  onChange={(e) =>
                                    updateTarget(
                                      item.tempId,
                                      targetIndex,
                                      "unit",
                                      e.target.value as "lbs" | "reps" | "freetext"
                                    )
                                  }
                                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                  <option value="reps">reps</option>
                                  <option value="lbs">lbs</option>
                                  <option value="freetext">text</option>
                                </select>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    removeTarget(item.tempId, targetIndex)
                                  }
                                >
                                  &times;
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.tempId)}
                      className="text-destructive hover:text-destructive"
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? list
              ? "Saving..."
              : "Creating..."
            : list
            ? "Save Changes"
            : "Create List"}
        </Button>
      </div>
    </form>
  );
}
