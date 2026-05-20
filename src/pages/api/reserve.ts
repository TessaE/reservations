import type { APIRoute } from "astro";
import { createSupabaseClient } from "../../lib/supabase";

export const POST: APIRoute = async ({ request }) => {
  const supabase = await createSupabaseClient();

  const body = await request.json();
  const { environment, reserved_from, reserved_until, force } = body;
  const reserved_by = typeof body.reserved_by === "string" ? body.reserved_by.trim().slice(0, 50) : "";

  if (!environment || !reserved_by || !reserved_from || !reserved_until) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  const fromDate = new Date(reserved_from);
  const untilDate = new Date(reserved_until);
  const MAX_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  if (isNaN(fromDate.getTime()) || isNaN(untilDate.getTime())) {
    return new Response(JSON.stringify({ error: "Invalid date fields" }), { status: 400 });
  }
  if (untilDate <= fromDate || untilDate.getTime() - fromDate.getTime() > MAX_DURATION_MS) {
    return new Response(JSON.stringify({ error: "Invalid reservation duration" }), { status: 400 });
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
