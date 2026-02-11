/**
 * अगले सोमवार (Settlement Day) की तारीख कैलकुलेट करने का फंक्शन
 */
export const getNextSettlementDate = (): string => {
  const now = new Date();
  const resultDate = new Date();
  
  // सोमवार (Monday) का इंडेक्स 1 होता है
  const daysUntilMonday = (1 + 7 - now.getDay()) % 7;
  
  // अगर आज सोमवार है, तो अगले 7 दिन बाद का दिखाएं
  const daysToAdd = daysUntilMonday === 0 ? 7 : daysUntilMonday;
  
  resultDate.setDate(now.getDate() + daysToAdd);

  // '16 Feb 2026' जैसा फॉर्मेट लौटाता है
  return resultDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};