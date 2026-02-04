import { getConversation } from "../memory/conversationStore";
import { detectScam } from "../services/scamDetector";
import { extractInfo } from "../services/extractor";
import { generateLLMReply } from "../services/llmAgent";
import { fallbackReply } from "../services/agent";

// export default async function handler(req, res) {
//   // Only POST allowed
//   if (req.method !== "POST") {
//     return res.status(405).json({ error: "Method not allowed" });
//   }

//   // API KEY CHECK
//   const apiKey = req.headers["x-api-key"];
//   if (!apiKey || apiKey !== process.env.API_KEY) {
//     return res.status(401).json({ error: "Unauthorized" });
//   }

//   const { conversation_id, message } = req.body;

//   const convo = getConversation(conversation_id);
//   convo.messages.push(message);

//   if (!convo.scamDetected) {
//     const result = detectScam(message);
//     if (result.isScam) convo.scamDetected = true;
//   }

//   if (convo.scamDetected) {
//     extractInfo(message, convo.extracted);

//     let reply;
//     try {
//       reply = await generateLLMReply(convo);
//     } catch {
//       reply = fallbackReply();
//     }

//     return res.status(200).json({
//       scam_detected: true,
//       agent_response: reply,
//       extracted_intelligence: convo.extracted,
//     });
//   }

//   res.status(200).json({
//     scam_detected: false,
//     reply: "Hello, how can I help you?",
//   });
// }
export default async function handler(req, res) {
  try {
    // 1. Method check
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // 2. API key auth
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 3. Safe body parsing
    const body = req.body || {};
    const message = body.message;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 4. Simple scam detection
    const scamKeywords = ["win", "urgent", "prize", "click", "verify"];
    const isScam = scamKeywords.some(k =>
      message.toLowerCase().includes(k)
    );

    // 5. Honeypot reply
    const reply = isScam
      ? "I am interested. Please share your bank or UPI details to proceed."
      : "Okay, thank you.";

    // 6. Hackathon-compliant response
    return res.status(200).json({
      is_scam: isScam,
      conversation_active: isScam,
      extracted_intelligence: {
        bank_accounts: [],
        upi_ids: [],
        phishing_links: []
      },
      agent_reply: reply
    });

  } catch (err) {
    console.error("🔥 Honeypot crashed:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message
    });
  }
}

