import axios from "axios";
import auth from "@react-native-firebase/auth";

const api = axios.create({
  baseURL: "https://shopnish-seprate.onrender.com", 
  timeout: 15000, 
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  async (config) => {
    try {
      const user = auth().currentUser;
      if (user) {
        // ताज़ा टोकन लेना
        const token = await user.getIdToken(true); 
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          
          // ✅ FormData (Images) के लिए Content-Type को ऑटो-मैनेज करें
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
    // अगर सर्वर से कोई रिस्पॉन्स न मिले (Network Error)
    if (!error.response) {
      console.warn("🌐 [API] Network Error - Server Unreachable");
    }
    
    if (error.response && error.response.status === 401) {
      console.log("🚫 [API] Session Expired");
      // यहाँ logoutUser() कॉल करने की ज़रूरत नहीं क्योंकि queryClient.ts इसे संभाल लेगा
    }
    return Promise.reject(error);
  }
);

export default api;