export default async function handler(req, res) {
  try {
    // Only POST allowed
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    // API Key check
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.API_KEY) return res.status(401).json({ error: "Unauthorized" });

    // Parse JSON body safely
    let message = "";
    try {
      message = req.body?.message || "";
    } catch {
      message = "";
    }

    // If message empty → tester ping
    if (!message.trim()) {
      return res.status(200).json({
        is_scam: false,
        confidence: 0,
        conversation_active: false,
        extracted_intelligence: {
          bank_accounts: [],
          upi_ids: [],
          phishing_links: [],
        },
        agent_reply: "Hello, how can I help you?",
      });
    }

    // Scam detection keywords
    const keywords = ["otp", "bank", "verify", "urgent", "click", "upi", "refund", "account", "win", "prize"];
    const lower = message.toLowerCase();
    const hits = keywords.filter((k) => lower.includes(k)).length;
    const isScam = hits >= 2;

    // Extract bank/UPI info if scam
    const bankAccounts = message.match(/\b\d{9,18}\b/g) || [];
    const upiIds = message.match(/\b[\w.-]+@[\w.-]+\b/g) || [];
    const phishingLinks = message.match(/https?:\/\/[^\s]+/g) || [];

    // Reply
    const agentReply = isScam
      ? "I am interested. Please share the bank or UPI details to proceed."
      : "Okay, tell me more.";

    // Send JSON response
    return res.status(200).json({
      is_scam: isScam,
      confidence: Math.min(hits / 5, 1),
      conversation_active: isScam,
      extracted_intelligence: {
        bank_accounts: isScam ? bankAccounts : [],
        upi_ids: isScam ? upiIds : [],
        phishing_links: isScam ? phishingLinks : [],
      },
      agent_reply: agentReply,
    });
  } catch (err) {
    console.error("🔥 HONEYPOT ERROR:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
