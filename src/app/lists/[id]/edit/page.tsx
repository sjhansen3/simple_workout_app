import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getList } from "@/lib/actions/lists";
import { ListForm } from "@/components/lists/list-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditListPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const list = await getList(id);

  if (!list) {
    notFound();
  }

  if (list.owner_user_id !== user.id) {
    redirect(`/lists/${id}`);
  }

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <ListForm list={list} />
    </div>
  );
}
