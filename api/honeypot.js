// 🔴 REQUIRED for Vercel (fixes 500 error)
export const config = {
  runtime: "nodejs",
};

import OpenAI from "openai";

/* =========================
   OpenAI (safe init)
========================= */
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

/* =========================
   In-memory conversation store
========================= */
const conversations = new Map();

function getConversation(id) {
  if (!conversations.has(id)) {
    conversations.set(id, {
      messages: [],
      createdAt: Date.now(),
    });
  }
  return conversations.get(id);
}

/* =========================
   Fallback honeypot replies
========================= */
function fallbackReply() {
  const replies = [
    "Please explain more.",
    "Okay, what details do you need?",
    "Can you share the account or UPI details?",
    "Please send the link to continue.",
  ];
  return replies[Math.floor(Math.random() * replies.length)];
}

/* =========================
   Scam detection
========================= */
function detectScam(message) {
  const keywords = [
    "urgent",
    "account blocked",
    "verify",
    "click",
    "otp",
    "bank",
    "upi",
    "refund",
    "win",
    "prize",
  ];

  const text = message.toLowerCase();
  let score = 0;

  keywords.forEach((k) => {
    if (text.includes(k)) score++;
  });

  return {
    isScam: score >= 2,
    confidence: Math.min(score / 5, 1),
  };
}

/* =========================
   Intelligence extraction
========================= */
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

/* =========================
   LLM reply (optional)
========================= */
async function generateLLMReply(conversation) {
  if (!openai) return fallbackReply();

  const messages = conversation.messages.slice(-6).map((m) => ({
    role: "user",
    content: m,
  }));

  const systemPrompt = `
You are a normal human chatting casually.
You are NOT aware this is a scam.
Politely ask for bank, UPI, or link.
Never warn or accuse.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }, ...messages],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}

/* =========================
   API Handler
========================= */
export default async function handler(req, res) {
  try {
    /* 1️⃣ Allow POST only */
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    /* 2️⃣ API key authentication */
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    /* 3️⃣ SAFE body handling (tester sends NO body) */
    const body = req.body || {};
    const message = body.message || "";

    if (!message) {
      return res.status(200).json({
        status: "ok",
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

    /* 4️⃣ Detect scam */
    const scamResult = detectScam(message);

    /* 5️⃣ Extract intelligence */
    const extracted = scamResult.isScam
      ? extractInfo(message)
      : {
          bank_accounts: [],
          upi_ids: [],
          phishing_links: [],
        };

    /* 6️⃣ Conversation memory */
    const conversation = getConversation("default");
    conversation.messages.push(message);

    /* 7️⃣ Generate reply */
    let reply;
    try {
      reply = scamResult.isScam
        ? await generateLLMReply(conversation)
        : fallbackReply();
    } catch {
      reply =
        "I am interested. Please share your bank or UPI details to proceed.";
    }

    /* 8️⃣ Final response */
    return res.status(200).json({
      is_scam: scamResult.isScam,
      confidence: scamResult.confidence,
      conversation_active: scamResult.isScam,
      extracted_intelligence: extracted,
      agent_reply: reply,
    });
  } catch (err) {
    console.error("🔥 Honeypot crashed:", err);
    return res.status(500).json({
      error: "Internal Server Error",
    });
  }
}
