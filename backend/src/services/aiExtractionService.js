const extractIssueDetails = (messageText, ocrText = '') => {
  // Mock AI Extraction based on heuristics for demonstration
  // In a production scenario, this would call OpenAI or Gemini API
  const lowerMsg = (messageText + ' ' + ocrText).toLowerCase();

  let pageName = 'General';
  let title = messageText.length > 50 ? messageText.substring(0, 47) + '...' : messageText;
  let priority = 'Medium';

  // Keyword matching for Page Name
  if (lowerMsg.includes('login')) pageName = 'Login';
  else if (lowerMsg.includes('pos')) pageName = 'POS';
  else if (lowerMsg.includes('customer')) pageName = 'Customer';
  else if (lowerMsg.includes('dashboard')) pageName = 'Dashboard';
  else if (lowerMsg.includes('payment')) pageName = 'Payment';

  // Keyword matching for Priority
  if (lowerMsg.includes('critical') || lowerMsg.includes('error 500') || lowerMsg.includes('server error')) {
    priority = 'Critical';
  } else if (lowerMsg.includes('not working') || lowerMsg.includes('issue') || lowerMsg.includes('failed')) {
    priority = 'High';
  }

  return {
    pageName,
    title,
    priority,
    description: messageText
  };
};

module.exports = {
  extractIssueDetails
};
