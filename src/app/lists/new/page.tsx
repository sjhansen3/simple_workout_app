import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ListForm } from "@/components/lists/list-form";

export default async function NewListPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <ListForm />
    </div>
  );
}
