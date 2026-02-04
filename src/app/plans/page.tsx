import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserLists, getSavedLists } from "@/lib/actions/lists";
import { Button } from "@/components/ui/button";
import { ListCard } from "@/components/lists/list-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function PlansPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [myLists, savedLists] = await Promise.all([
    getUserLists(),
    getSavedLists(),
  ]);

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Workout Plans</h1>
        <Button asChild>
          <Link href="/lists/new">New Plan</Link>
        </Button>
      </div>

      <Tabs defaultValue="my-plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-plans">My Plans ({myLists.length})</TabsTrigger>
          <TabsTrigger value="saved">Saved ({savedLists.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-plans">
          {myLists.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-lg font-medium mb-2">No workout plans yet</h2>
              <p className="text-muted-foreground mb-4">
                Create your first workout plan to get started.
              </p>
              <Button asChild>
                <Link href="/lists/new">Create Your First Plan</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myLists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="saved">
          {savedLists.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-lg font-medium mb-2">No saved plans</h2>
              <p className="text-muted-foreground">
                Workout plans you save from others will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {savedLists.map((list) => (
                <ListCard key={list.id} list={list} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
