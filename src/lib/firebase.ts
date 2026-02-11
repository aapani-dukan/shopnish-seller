import { 
  getAuth, 
  getIdToken,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  sendPasswordResetEmail, 
  signInWithPhoneNumber,
  FirebaseAuthTypes
} from '@react-native-firebase/auth';

// ✅ Auth instance को एक बार इनिशियलाइज़ करें (Permanent Fix)
const auth = getAuth();

/* ==========================================================================
   AUTH HELPERS (SELLER OPTIMIZED - MODERN SDK)
   ========================================================================== */

/**
 * Email Sign In
 */
export const signInWithEmail = async (email: string, password: string) => {
  try {
    // Modern Syntax
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // ✅ ULTRA-MODERN WAY (Warning-Free):
    // यहाँ 'user.getIdToken()' के बजाय 'getIdToken(user)' का इस्तेमाल करें
    const token = await getIdToken(userCredential.user);
    
    return { user: userCredential.user, token };
  } catch (error: any) {
    console.error("Firebase Login Error:", error.code);
    throw error;
  }
};
/**
 * Email Sign Up
 */
export const signUpWithEmail = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error: any) {
    console.error("Firebase Signup Error:", error.code);
    throw error;
  }
};

/**
 * Auth State Change Listener
 */
export const onAuthStateChange = (callback: (user: FirebaseAuthTypes.User | null) => void) => {
  // ✅ Modern Syntax: onAuthStateChanged(auth, callback)
  return onAuthStateChanged(auth, callback);
};

/**
 * Logout
 */
export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Firebase Logout Error:", error);
    throw error;
  }
};

/**
 * Password Reset
 */
export const sendPasswordReset = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

/**
 * Phone OTP Verification
 */
export const sendOtpToPhone = async (phoneNumber: string) => {
  try {
    const confirmation = await signInWithPhoneNumber(auth, phoneNumber);
    return confirmation;
  } catch (error: any) {
    console.error("Firebase SMS Error:", error.code);
    throw error;
  }
};

// Default Export (जरूरत पड़ने पर)
export default auth;