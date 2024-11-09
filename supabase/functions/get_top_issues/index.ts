// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

Deno.serve(async (req) => {
  const issues = [
    {
      description: "Issue 1 summary",
      rating: 100,
      link: "https://example.com/issues/1",
    },
    {
      description: "Issue 2 summary",
      rating: 80,
      link: "https://example.com/issues/2",
    },
    {
      description: "Issue 3 summary",
      rating: 70,
      link: "https://example.com/issues/3",
    },
    {
      description: "Issue 4 summary",
      rating: 60,
      link: "https://example.com/issues/4",
    },
    {
      description: "Issue 5 summary",
      rating: 40,
      link: "https://example.com/issues/4",
    },
  ]; 
  
  return new Response(
    JSON.stringify(issues),
    { headers: { "Content-Type": "application/json" } },
  )
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get_top_issues' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
