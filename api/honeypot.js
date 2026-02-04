import OpenAI from "openai";

// Optional: initialize OpenAI if you want LLM replies
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // set in Vercel
});

// In-memory conversation store
const conversations = new Map();
function getConversation(id) {
  if (!conversations.has(id)) {
    conversations.set(id, {
      messages: [],
      scamDetected: false,
      createdAt: Date.now(),
      extracted: {
        bankAccounts: [],
        upiIds: [],
        urls: [],
      },
    });
  }
  return conversations.get(id);
}

// Fallback replies for honeypot
function fallbackReply() {
  const replies = [
    "Please explain more, I want to be sure.",
    "Okay, what details do you need from me?",
    "Can you send the account or UPI details?",
    "Please share the link so I can continue.",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

// Simple scam detection
function detectScam(message) {
  const scamKeywords = [
    "urgent",
    "account blocked",
    "verify now",
    "click link",
    "otp",
    "bank",
    "upi",
    "refund",
    "win",
    "prize",
  ];

  const lower = message.toLowerCase();
  let score = 0;
  scamKeywords.forEach((word) => {
    if (lower.includes(word)) score++;
  });

  return {
    isScam: score >= 2,
    confidence: Math.min(score / 5, 1),
  };
}

// Extract intelligence from message
function extractInfo(message) {
  const bankRegex = /\b\d{9,18}\b/g;
  const upiRegex = /\b[\w.-]+@[\w.-]+\b/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return {
    bank_accounts: message.match(bankRegex) || [],
    upi_ids: message.match(upiRegex) || [],
    phishing_links: message.match(urlRegex) || [],
  };
}

// Optional: LLM reply generator
async function generateLLMReply(conversation) {
  if (!openai) return fallbackReply();

  const messages = conversation.messages.slice(-6).map((msg) => ({
    role: "user",
    content: msg,
  }));

  const systemPrompt = `
You are a normal human chatting casually.
You are NOT aware this is a scam.
Politely ask for details like account number, UPI ID, or link.
Never accuse or warn.
Be simple and realistic.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}

// API handler
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

    // 3️⃣ Parse body safely
    const body = req.body;
    if (!body || !body.message) {
      return res.status(400).json({ error: "Message is required" });
    }
    const message = body.message;

    // 4️⃣ Scam detection
    const scamResult = detectScam(message);
    const isScam = scamResult.isScam;

    // 5️⃣ Extract intelligence if scam
    const extractedIntelligence = isScam
      ? extractInfo(message)
      : {
          bank_accounts: [],
          upi_ids: [],
          phishing_links: [],
        };

    // 6️⃣ Get conversation store
    const conversation = getConversation("default");
    conversation.messages.push(message);

    // 7️⃣ Generate reply
    let agentReply = "";
    try {
      agentReply = isScam
        ? await generateLLMReply(conversation)
        : fallbackReply();
    } catch {
      agentReply = isScam
        ? "I am interested. Please share your bank or UPI details to proceed."
        : "Okay, thank you.";
    }

    // 8️⃣ Send response
    return res.status(200).json({
      is_scam: isScam,
      confidence: scamResult.confidence,
      conversation_active: isScam,
      extracted_intelligence: extractedIntelligence,
      agent_reply: agentReply,
    });
  } catch (err) {
    console.error("🔥 Honeypot crashed:", err);
    return res.status(500).json({
      error: "Internal Server Error",
      message: err.message,
    });
  }
}
