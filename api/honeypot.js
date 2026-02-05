// Serverless Honeypot API for Vercel
export default async function handler(req, res) {
  try {
    // 1️⃣ Only allow POST
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // 2️⃣ API Key check
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 3️⃣ Parse body safely
    const message = req.body?.message?.trim() || "";

    // 4️⃣ If no message → tester ping
    if (!message) {
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

    // 5️⃣ Scam detection keywords
    const keywords = [
      "otp",
      "bank",
      "verify",
      "urgent",
      "click",
      "upi",
      "refund",
      "account",
      "win",
      "prize",
    ];

    const lower = message.toLowerCase();
    const hits = keywords.filter((k) => lower.includes(k)).length;
    const isScam = hits >= 2;

    // 6️⃣ Extract intelligence if scam
    const bankAccounts = message.match(/\b\d{9,18}\b/g) || [];
    const upiIds = message.match(/\b[\w.-]+@[\w.-]+\b/g) || [];
    const phishingLinks = message.match(/https?:\/\/[^\s]+/g) || [];

    // 7️⃣ Agent reply
    const agentReply = isScam
      ? "I am interested. Please share the bank or UPI details to proceed."
      : ["Okay, tell me more.", "Alright, continue please.", "Thanks, go on."].sort(() => 0.5 - Math.random())[0];

    // 8️⃣ Send response
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
