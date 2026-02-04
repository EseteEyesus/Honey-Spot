function fallbackReply() {
  const replies = [
    "Please explain more, I want to be sure.",
    "Okay, what details do you need from me?",
    "Can you send the account or UPI details?",
    "Please share the link so I can continue.",
  ];

  return replies[Math.floor(Math.random() * replies.length)];
}

module.exports = { fallbackReply };
