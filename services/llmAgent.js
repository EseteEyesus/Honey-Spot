const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateLLMReply(conversation) {
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

module.exports = { generateLLMReply };
