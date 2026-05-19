import type { APIRoute } from "astro";
import { createSupabaseClient } from "../../lib/supabase";

export const POST: APIRoute = async ({ request, locals }) => {
  const supabase = createSupabaseClient(locals as Record<string, any>);

  const body = await request.json();
  const { environment, reserved_by } = body;

  if (!environment || !reserved_by) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  // First, fetch the active reservation to get reserved_from
  const { data: existing, error: fetchError } = await supabase
    .from("reservations")
    .select("id, reserved_from")
    .eq("environment", environment)
    .ilike("reserved_by", reserved_by)
    .gt("reserved_until", new Date().toISOString())
    .single();

  if (fetchError || !existing) {
    return new Response(JSON.stringify({ error: "No matching active reservation found" }), {
      status: 404,
    });
  }

  // Set reserved_until to a few seconds ago so it immediately drops out of the view,
  // but never earlier than reserved_from
  const fiveSecondsAgo = new Date(Date.now() - 5000);
  const reservedFrom = new Date(existing.reserved_from);
  const endTime = fiveSecondsAgo > reservedFrom ? fiveSecondsAgo.toISOString() : reservedFrom.toISOString();

  const { data, error } = await supabase
    .from("reservations")
    .update({ reserved_until: endTime })
    .eq("id", existing.id)
    .select();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  if (!data || data.length === 0) {
    return new Response(JSON.stringify({ error: "No matching active reservation found" }), {
      status: 404,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
