export default async function handler(req, res) {
  try {
    // 1️⃣ Allow only POST
    if (req.method !== "POST") {
      return res.status(405).json({
        status: "error",
        message: "Method not allowed"
      });
    }

    // 2️⃣ API KEY CHECK
    const apiKey = req.headers["x-api-key"];
    if (!apiKey || apiKey !== process.env.API_KEY) {
      return res.status(401).json({
        status: "error",
        message: "Invalid API key"
      });
    }

    // 3️⃣ READ REQUEST BODY
    const { sessionId, message, conversationHistory = [], metadata } = req.body;

    if (!sessionId || !message || !message.text) {
      return res.status(400).json({
        status: "error",
        message: "Malformed request"
      });
    }

    const scamText = message.text.toLowerCase();

    // 4️⃣ SIMPLE SCAM DETECTION
    const scamKeywords = [
      "blocked",
      "verify",
      "urgent",
      "upi",
      "account",
      "suspend",
      "bank"
    ];

    const isScam = scamKeywords.some(word => scamText.includes(word));

    // 5️⃣ EXTRACT INTELLIGENCE
    const extractedIntelligence = {
      bankAccounts: [],
      upiIds: [],
      phishingLinks: [],
      phoneNumbers: [],
      suspiciousKeywords: []
    };

    // Extract UPI IDs
    const upiRegex = /\b[\w.-]+@[\w.-]+\b/g;
    const upiMatches = scamText.match(upiRegex);
    if (upiMatches) extractedIntelligence.upiIds.push(...upiMatches);

    // Extract links
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const linkMatches = scamText.match(linkRegex);
    if (linkMatches) extractedIntelligence.phishingLinks.push(...linkMatches);

    // Extract phone numbers
    const phoneRegex = /\+?\d{10,13}/g;
    const phoneMatches = scamText.match(phoneRegex);
    if (phoneMatches) extractedIntelligence.phoneNumbers.push(...phoneMatches);

    // Extract keywords
    scamKeywords.forEach(word => {
      if (scamText.includes(word)) {
        extractedIntelligence.suspiciousKeywords.push(word);
      }
    });

    // 6️⃣ HUMAN-LIKE REPLY LOGIC
    let reply = "Okay";

    if (isScam && conversationHistory.length === 0) {
      reply = "Why will my account be blocked?";
    } else if (isScam && conversationHistory.length === 1) {
      reply = "I am confused, can you explain what I need to do?";
    } else if (isScam && conversationHistory.length >= 2) {
      reply = "I am worried, please help me fix this.";
    } else {
      reply = "Can you explain more?";
    }

    // 7️⃣ FINAL CALLBACK TO GUVI (after enough messages)
    if (isScam && conversationHistory.length >= 3) {
      const payload = {
        sessionId: sessionId,
        scamDetected: true,
        totalMessagesExchanged: conversationHistory.length + 1,
        extractedIntelligence,
        agentNotes: "Scammer used urgency and account threat tactics"
      };

      // Send callback (do not crash if it fails)
      try {
        await fetch("https://hackathon.guvi.in/api/updateHoneyPotFinalResult", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        console.error("Callback failed", err);
      }
    }

    // 8️⃣ SUCCESS RESPONSE (THIS IS WHAT THEY CHECK)
    return res.status(200).json({
      status: "success",
      reply
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error"
    });
  }
}

