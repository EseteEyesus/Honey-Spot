require("dotenv").config();
const express = require("express");

const app = express();
app.use(express.json());

// API Key middleware
app.use((req, res, next) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
});

// Honeypot endpoint
app.post("/honeypot", (req, res) => {
  const message = (req.body?.message || "").trim();

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

  const keywords = ["otp","bank","verify","urgent","click","upi","refund","account","win","prize"];
  const lower = message.toLowerCase();
  const hits = keywords.filter(k => lower.includes(k)).length;
  const isScam = hits >= 2;

  const bankAccounts = message.match(/\b\d{9,18}\b/g) || [];
  const upiIds = message.match(/\b[\w.-]+@[\w.-]+\b/g) || [];
  const phishingLinks = message.match(/https?:\/\/[^\s]+/g) || [];

  const agentReply = isScam
    ? "I am interested. Please share the bank or UPI details to proceed."
    : ["Okay, tell me more.", "Alright, continue please.", "Thanks, go on."].sort(() => 0.5 - Math.random())[0];

  res.status(200).json({
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
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Honey-Pot API listening on port ${PORT}`));
