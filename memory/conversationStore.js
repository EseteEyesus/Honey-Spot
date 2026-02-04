const conversations = new Map();

function getConversation(id) {
  if (!conversations.has(id)) {
    conversations.set(id, {
      messages: [],
      scamDetected: false,
      createdAt: Date.now()
,
      extracted: {
        bankAccounts: [],
        upiIds: [],
        urls: [],
      },
    });
  }
  return conversations.get(id);
}

module.exports = { getConversation };
