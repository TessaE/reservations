import type { APIRoute } from "astro";
import { createSupabaseClient } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  const supabase = await createSupabaseClient();

  const body = await request.json();
  const { environment, reserved_by, reserved_from, reserved_until, force } = body;

  if (!environment || !reserved_by || !reserved_from || !reserved_until) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  // If force is true, expire any existing active reservation for this environment first
  if (force) {
    const { data: existing } = await supabase
      .from("reservations")
      .select("id, reserved_from")
      .eq("environment", environment)
      .gt("reserved_until", new Date().toISOString())
      .single();

    if (existing) {
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      const reservedFrom = new Date(existing.reserved_from);
      const endTime = fiveSecondsAgo > reservedFrom ? fiveSecondsAgo.toISOString() : reservedFrom.toISOString();

      const { error: expireError } = await supabase
        .from("reservations")
        .update({ reserved_until: endTime })
        .eq("id", existing.id);

      if (expireError) {
        return new Response(JSON.stringify({ error: expireError.message }), {
          status: 500,
        });
      }
    }
  }

  const { data, error } = await supabase
    .from("reservations")
    .insert({ environment, reserved_by, reserved_from, reserved_until })
    .select()
    .single();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 409,
    });
  }

  return new Response(JSON.stringify(data), { status: 201 });
};
