export function detectScam(message) {
  const scamKeywords = [
    "urgent",
    "account blocked",
    "verify now",
    "click link",
    "otp",
    "bank",
    "upi",
    "refund",
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
