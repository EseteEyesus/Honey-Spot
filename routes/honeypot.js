import { getConversation } from "../memory/conversationStore";
import { detectScam } from "../services/scamDetector";
import { extractInfo } from "../services/extractor";
import { generateLLMReply } from "../services/llmAgent";
import { fallbackReply } from "../services/agent";

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
    let body = {};
    try {
      body = await req.json(); // ✅ parse JSON body safely
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

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
