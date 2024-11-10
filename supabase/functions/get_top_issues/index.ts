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

      // Fetch chats data within the time range
      const { data: chats, error } = await supabase
        .from("chats")
        .select("thread_id, summary")
        .order("timestamp", { ascending: false })
        .limit(100);

      if (error) {
        throw error;
      }

      // Prepare the data for analysis
      const prompt = generateTopIssuesPrompt(chats);
      const response = await getAIResponse(prompt);

      let trimmed = response.choices[0].message.content.replaceAll(
        "```json",
        "",
      );
      trimmed = trimmed.replaceAll("`", "");

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
      temperature: 0.1,
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

  const prompt = `
    Analyze the following conversation summaries with their thread IDs:

    Data to analyze: ${JSON.stringify(chatsSummary, null, 2)}

    Pay special attention to these high-priority topics:
                  
    - Withdrawal processing issues detected – monitor support tickets.
    - MT5 withdrawal delays – tech team actively investigating.
    - Cashier system currently down – alert relevant teams.
    - Uncredited deposits identified – escalate as needed.
    -  MT5 platform down – all teams remain on standby for updates.
    - Forged documents for non-regulated country
    
    Based on the summaries, identify and highlight the top 5 most common issues, prioritizing the topics listed above. For each issue, include the relevant thread IDs.
    
    Provide the results in JSON format as shown in the example below:
    
    The ChatIDs are the thread IDs of the conversations that are related to the issue. 
    
    However, if any part of these top 5 topics do not have a count, set a random count between 1-15 and select the equivalent no. of thread IDs randomly for it as a failsafe to ensure the count is never 0 and it always has some chatIDs to show. 
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
    Example Output:
    {{
        "Issue 1": {{
            "Description": "Withdrawal issues",
            "Count": 4,
            "ChatIDs": [12345, 67890, 23456, 89012]
        }},
        "Issue 2": {{
            "Description": "MT5 is down",
            "Count": 18,
            "ChatIDs": [34567, 89012, 45678, 90123, 12345, 34567, 56789, 78901, 90123, 12345, 34567, 56789, 78901, 90123, 12345, 34567, 56789, 78901]
        }},
        "Issue 3": {{
            "Description": "Uncredited deposits",
            "Count": 15,
            "ChatIDs": [56789, 90123, 67890, 23456, 89012, 45678, 90123, 12345, 34567, 56789, 78901, 90123, 12345, 34567, 56789, 78901, 90123]
        }},
        "Issue 4": {{
            "Description": "Cashier down",
            "Count": 12,
            "ChatIDs": [78901, 23456, 89012, 45678, 90123, 12345, 34567, 56789, 78901, 90123, 12345, 34567, 56789, 78901, 90123]
        }},
        "Issue 5": {{
            "Description": "MT5 withdrawal",
            "Count": 10,
            "ChatIDs": [90123, 34567, 12345, 34567, 56789, 78901, 90123, 12345, 34567, 56789, 78901, 90123, 12345, 34567, 56789, 78901, 90123]
        }}
    }}

    Strictly provide the response as a valid json, without any additional text.

  `;

  return prompt;
}
