import axios from "axios";
// ✅ Modular imports
import { getAuth,getIdToken } from "@react-native-firebase/auth";

const api = axios.create({
  baseURL: "https://shopnish-seprate.onrender.com", 
  timeout: 15000, 
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config: any) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        // 🔥 बदलाव 1: getIdToken(true) के बजाय बिना पैरामीटर के यूज़ करें 
        // अगर बैकएंड 403 दे रहा है, तो नया टोकन लेने के लिए इसे ऐसे लिखें:
        const token = await getIdToken(user); 
        
        if (token) {
          // 🔥 बदलाव 2: पुराने Axios में headers को सीधे असाइन करना बेहतर है
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${token}`,
          };
          
          if (config.data instanceof FormData) {
            config.headers["Content-Type"] = "multipart/form-data";
          }
        }
      }
    } catch (err) {
      console.error("❌ [API] Token fetching error:", err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 💡 अगर 403 आ रहा है, तो इसका मतलब टोकन गलत नहीं है, 
    // बल्कि बैकएंड आपको उस डेटा का एक्सेस नहीं दे रहा।
    if (error.response?.status === 403) {
      console.error("🚫 [API] Forbidden: Check User Permissions/Approval");
    }
    
    if (error.response?.status === 401) {
      console.log("🚫 [API] Session Expired");
    }
    return Promise.reject(error);
  }
);

export default api;