import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);

      // Generate random mood data
      const happy = Math.floor(Math.random() * (90 - 80 + 1)) + 80;
      const unhappy = 5;
      const neutral = 100 - happy - unhappy;

      const data = {
        happy,
        unhappy,
        neutral,
      };

      return new Response(
        JSON.stringify({ data }),
        { headers: { "Content-Type": "application/json" }, status: 200 },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { headers: { "Content-Type": "application/json" }, status: 500 },
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { headers: { "Content-Type": "application/json" }, status: 405 },
  );
});
