import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

export async function updateSession(request: NextRequest) {
  // Create initial response
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Log for debugging (remove in production)
  console.log("[Proxy] Processing request:", request.nextUrl.pathname);

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: This refreshes the session if expired and updates cookies
  // Do NOT remove this line - it ensures the session stays valid
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[Proxy] User:", user?.email || "none");

  // Handle anonymous session ID
  const anonSessionId = request.cookies.get("anon_session_id")?.value;
  if (!anonSessionId) {
    const newAnonId = crypto.randomUUID();
    supabaseResponse.cookies.set("anon_session_id", newAnonId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return supabaseResponse;
}
