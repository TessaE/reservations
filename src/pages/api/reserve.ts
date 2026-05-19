import type { APIRoute } from "astro";
import { supabase } from "../../lib/supabase.ts";

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { environment, reserved_by, reserved_from, reserved_until, force } = body;

  if (!environment || !reserved_by || !reserved_from || !reserved_until) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  // If force is true, delete any existing active reservation for this environment first
  if (force) {
    const { error: deleteError } = await supabase
      .from("reservations")
      .delete()
      .eq("environment", environment)
      .gt("reserved_until", new Date().toISOString());

    if (deleteError) {
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 500,
      });
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

