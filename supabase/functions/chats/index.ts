import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

Deno.serve(async (req) => {
  if (req.method === "POST") {
    try {
      const body = await req.json();

      // Insert the chat data into the database
      const { data: chat_text } = await supabase
        .from("chats")
        .insert({
          thread_id: body.thread_id,
          timestamp: body.timestamp,
          chat_text: body.chat_text,
        })
        .select("chat_text")
        .single();

      // Call OpenAI API to process chat_text.chat_text to get a summary
      let prompt = summarizePrompt(chat_text?.chat_text);
      const summaryResponse = await getAIResponse(prompt);

      let summary = summaryResponse.choices[0].message.content;
      summary = summary.replace("Summary: ", "");


      // Write the summary to the chat in the database
      await supabase
        .from('chats')
        .update({ summary: summary })
        .eq('thread_id', body.thread_id);
      
      // Call OpenAI API to process chat_text.chat_text to get a team
      prompt = tagPrompt(chat_text?.chat_text);
      const tagResponse = await getAIResponse(prompt);

      const team = tagResponse.choices[0].message.content;

      const jsonString = team.substring(team.indexOf('{'), team.lastIndexOf('}') + 1);
      const parsedData = JSON.parse(jsonString);

      // Write the team to the chat in the database
      await supabase
        .from('chats')
        .update({ team: parsedData.Team })
        .eq('thread_id', body.thread_id);

      // Write the tag to the chat in the database
      await supabase
        .from('chats')
        .update({ tag: parsedData.Tag })
        .eq('thread_id', body.thread_id);

      // Write the mood to the chat in the database
      const { data } = await supabase
        .from('chats')
        .update({ mood: parsedData.Mood })
        .eq('thread_id', body.thread_id)
        .select()
        .single();

      return new Response(
        JSON.stringify({ chat: data }),
        { headers: { "Content-Type": "application/json" }, status: 200 },
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error }),
        { headers: { "Content-Type": "application/json" }, status: 500 },
      );
    }
  }
});

async function getAIResponse(prompt: string): Promise<any> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${Deno.env.get('OPENAI_API_TOKEN')}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5,
      max_tokens: 150
    }),
  });

  const data = await response.json();
  return data;
}

function summarizePrompt(chatText: string): string {
  const prompt = `As an experienced Customer Service Analyst, provide a brief summary (max 100 words) of the following customer service conversation.
    Focus on the main issue and resolution only.

    Conversation to summarize:
    ${chatText}

    Provide the response in this exact format:
    Summary: [Your brief summary here]
    `;
    return prompt;
}

function tagPrompt(chatText: string): string {
  const prompt = `You are a Customer Service Quality Manager with 15 years of experience in the fintech industry.
  Examine the following client conversation and provide a simplified classification in two parts:
  Team Classification:
  - Identify which team this conversation belongs to one of the following: P2P, KYC, CFD, Trading & DBot, General Support, Trading & DBot, Others.
  - Explain the main reason for assigning this conversation to the chosen team.
  Issue Classification:
  - Determine the primary issue tag based on these categories:
    * **Payment Method**:
       - Deposit failed: \`deposit_failed\`, \`payment method\`
       - Withdrawal issue: \`withdrawal\`, \`payment method\`
       - Withdrawal delay: \`withdrawal_delay\`, \`payment method\`
       - Withdrawal rejected: \`withdrawal_rejected\`, \`payment method\`
       - PerfectMoney: \`PerfectMoney\`
       - Skrill and Neteller with P2P: \`Skrill/P2P\`
       - Neteller/P2P: \`Neteller/P2P\`
    * **CFD**:
       - MT5 archived account queries: \`MT5-archived\`
       - MT5 zero spread account queries: \`mt5_zerospread\`
       - Client asking about Deriv's association with any prop firm: \`mt5_prop_firm\`
       - MT5 account trading disabled: \`MT5disabletradingsusp\`
       - Deriv-X inquiries: \`Deriv-X\`
       - Disputes about Deriv X: \`DerivX_dispute\`
       - Deriv X failed login: \`DerivX_failed_login\`
       - MT5 downtime issues: \`MT5downtime\`
       - Hacked MT5 account: \`mt5_hackedaccount\`
       - Issues related to MT5 fund transfer : \`MT5_fundtransfer\`
       - Disputes with regards to cTrader trade: \`cTrader_dispute\`
       - MT5 account creation involving kyc submission/checking: \`mt5_kyc\`
    * **Others**:
       - Client sends a link during a chat or ticket interaction : \`Links_from_clients\`
       - Mandatory tag for tickets created by L1: \`cs_L1\`
       - LiveChat downtime or LiveChat incidents : \`LiveChat-downtime\`
    * **P2P**:
       - Discussion about DP2P dispute: \`dp2pdispute\`
       - Discussion about P2P balance issues: \`p2p-balance\`
       - Discussion about P2P hacked account: \`p2p_hackedaccount\`
    * **General Support**:
       - Client has requested an email change: \`emailchange\`
       - Client has requested a 2FA removal: \`2fa\`
  * **KYC**:
       - General KYC chat - Proof of Identity (POI)/ Proof of Address (POA) related: \`kyc\`
       - Client has requested an email change: \`emailchange\`
       - Client has requested a 2FA removal: \`2fa\`
    * **Trading & DBot**:
       - Chat is about How to use DBot/BinaryBot: \`Bot_Getting Started\`
       - Technical issue about DBot/BinaryBot: \`Bot_Technical\`
       - DBot/BinaryBot dispute: \`Bot_Dispute\`
  Conversation to analyze:
  ${chatText}
  Also analyze the mood of the conversation and mark it one of the following: Happy, Unhappy, Neutral.
  Provide the response as a json with keys, without any additional text:
  Team:
  Main Issue:
  Tag:
  Mood:
  `;

  return prompt;
}