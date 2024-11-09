// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  const issues = [
    {
      description: "Issue 1 summary",
      rating: 100,
      link: "https://omsjtoedisfhmbyuiguf.supabase.co/issues/1",
    },
    {
      description: "Issue 2 summary",
      rating: 80,
      link: "https://omsjtoedisfhmbyuiguf.supabase.co/issues/2",
    },
    {
      description: "Issue 3 summary",
      rating: 70,
      link: "https://omsjtoedisfhmbyuiguf.supabase.co/issues/3",
    },
    {
      description: "Issue 4 summary",
      rating: 60,
      link: "https://omsjtoedisfhmbyuiguf.supabase.co/issues/4",
    },
    {
      description: "Issue 5 summary",
      rating: 40,
      link: "https://omsjtoedisfhmbyuiguf.supabase.co/issues/5",
    },
  ];

  const issue1 = [
    {
      description: "chat 1 summary",
      link: "https://omsjtoedisfhmbyuiguf.supabase.co/chats/1",
    },
    {
      description: "chat 2 summary",
      link: "https://omsjtoedisfhmbyuiguf.supabase.co/chats/2",
    },
    {
      description: "chat 3 summary",
      link: "https://omsjtoedisfhmbyuiguf.supabase.co/chats/3",
    },
  ];

  // if (req.method === "GET") {
  //   const url = new URL(req.url);
  //   if (url.pathname === "/issues/1") {
  //     return new Response(
  //       JSON.stringify(issue1),
  //       { headers: { "Content-Type": "application/json" } },
  //     );
  //   } else if (url.pathname === "/issues") {
  //     const { data, error } = await supabase
  //       .from('chats')
  //       .select('thread_id, summary')
  //     return new Response(
  //       JSON.stringify(issues),
  //       { headers: { "Content-Type": "application/json" } },
  //     );
  //   } else 
  // }
});


