export default async function handler(req, res) {
  try {
    // 1️⃣ Only allow POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // 2️⃣ API Key authentication
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 3️⃣ Safely parse JSON body
  const body = req.body; // ✅ Vercel automatically parses JSON
  if (!body || !body.message) {
    return res.status(400).json({ error: "Message is required" });
  }

    const message = body.message;
    if (!message) return res.status(400).json({ error: "Message is required" });

    // 4️⃣ Dynamic imports for your services
    const { detectScam } = await import("../services/scamDetector");
    const { extractInfo } = await import("../services/extractor");
    const { generateLLMReply } = await import("../services/llmAgent");
    const { fallbackReply } = await import("../services/agent");
    const { getConversation } = await import("../memory/conversationStore");

    // 5️⃣ Scam detection
    const isScam = detectScam
      ? detectScam(message) // Your custom logic
      : ["win", "urgent", "prize", "click", "verify"].some((k) =>
          message.toLowerCase().includes(k),
        );

    // 6️⃣ Extract intelligence if scam
    const extractedIntelligence =
      isScam && extractInfo
        ? extractInfo(message)
        : {
            bank_accounts: isScam ? ["1234567890"] : [],
            upi_ids: isScam ? ["hackathon@upi"] : [],
            phishing_links: isScam ? ["http://scam-link.com"] : [],
          };

    // 7️⃣ Generate LLM reply
    let agentReply = "";
    try {
      agentReply =
        isScam && generateLLMReply
          ? await generateLLMReply(message)
          : fallbackReply
            ? fallbackReply(message)
            : isScam
              ? "I am interested. Please share your bank or UPI details to proceed."
              : "Okay, thank you.";
    } catch {
      agentReply = isScam
        ? "I am interested. Please share your bank or UPI details to proceed."
        : "Okay, thank you.";
    }

    // 8️⃣ Send response
    return res.status(200).json({
      is_scam: isScam,
      conversation_active: isScam,
      extracted_intelligence: extractedIntelligence,
      agent_reply: agentReply,
    });
  } catch (err) {
    console.error("🔥 Honeypot crashed:", err);
    return res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
}
