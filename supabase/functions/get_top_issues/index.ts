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
      // const startTime = url.searchParams.get("start_time");
      // const endTime = url.searchParams.get("end_time");

      // if (!startTime || !endTime) {
      //   return new Response(
      //     JSON.stringify({ error: "start_time and end_time parameters are required" }),
      //     { headers: { "Content-Type": "application/json" }, status: 400 },
      //   );
      // }

      let endTime = Date.now();
      let end = new Date(endTime);
      let endTimeIso = end.toISOString();

      const startTime = new Date(endTime - 10 * 60000);
      const startTimeIso = startTime.toISOString();

      console.log("endTime", endTimeIso);
      console.log("startTime", startTimeIso);

      // Fetch chats data within the time range
      const { data: chats, error } = await supabase
        .from("chats")
        .select("chat_text, tag, summary, mood")
        .gte("timestamp", startTimeIso)
        .lte("timestamp", endTimeIso);

      if (error) {
        throw error;
      }

      console.log("chats", chats);

      // Prepare the data for analysis
      const prompt = generateTopIssuesPrompt(chats);
      const response = await getAIResponse(prompt);

      // Parse the response to get the structured data
      const topIssues = JSON.parse(response.choices[0].message.content);

      return new Response(
        JSON.stringify({ top_issues: topIssues }),
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

async function getAIResponse(prompt: string): Promise<any> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get("OPENAI_API_TOKEN")}`,
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  return data;
}

function generateTopIssuesPrompt(chats: any[]): string {
  // Convert chats data to a more readable format for the prompt
  const chatsSummary = chats.map((chat) => ({
    text: chat.chat_text,
    tag: chat.tag,
    summary: chat.summary,
    mood: chat.mood,
  }));

  const prompt =
    `As an experienced Customer Service Analytics Expert, analyze the following customer service data and identify the top issues.
  Please provide a comprehensive analysis of the most common issues, their frequency, and any notable patterns.

  Customer Service Data:
  ${JSON.stringify(chatsSummary, null, 2)}

  Please provide your response in the following JSON format:
  {
    "top_issues": [
      {
        "issue": "string",
        "count": number,
        "percentage": number,
        "common_themes": ["string"],
        "severity_level": "HIGH|MEDIUM|LOW"
      }
    ],
    "total_conversations": number,
    "period_summary": "string"
  }

  Focus on identifying patterns and grouping similar issues together.
  Calculate percentages based on the total number of conversations.
  Assign severity levels based on issue impact and frequency.`;

  return prompt;
}
