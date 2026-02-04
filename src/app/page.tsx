import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getUserLists, getSavedLists } from "@/lib/actions/lists";
import { Button } from "@/components/ui/button";
import { ListCard } from "@/components/lists/list-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
  }

  const [myLists, savedLists] = await Promise.all([
    getUserLists(),
    getSavedLists(),
  ]);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Workouts</h1>
        <Button asChild>
          <Link href="/lists/new">Create New List</Link>
        </Button>
      </div>

      <Tabs defaultValue="my-lists" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-lists">My Lists ({myLists.length})</TabsTrigger>
          <TabsTrigger value="saved">Saved ({savedLists.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="my-lists">
          {myLists.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-lg font-medium mb-2">No lists yet</h2>
              <p className="text-muted-foreground mb-4">
                Create your first workout list to get started.
              </p>
              <Button asChild>
                <Link href="/lists/new">Create Your First List</Link>
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
              <h2 className="text-lg font-medium mb-2">No saved lists</h2>
              <p className="text-muted-foreground">
                Lists you open via share links will appear here.
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

function LandingPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
        Workout Lists
      </h1>
      <p className="mt-4 max-w-md text-lg text-muted-foreground">
        Create workout checklists. Share with anyone. Track your progress.
        Simple as that.
      </p>
      <div className="mt-8 flex gap-4">
        <Button asChild size="lg">
          <Link href="/signup">Get Started</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Sign In</Link>
        </Button>
      </div>
      <div className="mt-16 max-w-2xl text-left">
        <h2 className="text-xl font-semibold mb-4">How it works</h2>
        <ol className="space-y-4 text-muted-foreground">
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
              1
            </span>
            <div>
              <p className="font-medium text-foreground">Create a workout list</p>
              <p>Add exercises with target weights and reps.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
              2
            </span>
            <div>
              <p className="font-medium text-foreground">Share it with anyone</p>
              <p>Generate a link. Anyone can complete the workout.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
              3
            </span>
            <div>
              <p className="font-medium text-foreground">Track your progress</p>
              <p>Log results and see your history over time.</p>
            </div>
          </li>
        </ol>
      </div>
    </div>
  );
}
