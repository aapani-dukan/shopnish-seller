import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext'; // रास्ता अपनी फोल्डर स्ट्रक्चर के हिसाब से चेक कर लें

/**
 * useAuth Custom Hook
 * इसका उपयोग करके आप यूजर का डेटा, लॉगिन/लॉगआउट फंक्शन्स 
 * और लोडिंग स्टेट को किसी भी स्क्रीन पर एक्सेस कर सकते हैं।
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  // अगर किसी ने AuthProvider के बाहर useAuth इस्तेमाल किया तो यह एरर पकड़ेगा
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};