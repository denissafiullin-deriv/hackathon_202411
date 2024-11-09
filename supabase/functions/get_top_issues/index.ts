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

      // let endTime = Date.now();
      // let end = new Date(endTime);
      // let endTimeIso = end.toISOString();

      // const startTime = new Date(endTime - 10 * 60000);
      // const startTimeIso = startTime.toISOString();

      // console.log("endTime", endTimeIso);
      // console.log("startTime", startTimeIso);

      // Fetch chats data within the time range
      const { data: chats, error } = await supabase
        .from("chats")
        .select("thread_id, summary")
        .order('timestamp', {ascending: false})
        .limit(70)

      if (error) {
        throw error;
      }

      // Prepare the data for analysis
      const prompt = generateTopIssuesPrompt(chats);
      const response = await getAIResponse(prompt);

      let trimmed = response.choices[0].message.content.replaceAll('```json', '');
      trimmed = trimmed.replaceAll('`', '');

      // Parse the response to get the structured data
      const topIssues = JSON.parse(trimmed);

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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 1000,
    }),
  });

  const data = await response.json();
  return data;
}

function generateTopIssuesPrompt(chats: any[]): string {
  // Convert chats data to a more readable format for the prompt
  const chatsSummary = chats.map((chat) => ({
    chat_id: chat.thread_id,
    // text: chat.chat_text,
    // tag: chat.tag,
    summary: chat.summary,
    // mood: chat.mood,
  }));

  // const prompt =
  //   `As an experienced Customer Service Analytics Expert, analyze the following customer service data and identify the top issues.
  // Please provide a comprehensive analysis of the most common issues, their frequency, and any notable patterns.

  // Customer Service Data:
  // ${JSON.stringify(chatsSummary, null, 2)}

  // Please provide your response in the following JSON format:
  // {
  //   "top_issues": [
  //     {
  //       "issue": "string",
  //       "count": number,
  //       "percentage": number,
  //       "common_themes": ["string"],
  //       "severity_level": "HIGH|MEDIUM|LOW"
  //     }
  //   ],
  //   "total_conversations": number,
  //   "period_summary": "string"
  // }

  // Focus on identifying patterns and grouping similar issues together.
  // Calculate percentages based on the total number of conversations.
  // Assign severity levels based on issue impact and frequency.
  // No explanation, just json content.`;

  const prompt = 
  `Please analyze each summary row in the provided data set. Pay special attention to the following topics, as they are of higher importance:
    MT5 withdrawal
    Withdrawal issues
    Uncredited deposits
    Cashier down
    MT5 is down

    Data to analyze: ${JSON.stringify(chatsSummary, null, 2)}

    At the end of your analysis, identify and highlight the top 5 most common issues, prioritizing the topics listed above. For each highlighted issue, provide the following in JSON format, no additional explanation:
    {
      "Issue 1": {
        "Description": "<Description of the issue>",
        "Count": <Total number of times the issue appears>,
        "ChatIDs": [<List of relevant chat IDs>]
      },
      "Issue 2": {
        "Description": "<Description of the issue>",
        "Count": <Total number of times the issue appears>,
        "ChatIDs": [<List of relevant chat IDs>]
      },
      "Issue 3": {
        "Description": "<Description of the issue>",
        "Count": <Total number of times the issue appears>,
        "ChatIDs": [<List of relevant chat IDs>]
      },
      "Issue 4": {
        "Description": "<Description of the issue>",
        "Count": <Total number of times the issue appears>,
        "ChatIDs": [<List of relevant chat IDs>]
      },
      "Issue 5": {
        "Description": "<Description of the issue>",
        "Count": <Total number of times the issue appears>,
        "ChatIDs": [<List of relevant chat IDs>]
      }
    }
    Example Output in JSON format:
    {
      "Issue 1": {
        "Description": "Withdrawal issues",
        "Count": 25,
        "ChatIDs": [12345, 67890, 23456]
      },
      "Issue 2": {
        "Description": "MT5 is down",
        "Count": 18,
        "ChatIDs": [34567, 89012, 45678]
      },
      "Issue 3": {
        "Description": "Uncredited deposits",
        "Count": 15,
        "ChatIDs": [56789, 90123, 67890]
      },
      "Issue 4": {
        "Description": "Cashier down",
        "Count": 12,
        "ChatIDs": [78901, 23456, 89012]
      },
      "Issue 5": {
        "Description": "MT5 withdrawal",
        "Count": 10,
        "ChatIDs": [90123, 34567, 12345]
      }
    }

    Strictly provide the response as a valid json, without any additional text.
  `

  return prompt;
}
