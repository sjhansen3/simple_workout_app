import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFY_EMAIL = "stephenjhansen8@gmail.com";

serve(async (req) => {
  try {
    const payload = await req.json();
    const { record } = payload;

    // record is the new row in auth.users or profiles
    const userEmail = record?.email;
    const userName = record?.name || record?.raw_user_meta_data?.name || "Unknown";
    const createdAt = record?.created_at
      ? new Date(record.created_at).toLocaleString()
      : "Unknown";

    if (!userEmail) {
      return new Response(JSON.stringify({ error: "No email found" }), {
        status: 400,
      });
    }

    // Send notification email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Stupid Simple Workout <hello@stupidsimpleworkout.com>",
        to: NOTIFY_EMAIL,
        subject: `🎉 New signup: ${userEmail}`,
        html: `
          <div style="font-family: sans-serif; max-width: 400px;">
            <h2>New user signed up!</h2>
            <p><strong>Email:</strong> ${userEmail}</p>
            <p><strong>Name:</strong> ${userName}</p>
            <p><strong>Time:</strong> ${createdAt}</p>
          </div>
        `,
      }),
    });

    const data = await res.json();

    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
