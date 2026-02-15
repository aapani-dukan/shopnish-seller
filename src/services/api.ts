import axios from "axios";
import { getAuth } from "@react-native-firebase/auth";

const api = axios.create({
  baseURL: "https://shopnish-seprate.onrender.com", 
  timeout: 15000, 
  headers: {
    "Content-Type": "application/json",
  },
});

// 🚀 Request Interceptor: Auto-attach Firebase Token
api.interceptors.request.use(
  async (config) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (user) {
        const token = await user.getIdToken(); 
        
        if (token) {
          // ✅ Fix: Check karein ki headers exist karte hain, nahi toh naya object banayein
          config.headers = config.headers || {};
          
          // Ab safely set karein
          config.headers.Authorization = `Bearer ${token}`;
          
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
// 📥 Response Interceptor: Error Handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    if (status === 403) {
      // 💡 403 ka matlab hai token sahi hai par Permission nahi hai (e.g. Seller not approved)
      console.error("🚫 [API] Forbidden: Access Denied / Seller Not Approved");
    }
    
    if (status === 401) {
      // 💡 401 ka matlab hai Session expire ho gaya ya token invalid hai
      console.log("🚫 [API] Session Expired / Unauthorized");
      // Yahan aap user ko logout ya login screen par bhej sakte hain
    }

    return Promise.reject(error);
  }
);

export default api;