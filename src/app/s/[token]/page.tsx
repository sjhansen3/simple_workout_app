import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getListByShareToken } from "@/lib/actions/share";
import { getList } from "@/lib/actions/lists";
import { getCompletionCount } from "@/lib/actions/completions";
import { CompletionForm } from "@/components/completion/completion-form";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ direct?: string }>;
};

export default async function SharePage({ params, searchParams }: Props) {
  const { token } = await params;
  const { direct } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If direct=1, the token is actually a list ID (user navigating from their own list)
  let list;
  if (direct === "1") {
    list = await getList(token);
  } else {
    list = await getListByShareToken(token);
  }

  if (!list) {
    notFound();
  }

  // Check completion count to show signup prompt
  const completionCount = await getCompletionCount();
  const showSignupPrompt = !user && completionCount >= 1;

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <CompletionForm list={list} showSignupPrompt={showSignupPrompt} />
    </div>
  );
}
