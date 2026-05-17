import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useState, useEffect } from 'react';
// ✅ Modular Imports (Warnings हटाने के लिए)
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithPhoneNumber, 
  getIdToken,
  signOut,
  FirebaseAuthTypes 
} from '@react-native-firebase/auth';
import api from '../services/api';

interface AuthContextType {
  user: any | null;
  isAuthenticated: boolean;
  isLoadingAuth: boolean;
  sendOtp: (phoneNumber: string) => Promise<void>;
  verifyOtp: (otpCode: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUserStatus: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [confirm, setConfirm] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);

  // ✅ Auth instance को एक बार इनिशियलाइज़ करें
  const auth = getAuth();

  useEffect(() => {
    // 🚀 Firebase Modular Listener (onAuthStateChanged का नया सिंटैक्स)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserWithBackend(firebaseUser);
      } else {
        setUser(null);
        delete api.defaults.headers.common['Authorization'];
      }
      setIsLoadingAuth(false);
    });
    return unsubscribe;
  }, []);
const syncUserWithBackend = async (firebaseUser: FirebaseAuthTypes.User) => {
    try {
      // ✅ getIdToken(true) वार्निंग फ्री है
      const token = await getIdToken(firebaseUser);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const res = await api.get('/api/users/me'); 
      const fullUserData = res.data?.user || res.data;
      
      if (fullUserData) {
        // ✅ firebaseUser.toJSON() की जगह सीधे डेटा को मर्ज करें
        setUser({
          uid: firebaseUser.uid,
          phoneNumber: firebaseUser.phoneNumber,
          ...fullUserData           
        });
      } else {
        setUser({ uid: firebaseUser.uid, phoneNumber: firebaseUser.phoneNumber });
      }

      // 🚨 PUSH NOTIFICATION TOKEN SYNC LOGIC (The Solution) 🚨
      try {
        // 1. App se naya push token nikaalein
        const expoTokenResponse = await Notifications.getExpoPushTokenAsync();
        const fcmTokenForBackend = expoTokenResponse.data;

        if (fcmTokenForBackend) {
          console.log("📱 [AuthContext]: Generated Push Token:", fcmTokenForBackend);
          
          // 2. Backend ko API call bhejkar database mein token save karwayein
          // Note: Apne backend ke sahi route ke hisab se path set karein (jaise '/api/users/update-token')
          await api.post('/api/users/update-token', { fcmToken: fcmTokenForBackend });
          console.log("🚀 [AuthContext]: Token successfully synced with Database!");
        }
      } catch (tokenErr) {
        // Ise alag try-catch mein rakha hai taaki agar notification permission na ho, toh login na ruke
        console.error("⚠️ [AuthContext] Failed to sync push token:", tokenErr);
      }

    } catch (err) {
      console.error("Sync Error:", err);
      setUser({ uid: firebaseUser.uid, phoneNumber: firebaseUser.phoneNumber });
    }
  };
  
  const sendOtp = async (phoneNumber: string) => {
    try {
      // ✅ Modular SDK: signInWithPhoneNumber(auth, ...)
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber);
      setConfirm(confirmation);
    } catch (error: any) {
      console.error("Firebase Send OTP Error:", error.code, error.message);
      throw error;
    }
  };

  const verifyOtp = async (otpCode: string) => {
    try {
      if (!confirm) {
        throw new Error("Confirmation object missing. Try sending OTP again.");
      }
      
      const credential = await confirm.confirm(otpCode);
      if (credential?.user) {
        await syncUserWithBackend(credential.user);
        setConfirm(null);
      }
    } catch (error: any) {
      console.error("OTP Verification Error:", error.code, error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // ✅ Modular SDK: signOut(auth)
      await signOut(auth);
      setConfirm(null);
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const refreshUserStatus = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      await syncUserWithBackend(currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoadingAuth, 
      sendOtp,
      verifyOtp,
      logout,
      refreshUserStatus 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};