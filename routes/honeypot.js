import { getConversation } from "../memory/conversationStore";
import { detectScam } from "../services/scamDetector";
import { extractInfo } from "../services/extractor";
import { generateLLMReply } from "../services/llmAgent";
import { fallbackReply } from "../services/agent";

export default async function handler(req, res) {
  // Only POST allowed
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // API KEY CHECK
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { conversation_id, message } = req.body;

  const convo = getConversation(conversation_id);
  convo.messages.push(message);

  if (!convo.scamDetected) {
    const result = detectScam(message);
    if (result.isScam) convo.scamDetected = true;
  }

  if (convo.scamDetected) {
    extractInfo(message, convo.extracted);

    let reply;
    try {
      reply = await generateLLMReply(convo);
    } catch {
      reply = fallbackReply();
    }

    return res.status(200).json({
      scam_detected: true,
      agent_response: reply,
      extracted_intelligence: convo.extracted,
    });
  }

  res.status(200).json({
    scam_detected: false,
    reply: "Hello, how can I help you?",
  });
}
