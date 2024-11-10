import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method === "GET") {
    try {
      // Fetch mood data from DB
      const { data: mood } = await supabase
        .from("chats")
        .select("mood")
        .order("timestamp", { ascending: false })
        .limit(100);

      console.log("mood data from DB", mood);

      interface MoodEntry {
        mood: string;
      }

      const countMoods = (data: MoodEntry[]): { [key: string]: number } => {
        const counts: { [key: string]: number } = {};

        data.forEach((entry) => {
          counts[entry.mood] = (counts[entry.mood] || 0) + 1;
        });

        return counts;
      };

      const result = countMoods(mood);

      console.log(result);

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
