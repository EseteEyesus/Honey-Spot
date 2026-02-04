function extractInfo(message, extracted) {
  const bankRegex = /\b\d{9,18}\b/g;
  const upiRegex = /\b[\w.-]+@[\w.-]+\b/g;
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  const banks = message.match(bankRegex) || [];
  const upis = message.match(upiRegex) || [];
  const urls = message.match(urlRegex) || [];

  extracted.bankAccounts.push(...banks);
  extracted.upiIds.push(...upis);
  extracted.urls.push(...urls);
}

module.exports = { extractInfo };
