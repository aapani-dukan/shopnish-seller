import React, { createContext, useContext, useState, useEffect } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
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

  useEffect(() => {
    // 🚀 Firebase Real-time Listener
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserWithBackend(firebaseUser);
      } else {
        setUser(null);
        // API Headers साफ करें
        delete api.defaults.headers.common['Authorization'];
      }
      setIsLoadingAuth(false);
    });
    return unsubscribe;
  }, []);

  const syncUserWithBackend = async (firebaseUser: FirebaseAuthTypes.User) => {
    try {
      const token = await firebaseUser.getIdToken();
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // बैकएंड से सेलर का एक्स्ट्रा डेटा लाएं
      const res = await api.get('/api/users/me'); 
      const fullUserData = res.data?.user || res.data;
      
      if (fullUserData) {
        setUser({
          ...firebaseUser.toJSON(), 
          ...fullUserData           
        });
      } else {
        setUser(firebaseUser.toJSON());
      }
    } catch (err) {
      console.error("Sync Error:", err);
      setUser(firebaseUser.toJSON());
    }
  };

  const sendOtp = async (phoneNumber: string) => {
    try {
      const confirmation = await auth().signInWithPhoneNumber(phoneNumber);
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
        setConfirm(null); // ✅ वेरिफिकेशन के बाद कंफर्मेशन स्टेट साफ़ करें
      }
    } catch (error: any) {
      console.error("OTP Verification Error:", error.code, error.message);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth().signOut();
      setConfirm(null); // ✅ लॉगआउट पर स्टेट साफ़ करें
    } catch (err) {
      console.error("Logout Error:", err);
    }
  };

  const refreshUserStatus = async () => {
    const currentUser = auth().currentUser;
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