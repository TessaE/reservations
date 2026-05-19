import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase.ts";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { environment, reserved_by } = body;

  if (!environment || !reserved_by) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  const { error } = await supabase
    .from("reservations")
    .update({ reserved_until: new Date().toISOString() })
    .eq("environment", environment)
    .eq("reserved_by", reserved_by)
    .gt("reserved_until", new Date().toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};

